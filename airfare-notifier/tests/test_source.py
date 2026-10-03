import io
import json
import sys
import unittest
from datetime import date
from pathlib import Path
from urllib.error import HTTPError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from notifier import OctoTrip, SourceError, parse_response
from core import Config
from test_airfare import fare

ARGS = {'origin': 'NRT', 'destination': 'MNL', 'departure_date': '2027-04-10',
        'return_date': '2027-04-20', 'adults': 1, 'children': 0, 'infants': 0,
        'trip_class': 'Y', 'currency': 'JPY', 'locale': 'en'}

def response(data, sse=True):
    text = json.dumps({'jsonrpc': '2.0', 'id': 1, 'result': {
        'structuredContent': {'result': json.dumps(data)}}})
    return ('event: message\ndata: ' + text + '\n\n' if sse else text).encode()


class SourceTests(unittest.TestCase):
    def test_sse_and_json_both_preserve_round_trip_fields(self):
        data = {'results': [fare()], 'query': ARGS}
        for sse in (True, False):
            actual = parse_response(response(data, sse).decode())
            self.assertEqual(actual['results'][0]['return']['arrival'], 'NRT')

    def test_protocol_malformed_and_explicit_errors_are_not_empty_results(self):
        for text in ['not json', '{}', '{"error":{"code":500}}',
                     response({'error': 'rate_limited'}).decode()]:
            with self.subTest(text=text), self.assertRaises(SourceError): parse_response(text)
        self.assertEqual(parse_response(response({'error': 'no_results'}).decode())['error'], 'no_results')

    def test_real_request_sets_round_trip_one_adult_economy_and_jpy(self):
        def opener(request, timeout):
            args = json.loads(request.data)['params']['arguments']
            self.assertEqual(args, ARGS)
            self.assertEqual(timeout, 45)
            return io.BytesIO(response({'results': [fare()], 'query': args}))
        self.assertEqual(OctoTrip(Config(), opener=opener)(date(2027, 4, 10), date(2027, 4, 20))[0]['price'], 25000)

    def test_scope_mismatch_is_failed_search(self):
        query = {**ARGS, 'adults': 2}
        source = OctoTrip(Config(), opener=lambda *args, **kwargs: io.BytesIO(response({'query': query, 'results': [fare()]})))
        with self.assertRaises(SourceError): source(date(2027, 4, 10), date(2027, 4, 20))

    def test_wrong_result_dates_not_accepted(self):
        wrong = fare(); wrong['outbound']['departure_date'] = '2027-04-11'
        source = OctoTrip(Config(), opener=lambda *a, **kw: io.BytesIO(response({'query': ARGS, 'results': [wrong]})))
        self.assertEqual(source(date(2027, 4, 10), date(2027, 4, 20)), [])

    def test_transient_read_only_search_recovers_with_bounded_retries(self):
        count = 0
        def opener(*args, **kwargs):
            nonlocal count
            count += 1
            if count == 1: raise TimeoutError('secret must never appear')
            return io.BytesIO(response({'query': ARGS, 'results': [fare()]}))
        source = OctoTrip(Config(), opener=opener, sleep=lambda seconds: None)
        self.assertEqual(source(date(2027, 4, 10), date(2027, 4, 20))[0]['currency'], 'JPY')

    def test_exhausted_transport_is_error_and_redacts_exception(self):
        def opener(*args, **kwargs): raise TimeoutError('credential-value')
        source = OctoTrip(Config(), opener=opener, sleep=lambda seconds: None)
        with self.assertRaises(SourceError) as caught: source(date(2027, 4, 10), date(2027, 4, 20))
        self.assertNotIn('credential-value', str(caught.exception))

    def test_access_restriction_not_retried_or_bypassed(self):
        count = 0
        def opener(*args, **kwargs):
            nonlocal count
            count += 1
            raise HTTPError('https://example.org', 403, 'Forbidden', {}, io.BytesIO())
        source = OctoTrip(Config(), opener=opener, sleep=lambda seconds: None)
        with self.assertRaises(SourceError): source(date(2027, 4, 10), date(2027, 4, 20))
        self.assertEqual(count, 1)
