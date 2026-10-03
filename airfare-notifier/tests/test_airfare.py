import copy
import json
import sys
import tempfile
import unittest
from uuid import uuid4
from datetime import date, datetime, timezone, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from core import Config, select, summary, add_months, search_dates
from notifier import run
from persistence import FileState, GitHubState

NOW = datetime(2026, 10, 3, 7, tzinfo=timezone(timedelta(hours=9)))

def fare(price=25000):
    outbound = {'departure': 'NRT', 'arrival': 'MNL', 'departure_date': '2027-04-10',
                'arrival_date': '2027-04-10', 'departure_time': '13:45', 'arrival_time': '18:10',
                'stops': 0, 'legs': [{'flight_number': '5J5055', 'carrier': 'Cebu Pacific',
                                    'departure': 'NRT', 'arrival': 'MNL'}]}
    returning = {'departure': 'MNL', 'arrival': 'NRT', 'departure_date': '2027-04-20',
                 'arrival_date': '2027-04-20', 'departure_time': '12:15', 'arrival_time': '18:00',
                 'stops': 0, 'legs': [{'flight_number': '5J5056', 'carrier': 'Cebu Pacific',
                                     'departure': 'MNL', 'arrival': 'NRT'}]}
    return {'outbound': outbound, 'return': returning, 'price': price, 'currency': 'JPY',
            'stops': 0, 'is_direct': True, 'baggage': 'No checked bag, Cabin bag: 6x7kg',
            'airline': 'Cebu Pacific', 'gate': 'Example seller',
            'booking_url': 'https://mcp.octotrip.app/flights/r/example', 'tags': ['direct']}

class CoreTests(unittest.TestCase):
    def setUp(self): self.cfg = Config()

    def test_exact_threshold_and_fraction_above(self):
        self.assertIn('🎯 Target price found', summary(select([fare()], self.cfg, NOW.date()), self.cfg, NOW, [], 1))
        text = summary(select([fare(25000.01)], self.cfg, NOW.date()), self.cfg, NOW, [], 1)
        self.assertIn('above budget', text)
        self.assertIn('¥1', text)

    def test_above_budget_fallback_is_cheapest_valid(self):
        winner = select([fare(32000), fare(26000)], self.cfg, NOW.date())
        self.assertEqual(str(winner.price), '26000')
        self.assertIn('¥1,000', summary(winner, self.cfg, NOW, [], 2))

    def test_displayed_total_not_base_fare_or_extra_costs(self):
        f = fare(27000); f['base_fare'] = 18000; f['extra_payment_fee'] = 999
        self.assertEqual(str(select([f], self.cfg, NOW.date()).price), '27000')

    def test_rejects_connections_intermediate_stops_and_missing_return(self):
        for change in ('connection', 'intermediate', 'return', 'route', 'stops_unknown'):
            f = fare()
            if change == 'connection': f['return']['legs'].append(copy.deepcopy(f['return']['legs'][0]))
            if change == 'intermediate': f['outbound']['legs'][0]['stops'] = 1
            if change == 'return': f['return'] = None
            if change == 'route': f['return']['arrival'] = 'HND'
            if change == 'stops_unknown': del f['return']['stops']
            with self.subTest(change=change): self.assertIsNone(select([f], self.cfg, NOW.date()))

    def test_rejects_bad_price_currency_member_only_and_from_price(self):
        for key, val in [('price', -1), ('price', True), ('price', 'NaN'), ('currency', 'GBP'),
                         ('member_only', True), ('price_type', 'round_trip_starting'), ('available', False)]:
            f = fare(); f[key] = val
            with self.subTest(key=key, val=val): self.assertIsNone(select([f], self.cfg, NOW.date()))

    def test_calendar_months_and_stay_boundary(self):
        self.assertEqual(add_months(date(2026, 8, 31), 6), date(2027, 2, 28))
        self.assertEqual(add_months(date(2026, 10, 3), 6), date(2027, 4, 3))
        for ret, valid in [('2027-04-18', False), ('2027-04-19', True), ('2027-04-30', True), ('2027-05-01', False)]:
            f = fare(); f['return']['departure_date'] = ret; f['return']['arrival_date'] = ret
            self.assertEqual(select([f], self.cfg, NOW.date()) is not None, valid)
        f = fare(); f['outbound']['departure_date'] = '2027-04-02'
        self.assertIsNone(select([f], self.cfg, NOW.date()))

    def test_sampling_is_bounded_inside_scope_and_changes_daily(self):
        pairs = search_dates(self.cfg, NOW.date())
        self.assertEqual(len(pairs), 6)
        self.assertEqual(len(set(pairs)), 6)
        for dep, ret in pairs:
            self.assertTrue(date(2027, 4, 3) <= dep <= date(2027, 10, 3))
            self.assertTrue(9 <= (ret - dep).days <= 20)
        self.assertNotEqual(pairs, search_dates(self.cfg, date(2026, 10, 4)))

    def test_message_has_scope_local_times_and_unverified_baggage(self):
        text = summary(select([fare()], self.cfg, NOW.date()), self.cfg, NOW, ['OctoTrip: timeout'], 6)
        for term in ['cheapest found among checked sources', '13:45', 'JST', 'PHT', '10 nights',
                     'Baggage', 'unverified', 'Coverage incomplete', 'OctoTrip', '2026-10-03', 'https://']:
            self.assertIn(term, text)

class RunTests(unittest.TestCase):
    def setUp(self):
        self.state = FileState(Path(__file__).parent / f'state-{uuid4().hex}.json')
        self.addCleanup(lambda: self.state.path.unlink(missing_ok=True))
        self.sent = []; self.cfg = Config(samples_per_day=1)
        self.pairs = [(date(2027, 4, 10), date(2027, 4, 20))]

    def run_it(self, search, **kwargs):
        return run(self.cfg, self.state, search, self.sent.append, NOW, pairs=self.pairs, **kwargs)

    def test_daily_claim_survives_new_process_and_unchanged_next_day_sends(self):
        self.run_it(lambda *args: [fare()])
        self.state = FileState(self.state.path)
        self.run_it(lambda *args: [fare()])
        self.assertEqual(len(self.sent), 1)
        run(self.cfg, self.state, lambda *args: [fare()], self.sent.append,
            NOW + timedelta(days=1), pairs=self.pairs)
        self.assertEqual(len(self.sent), 2)

    def test_above_budget_and_empty_are_silent_in_alert_mode(self):
        self.run_it(lambda *args: [fare(26000)])
        self.run_it(lambda *args: [])
        self.assertEqual(self.sent, [])

    def test_daily_mode_above_budget_fallback(self):
        self.cfg = Config(samples_per_day=1, daily_summary=True)
        self.run_it(lambda *args: [fare(26000)])
        self.assertIn('above budget', self.sent[0])

    def test_empty_success_not_confused_with_failed_search(self):
        self.cfg = Config(samples_per_day=1, daily_summary=True)
        self.run_it(lambda *args: [])
        self.assertIn('No verified fare found today.', self.sent[0])

    def test_failed_search_is_error_and_operational_alert_deduplicated(self):
        def fail(*args): raise TimeoutError('sensitive detail must not appear')
        self.assertEqual(self.run_it(fail), 1)
        self.assertEqual(self.run_it(fail), 1)
        self.assertEqual(len(self.sent), 1)
        self.assertIn('Search failed', self.sent[0])
        self.assertNotIn('No verified fare', self.sent[0])
        self.assertNotIn('sensitive', self.sent[0])

    def test_refresh_changed_above_threshold_does_not_alert(self):
        sequence = iter([[fare(24000)], [fare(26000)]])
        self.run_it(lambda *args: next(sequence))
        self.assertEqual(self.sent, [])

    def test_refresh_unavailable_daily_summary_is_no_verified_fare(self):
        self.cfg = Config(samples_per_day=1, daily_summary=True)
        sequence = iter([[fare(24000)], []])
        self.run_it(lambda *args: next(sequence))
        self.assertIn('No verified fare found today.', self.sent[0])

    def test_dry_run_sends_nothing_and_writes_no_state(self):
        self.run_it(lambda *args: [fare()], dry_run=True)
        self.assertEqual(self.sent, [])
        self.assertFalse(self.state.path.exists())

    def test_ambiguous_send_does_not_duplicate_on_retry(self):
        def uncertain(text): raise TimeoutError()
        with self.assertRaises(TimeoutError):
            run(self.cfg, self.state, lambda *args: [fare()], uncertain, NOW, pairs=self.pairs)
        self.run_it(lambda *args: [fare()])
        self.assertEqual(self.sent, [])

    def test_corrupt_state_never_sends(self):
        self.state.path.write_text('{bad json', encoding='utf-8')
        with self.assertRaises(RuntimeError): self.run_it(lambda *args: [fare()])
        self.assertEqual(self.sent, [])

    def test_partial_search_failure_is_identified_with_target(self):
        self.pairs.append((date(2027, 4, 11), date(2027, 4, 21)))
        def search(dep, ret):
            if dep.day == 11: raise TimeoutError()
            return [fare()]
        self.assertEqual(self.run_it(search), 1)
        self.assertIn('Coverage incomplete', self.sent[0])
        self.assertIn('🎯 Target price found', self.sent[0])

    def test_day_rollover_does_not_send_under_old_day(self):
        with self.assertRaises(RuntimeError):
            self.run_it(lambda *args: [fare()], clock=lambda: NOW + timedelta(days=1))
        self.assertFalse(self.state.path.exists())

class RemoteStateTests(unittest.TestCase):
    def test_successful_initialization_claim_before_send_then_acknowledgment(self):
        import base64
        import hashlib
        class MemoryAPI:
            branch = False
            data = None
            sha = None
            def request(self, path, method='GET', payload=None):
                if method == 'GET' and path.endswith('/git/ref/heads/airfare-notifier-state'):
                    if not self.branch: raise RuntimeError('GitHub HTTP 404')
                    return {'object': {'sha': 'initialized'}}
                if method == 'GET' and '/contents/' in path:
                    return {'sha': self.sha, 'content': base64.b64encode(json.dumps(self.data).encode()).decode()}
                if path.endswith('/git/ref/heads/main'): return {'object': {'sha': 'base'}}
                if path.endswith('/git/commits/base'): return {'tree': {'sha': 'base-tree'}}
                if path.endswith('/git/trees'):
                    self.data = json.loads(payload['tree'][0]['content']); self.sha = 'first-blob'
                    return {'sha': 'new-tree'}
                if path.endswith('/git/commits'): return {'sha': 'new-commit'}
                if path.endswith('/git/refs'):
                    self.branch = True
                    return {'object': {'sha': 'new-commit'}}
                if method == 'PUT':
                    if payload['sha'] != self.sha: raise RuntimeError('GitHub HTTP 409')
                    self.data = json.loads(base64.b64decode(payload['content']))
                    self.sha = hashlib.sha1(payload['content'].encode()).hexdigest()
                    return {'content': {'sha': self.sha}}
                return {'default_branch': 'main'}
        api = MemoryAPI()
        path = Path(__file__).parent / f'state-{uuid4().hex}.json'
        self.addCleanup(lambda: path.unlink(missing_ok=True))
        state = GitHubState('owner/repo', path, api)
        sent = []
        def sender(text):
            self.assertTrue(api.branch)
            self.assertEqual(api.data['summaries']['2026-10-03']['status'], 'claimed')
            sent.append(text)
        run(Config(samples_per_day=1), state, lambda *a: [fare()], sender, NOW,
            pairs=[(date(2027, 4, 10), date(2027, 4, 20))])
        self.assertEqual(len(sent), 1)
        self.assertEqual(api.data['summaries']['2026-10-03']['status'], 'sent')

    def test_initialization_failure_never_creates_empty_state_branch(self):
        class BrokenAPI:
            branch_created = False
            def request(self, path, method='GET', payload=None):
                if method == 'POST' and path.endswith('/git/refs'):
                    self.branch_created = True
                if method == 'PUT' or path.endswith('/git/trees'): raise RuntimeError('GitHub HTTP 503')
                if path.endswith('/git/commits/base'): return {'tree': {'sha': 'base-tree'}}
                if path.endswith('/git/ref/heads/main'): return {'object': {'sha': 'base'}}
                return {'default_branch': 'main'}
        api = BrokenAPI()
        state = GitHubState('owner/repo', Path(__file__).parent / 'remote-test.json', api)
        with self.assertRaises(RuntimeError): state.save({'version': 1, 'summaries': {}, 'operations': {}})
        self.assertFalse(api.branch_created, 'A failed first save must not publish a branch without state')

    def test_sha_conflict_stops_delivery_without_telegram(self):
        data = {'version': 1, 'summaries': {}, 'operations': {}}
        import base64
        class ConflictAPI:
            def request(self, path, method='GET', payload=None):
                if method == 'PUT': raise RuntimeError('GitHub HTTP 409')
                if '/contents/' in path:
                    return {'sha': 'old', 'content': base64.b64encode(json.dumps(data).encode()).decode()}
                return {'object': {'sha': 'branch'}}
        state = GitHubState('owner/repo', Path(__file__).parent / 'remote-test.json', ConflictAPI())
        sent = []
        with self.assertRaises(RuntimeError):
            run(Config(samples_per_day=1), state, lambda *args: [fare()], sent.append, NOW,
                pairs=[(date(2027, 4, 10), date(2027, 4, 20))])
        self.assertEqual(sent, [])

if __name__ == '__main__': unittest.main()
