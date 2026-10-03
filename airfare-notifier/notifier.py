"""Small free-source airfare alert CLI; never purchases or reserves tickets."""
from __future__ import annotations
import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from core import Config, select, summary, search_dates
from persistence import FileState, GitHubState

ROOT = Path(__file__).resolve().parent
# Reuse existing Telegram transport, redacted GitHub errors, and run locking.
sys.path.insert(0, str(ROOT.parent / 'shopping-notifier'))
from delivery import send_telegram
from state import GitHubAPI, RunLock
JST = timezone(timedelta(hours=9), 'Asia/Tokyo')
SOURCE = 'https://mcp.octotrip.app/flights/mcp'


class SourceError(RuntimeError): pass


def parse_response(text):
    try:
        payload = json.loads(text) if text.lstrip().startswith('{') else json.loads(next(
            line[6:] for line in text.splitlines() if line.startswith('data: ')))
        if 'error' in payload: raise SourceError('OctoTrip: protocol error')
        result = payload['result']
        content = result.get('structuredContent', {}).get('result')
        if content is None:
            content = next(item['text'] for item in result['content'] if item.get('type') == 'text')
        data = json.loads(content) if isinstance(content, str) else content
        if data.get('error') == 'no_results': return data
        if result.get('isError') or data.get('error'): raise SourceError('OctoTrip: search error')
        if not isinstance(data['results'], list) or not isinstance(data['query'], dict): raise ValueError()
        return data
    except SourceError: raise
    except (ValueError, KeyError, TypeError, AttributeError, StopIteration):
        raise SourceError('OctoTrip: invalid response') from None


class OctoTrip:
    def __init__(self, cfg, *, opener=urlopen, sleep=time.sleep):
        self.cfg, self.opener, self.sleep, self.last_request = cfg, opener, sleep, 0.0

    def __call__(self, departure, returning):
        args = {'origin': 'NRT', 'destination': 'MNL', 'departure_date': departure.isoformat(),
                'return_date': returning.isoformat(), 'adults': 1, 'children': 0, 'infants': 0,
                'trip_class': 'Y', 'currency': 'JPY', 'locale': 'en'}
        body = {'jsonrpc': '2.0', 'id': 1, 'method': 'tools/call',
                'params': {'name': 'search', 'arguments': args}}
        request = Request(SOURCE, data=json.dumps(body).encode(),
                          headers={'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream',
                                   'User-Agent': 'DenLabAirfareNotifier/1.0'})
        for attempt in range(self.cfg.request_attempts):
            delay = 1.1 - (time.monotonic() - self.last_request)
            if delay > 0: self.sleep(delay)
            self.last_request = time.monotonic()
            try:
                with self.opener(request, timeout=self.cfg.request_timeout_seconds) as response:
                    content = response.read(2 * 1024 * 1024 + 1)
                if len(content) > 2 * 1024 * 1024: raise SourceError('OctoTrip: oversized response')
                data = parse_response(content.decode('utf-8'))
                if data.get('error') == 'no_results': return []
                if any(data['query'].get(key) != value for key, value in args.items()):
                    raise SourceError('OctoTrip: search scope mismatch')
                # Never accept a result with dates other than the requested pair.
                return [f for f in data['results'] if isinstance(f, dict)
                        and isinstance(f.get('outbound'), dict) and isinstance(f.get('return'), dict)
                        and f['outbound'].get('departure_date') == args['departure_date']
                        and f['return'].get('departure_date') == args['return_date']]
            except HTTPError as exc:
                code = exc.code; exc.close()
                if code not in (429, 500, 502, 503, 504) or attempt == self.cfg.request_attempts - 1:
                    raise SourceError(f'OctoTrip: HTTP {code}') from None
            except (URLError, TimeoutError, OSError):
                if attempt == self.cfg.request_attempts - 1: raise SourceError('OctoTrip: network failure') from None
            if attempt < self.cfg.request_attempts - 1: self.sleep(2 ** attempt)
        raise SourceError('OctoTrip: retries exhausted')


def run(cfg, state, search, sender, now, *, pairs=None, dry_run=False, clock=None):
    day = now.date().isoformat()
    history = state.load()  # Fail closed even if no target is found.
    if not dry_run and day in history['summaries']:
        print('Daily delivery already claimed or sent; skipped.')
        return 0
    pairs = pairs if pairs is not None else search_dates(cfg, now.date())
    errors, candidates, refreshed = [], [], []
    for dep, ret in pairs:
        try:
            winner = select(search(dep, ret), cfg, now.date())
            if winner: candidates.append((dep, ret, winner))
        except Exception as exc:
            # Never log arbitrary exception messages: URLs may contain credentials.
            errors.append('OctoTrip: ' + type(exc).__name__)
    # Refresh each date-pair winner so changed prices cannot distort ranking.
    for dep, ret, candidate in candidates:
        try:
            winner = select(search(dep, ret), cfg, now.date())
            if winner: refreshed.append(winner)
        except Exception as exc: errors.append('OctoTrip refresh: ' + type(exc).__name__)
    verified_at = clock() if clock else now
    if verified_at.date() != now.date(): raise RuntimeError('Japan calendar day changed; rerun before delivery')
    winner = min(refreshed, key=lambda f: f.price, default=None)
    text = summary(winner, cfg, verified_at, errors, len(pairs))
    report = {'day': day, 'checked_dates': [[dep.isoformat(), ret.isoformat()] for dep, ret in pairs],
              'source': 'OctoTrip', 'errors': sorted(set(errors)), 'candidate_dates': len(candidates),
              'refreshed_valid_dates': len(refreshed), 'displayed_total_jpy': str(winner.price) if winner else None,
              'verified_at': verified_at.isoformat(), 'dry_run': dry_run}
    print(json.dumps(report))
    if dry_run:
        print(text.encode('ascii', errors='backslashreplace').decode() if not (sys.stdout.encoding or 'utf-8').lower().startswith('utf') else text)
        return int(bool(errors))
    should_send = cfg.daily_summary or (winner is not None and winner.price <= cfg.threshold_jpy)
    if should_send:
        if state.claim('summaries', day, verified_at):
            sender(text)
            state.acknowledge('summaries', day)
    elif errors:
        key = day + ':search-failed'
        if state.claim('operations', key, verified_at):
            sender('Airfare notifier — Search failed.\n' + '\n'.join(sorted(set(errors)))
                   + '\nCoverage incomplete; this is an error, not no deals.\n' + verified_at.isoformat())
            state.acknowledge('operations', key)
    else: print('No source-listed fare at or below the threshold; no alert sent.')
    return int(bool(errors))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, default=ROOT / 'config.json')
    parser.add_argument('--state', type=Path, default=ROOT / 'state.json')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--github-state', action='store_true')
    args = parser.parse_args()
    cfg = Config(**json.loads(args.config.read_text(encoding='utf-8')))
    # Dry runs never access remote state, read bot secrets, or claim a notification.
    state = (GitHubState(os.environ.get('GITHUB_REPOSITORY', ''), args.state, GitHubAPI())
             if args.github_state and not args.dry_run else FileState(args.state))
    if not args.dry_run and not all(os.environ.get(key, '').strip() for key in ('TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID')):
        raise RuntimeError('Existing Telegram secrets are missing; delivery stopped')
    with RunLock(args.state.with_suffix('.run.lock')):
        return run(cfg, state, OctoTrip(cfg), send_telegram, datetime.now(JST), dry_run=args.dry_run,
                   clock=lambda: datetime.now(JST))


if __name__ == '__main__':
    try: sys.exit(main())
    except Exception as exc:
        print(f'ERROR: airfare run stopped ({type(exc).__name__}); inspect state before retrying.', file=sys.stderr)
        sys.exit(1)
