"""Daily rechecks + bounded discovery, conservative merges, reproducible publication."""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import re
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from build import read_js, rebuild, validate, write_json
from source import KINDS, Fetcher, admission, city_searches, detail_url, discover_links, normal, parse_detail


def fingerprint(p):
    # Conservative cross-feed deduplication: reject possibly identical units.
    return (p.get('type'), normal(p.get('districtJa', '')), normal(p.get('stationJa', '')),
            round(p.get('landM2') or 0, 1), round(p.get('buildingM2') or 0, 1))


def identify(p, facts):
    if p['type'] != facts['type'] or normal(p.get('districtJa', '')) not in normal(facts.get('address', '')):
        return False
    if p.get('stationJa') != facts.get('stationJa'):
        return False
    for key in ('landM2', 'buildingM2'):
        if p.get(key) and (not facts.get(key) or abs(p[key] - facts[key]) > 0.1):
            return False
    return True


def new_record(facts, data, today):
    p = {key: facts[key] for key in ('type', 'title', 'districtJa', 'priceMan', 'priceFrom', 'landM2', 'buildingM2', 'stationJa', 'lineJa', 'walkMin', 'layout', 'built', 'zoning')}
    p.update(id='auto-' + hashlib.sha256(facts['url'].encode()).hexdigest()[:12],
             district=p['districtJa'], station=p['stationJa'], line=p['lineJa'],
             firstSeenOn=today, isNew=True, highlights=[], majorCautions=1,
             cautions=['Automatically collected portal facts; legal restrictions, rebuilding rights and fees require confirmation with the agent.', facts['legal']],
             source={'name': 'SUUMO', 'url': facts['url'], 'verified': 'detail', 'infoDate': facts['infoDate'], 'checkedOn': today})
    for existing in data['properties']:
        if existing.get('stationJa') == p['stationJa']:
            p['station'], p['line'] = existing['station'], existing.get('line', p['line'])
            break
    if p['type'] != 'land':
        year = int(re.search(r'(\d{4})年', p['built']).group(1))
        p['ageYears'] = max(0, int(today[:4]) - year)
    return p


def refresh_city(data, state, today, fetch, candidates):
    out, state = copy.deepcopy(data), copy.deepcopy(state)
    report = {'checked': 0, 'active': 0, 'unknown': 0, 'skipped': 0, 'updated': 0, 'removed': 0, 'added': 0, 'candidates': [], 'errors': [], 'changes': []}
    urls = Counter(detail_url(p['source']['url']) or p['source']['url'] for p in data['properties'])
    kept = []
    for p in out['properties']:
        url = detail_url(p['source']['url'])
        if not url or p['source'].get('verified') != 'detail' or urls[url] > 1:
            report['skipped'] += 1
            kept.append(p)
            continue
        report['checked'] += 1
        result = fetch(url)
        # Detail redirects to a portal home or another record do not verify this record.
        facts = parse_detail(result.body, url, data['site']['areaJa']) if result.status == 200 and detail_url(result.url) == url else {'status': 'unknown'}
        if facts['status'] == 'withdrawn':
            yesterday = (date.fromisoformat(today) - timedelta(days=1)).isoformat()
            if state.get(url, {}).get('withdrawnOn') == yesterday:
                report['removed'] += 1
                report['changes'].append({'action': 'removed', 'id': p['id'], 'url': url, 'reason': 'Explicit withdrawal on consecutive days'})
                state.pop(url, None)
                continue
            state[url] = {'withdrawnOn': today}
            report['unknown'] += 1
        elif facts['status'] == 'active' and identify(p, facts) and facts.get('infoDate') and facts['infoDate'] <= today:
            state.pop(url, None)
            report['active'] += 1
            before = copy.deepcopy(p)
            old = p['priceMan']
            p['priceMan'] = facts['priceMan']
            p['source']['checkedOn'] = today
            p['source']['infoDate'] = facts['infoDate']
            p['walkMin'] = facts['walkMin']
            if old > p['priceMan']:
                p['priceDropMan'] = old - p['priceMan']
                p['priceChangedOn'] = today
            elif old < p['priceMan']:
                p.pop('priceDropMan', None)
                p['priceChangedOn'] = today
            if p.get('firstSeenOn'):
                p['isNew'] = (date.fromisoformat(today) - date.fromisoformat(p['firstSeenOn'])).days < 7
            if p != before:
                report['updated'] += 1
                report['changes'].append({'action': 'verified', 'id': p['id'], 'url': url, 'previousPriceMan': old, 'priceMan': p['priceMan'], 'infoDate': facts['infoDate']})
        else:
            state.pop(url, None)  # An unknown intervening check breaks withdrawal confirmation.
            report['unknown'] += 1
            report['errors'].append({'id': p['id'], 'url': url, 'reason': result.error or 'No unambiguous matching detail facts'})
        kept.append(p)
    out['properties'] = kept
    known = {detail_url(p['source']['url']) for p in kept}
    fingerprints = {fingerprint(p) for p in kept}
    for raw_url in candidates:
        url = detail_url(raw_url)
        if not url or url in known:
            continue
        known.add(url)
        result = fetch(url)
        facts = parse_detail(result.body, url, data['site']['areaJa']) if result.status == 200 and detail_url(result.url) == url else {'status': 'unknown'}
        if admission(facts, data) and facts['infoDate'] <= today and fingerprint(facts) not in fingerprints:
            p = new_record(facts, data, today)
            out['properties'].append(p)
            fingerprints.add(fingerprint(p))
            report['added'] += 1
            report['changes'].append({'action': 'added', 'property': p})
        else:
            report['candidates'].append({'url': url, 'reason': result.error or 'Incomplete, ambiguous, duplicate or outside brief'})
    # Preserve the editorial research date: a successful URL check is not a full
    # re-research of all highlights, cautions, benchmarks or index-only records.
    validate(out)
    return out, state, report


def discover(data, city, fetcher, limit):
    candidates, searches = [], []
    prefecture = city['prefecture'].lower()
    local_name = normal(data['site']['areaJa']).removeprefix(normal(city['prefectureJa']))
    failures = []
    for category in KINDS:
        prefecture_url = f'https://suumo.jp/{category}/{prefecture}/'
        result = fetcher.fetch(prefecture_url)
        urls = city_searches(result.body, prefecture_url, local_name) if result.status == 200 else []
        if not urls:
            failures.append({'url': prefecture_url, 'reason': result.error or 'City search links not found'})
        for url in urls:
            result = fetcher.fetch(url)
            found = discover_links(result.body, url) if result.status == 200 else []
            searches.append({'url': url, 'candidates': len(found), 'status': result.status, 'error': result.error})
            # Spread the detail-check budget across the three property types.
            existing = {detail_url(p['source']['url']) for p in data['properties']}
            fresh = [u for u in found if u not in existing and u not in candidates]
            candidates.extend(fresh[:limit])
    return candidates, searches, failures


def run(args):
    root = Path(args.root)
    today = datetime.now(timezone(timedelta(hours=9))).date().isoformat()
    cities = read_js(root/'cities.js')
    if args.cities:
        names = set(args.cities.split(','))
        available = {c['slug'] for c in cities}
        if names - available:
            raise ValueError(f'Unknown cities: {sorted(names - available)}')
        cities = [c for c in cities if c['slug'] in names]
    state_path = root/'refresh/state.json'
    state = json.loads(state_path.read_text(encoding='utf-8')) if state_path.exists() else {}
    fetcher = Fetcher()
    report = {'date': today, 'dryRun': args.dry_run, 'cities': {}, 'totals': {}, 'discovery': {}}
    pending = {}
    for city in cities:
        if city.get('status') != 'live':
            continue
        slug = city['slug']
        path = root/slug/'data/properties.json'
        data = json.loads(path.read_text(encoding='utf-8'))
        if args.max_existing is not None:
            # Dry-run sampling only. The unvisited records remain untouched.
            checked_urls = set()
            existing_urls = {detail_url(p['source']['url']) for p in data['properties']}
            def sampled_fetch(url):
                if url not in existing_urls:
                    return fetcher.fetch(url)
                if url not in checked_urls and len(checked_urls) >= args.max_existing:
                    from source import Result
                    return Result(url, 0, '', 'Not checked in bounded dry-run sample')
                checked_urls.add(url)
                return fetcher.fetch(url)
            fetch = sampled_fetch
        else:
            fetch = fetcher.fetch
        candidates, searches, errors = discover(data, city, fetcher, args.max_new) if args.max_new else ([], [], [])
        updated, city_state, details = refresh_city(data, state.get(slug, {}), today, fetch, candidates)
        pending[path] = updated
        state[slug] = city_state
        report['cities'][slug] = details
        report['discovery'][slug] = {'searches': searches, 'errors': errors}
        write_json(Path(args.report), report)
        print(f'{slug}: checked={details["checked"]} active={details["active"]} unknown={details["unknown"]} added={details["added"]} removed={details["removed"]}', flush=True)
    for key in ('checked', 'active', 'unknown', 'skipped', 'updated', 'added', 'removed'):
        report['totals'][key] = sum(r[key] for r in report['cities'].values())
    # Report first so failures preserve evidence. Do not commit an all-failed refresh.
    write_json(Path(args.report), report)
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a', encoding='utf-8') as stream:
            stream.write(f'## Tadaima refresh — {today}\n\n' + '\n'.join(f'- {k}: {v}' for k, v in report['totals'].items()) + '\n\nBlocked/ambiguous sources retain their original records and dates. See the report artifact for discovery coverage and errors.\n')
    if not (report['totals']['active'] + report['totals']['added']):
        print('No live property facts verified. Existing published data was preserved.', flush=True)
        return 2
    if not args.dry_run:
        for path, updated in pending.items():
            write_json(path, updated)
        write_json(state_path, state)
        rebuild(root)
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', default='Tadaima')
    parser.add_argument('--report', default='tadaima-refresh/run-report.json')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--cities', help='Comma-separated city slugs; default all live editions')
    parser.add_argument('--max-existing', type=int, help='Bounded checks; only allowed with --dry-run')
    parser.add_argument('--max-new', type=int, default=2, help='Candidate detail checks per search page (default 2)')
    args = parser.parse_args()
    if args.max_new < 0 or (args.max_existing is not None and (args.max_existing < 1 or not args.dry_run)):
        parser.error('max-new must be nonnegative; max-existing must be positive and requires dry-run')
    return run(args)


if __name__ == '__main__':
    raise SystemExit(main())
