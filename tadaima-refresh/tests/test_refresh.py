import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from source import Result, parse_detail, detail_url, discover_links, admission
from refresh import refresh_city
from build import rebuild, read_js

URL = 'https://suumo.jp/chukoikkodate/saitama/sc_kawagoe/nc_12345678/'
TODAY = '2026-10-25'


def page(price='2980万円', extra='', address='埼玉県川越市砂', walk='東武東上線「新河岸」徒歩10分'):
    return '''<html><head><title>川越の中古一戸建て</title></head><body>
    <h1>砂の中古一戸建て</h1><table>
    <tr><th>価格 ヒント</th><td>''' + price + '''</td></tr>
    <tr><th>所在地</th><td>''' + address + '''</td></tr>
    <tr><th>交通</th><td>''' + walk + '''</td></tr>
    <tr><th>土地面積</th><td>120.5m<sup>2</sup>（公簿）</td></tr>
    <tr><th>建物面積</th><td>95.2m<sup>2</sup></td></tr>
    <tr><th>間取り</th><td>4LDK</td></tr>
    <tr><th>完成時期（築年月）</th><td>2018年6月</td></tr>
    <tr><th>用途地域</th><td>１種住居</td></tr>
    <tr><th>その他制限事項</th><td>景観法</td></tr></table>
    <dl><dt>情報提供日:</dt><dd>26/10/24</dd></dl>''' + extra + '</body></html>'


def collection():
    return {'site': {'edition': 'Kawagoe', 'editionJa': '川越', 'areaJa': '埼玉県川越市', 'researchedOn': '2026-10-23'},
            'defaults': {'budgetMan': 5000, 'maxWalkMin': 15},
            'benchmarks': {'landPerTsuboManByStation': {'Shingashi': 48.3}},
            'scoring': {'tier': {'Shingashi': 6}, 'walkBand': [40, 30, 20], 'mapsQuery': '埼玉県川越市'},
            'properties': [{'id': 'h01', 'type': 'house-used', 'title': 'Existing', 'district': 'Suna', 'districtJa': '砂',
                            'station': 'Shingashi', 'stationJa': '新河岸', 'line': 'Tobu', 'lineJa': '東武東上線',
                            'priceMan': 3200, 'priceFrom': False, 'walkMin': 10, 'landM2': 120.5, 'buildingM2': 95.2,
                            'layout': '4LDK', 'built': 'Jun 2018', 'ageYears': 8, 'highlights': [], 'cautions': ['Keep caution'],
                            'source': {'name': 'SUUMO', 'url': URL, 'verified': 'detail', 'infoDate': '2026-10-23'}}]}


class Sources(unittest.TestCase):
    def test_single_property_facts_and_real_source_date(self):
        d = parse_detail(page(), URL, '埼玉県川越市')
        self.assertEqual(d['status'], 'active')
        self.assertEqual(d['priceMan'], 2980)
        self.assertEqual(d['landM2'], 120.5)
        self.assertEqual(d['stationJa'], '新河岸')
        self.assertEqual(d['infoDate'], '2026-10-24')
        self.assertEqual(d['walkMin'], 10)

    def test_primary_listing_excludes_related_property_tables(self):
        body = page().replace('<table>', '<div id="by_detail_01"><table>', 1).replace('</table>', '</table></div>', 1)
        body += '<aside><table><tr><th>価格</th><td>980万円</td></tr></table></aside>'
        self.assertEqual(parse_detail(body, URL, '埼玉県川越市')['priceMan'], 2980)

    def test_related_update_date_does_not_override_primary_date(self):
        body = page().replace('<table>', '<div id="outline"><table>', 1)
        body = body.replace('<dd>26/10/24</dd></dl>', '<dd>26/10/20</dd></dl></div>')
        body += '<aside><dl><dt>情報更新日</dt><dd>26/10/25</dd></dl></aside>'
        self.assertEqual(parse_detail(body, URL, '埼玉県川越市')['infoDate'], '2026-10-20')

    def test_related_withdrawal_notice_does_not_remove_active_listing(self):
        body = page(extra='<aside><p>この物件の掲載は終了しました</p></aside>')
        self.assertEqual(parse_detail(body, URL, '埼玉県川越市')['status'], 'active')

    def test_multiple_areas_are_not_single_property_facts(self):
        body = page().replace('120.5m<sup>2</sup>（公簿）', '120.5m<sup>2</sup>・130.5m<sup>2</sup>（2区画）')
        self.assertFalse(admission(parse_detail(body, URL, '埼玉県川越市'), collection()))

    def test_unquoted_station_names_on_goo_feed(self):
        body = page(walk='東武東上線 新河岸駅 徒歩10分 乗換案内')
        facts = parse_detail(body, URL, '埼玉県川越市')
        self.assertEqual(facts['status'], 'active')
        self.assertEqual(facts['stationJa'], '新河岸')

    def test_multi_unit_values_are_not_a_single_property_price(self):
        d = parse_detail(page('2980万円～3980万円', '<table><tr><th>価格</th><td>3980万円</td></tr></table>'), URL, '埼玉県川越市')
        self.assertEqual(d['status'], 'unknown')

    def test_block_and_wrong_city_never_verify_a_property(self):
        for body in ['<h1>Access Denied</h1>', page(address='千葉県市川市砂')]:
            self.assertEqual(parse_detail(body, URL, '埼玉県川越市')['status'], 'unknown')

    def test_only_explicit_withdrawal_is_removed(self):
        self.assertEqual(parse_detail('<h1>この物件の掲載は終了しました</h1>', URL, '埼玉県川越市')['status'], 'withdrawn')
        self.assertEqual(parse_detail('<h1>404 Not Found</h1>', URL, '埼玉県川越市')['status'], 'unknown')

    def test_detail_urls_reject_search_other_hosts_and_tracking(self):
        self.assertFalse(detail_url('https://suumo.jp/ikkodate/saitama/sc_kawagoe/'))
        self.assertFalse(detail_url('https://suumo.jp.evil.test/chukoikkodate/nc_12345678/'))
        self.assertEqual(detail_url(URL + '?tracking=1#map'), URL)

    def test_discovery_ignores_unrelated_cities_and_preserves_types(self):
        html = f'<a href="{URL}">house</a><a href="https://suumo.jp/tochi/chiba/sc_ichikawa/nc_12345679/">other city</a>'
        self.assertEqual(discover_links(html, 'https://suumo.jp/chukoikkodate/saitama/sc_kawagoe/'), [URL])

    def test_admission_rejects_out_of_brief_or_missing_legal_facts(self):
        d = parse_detail(page(), URL, '埼玉県川越市')
        self.assertTrue(admission(d, collection()))
        for changed in [{'priceMan': 5001}, {'walkMin': 16}, {'zoning': ''}, {'built': ''}, {'infoDate': ''}, {'landM2': None}]:
            self.assertFalse(admission(dict(d, **changed), collection()))

    def test_remote_text_is_escaped_before_publication(self):
        d = parse_detail(page().replace('砂の中古一戸建て', '&lt;img src=x onerror=alert(1)&gt;'), URL, '埼玉県川越市')
        self.assertNotIn('<img', d['title'])


class Refresh(unittest.TestCase):
    def test_blocked_source_preserves_facts_dates_and_listing(self):
        d = collection(); original = copy.deepcopy(d)
        out, state, report = refresh_city(d, {}, TODAY, lambda u: Result(u, 403, ''), [])
        self.assertEqual(out, original)
        self.assertEqual(report['unknown'], 1)

    def test_price_update_preserves_id_scoring_cautions_and_source_date(self):
        d = collection()
        out, state, report = refresh_city(d, {}, TODAY, lambda u: Result(u, 200, page()), [])
        p = out['properties'][0]
        self.assertEqual(p['id'], 'h01'); self.assertEqual(p['priceMan'], 2980)
        self.assertEqual(p['source']['checkedOn'], TODAY)
        self.assertEqual(p['source']['infoDate'], '2026-10-24')
        self.assertEqual(p['cautions'], ['Keep caution'])
        self.assertEqual(out['scoring'], d['scoring'])
        self.assertEqual(p['priceDropMan'], 220)

    def test_price_increase_clears_previous_drop_badge(self):
        d, state, _ = refresh_city(collection(), {}, TODAY, lambda u: Result(u, 200, page()), [])
        d, _, _ = refresh_city(d, state, '2026-10-26', lambda u: Result(u, 200, page('3300万円')), [])
        self.assertFalse(d['properties'][0].get('priceDropMan'))

    def test_shared_or_index_sources_never_replace_property_facts(self):
        for shared in [True, False]:
            d = collection()
            if shared:
                p = copy.deepcopy(d['properties'][0]); p['id'] = 'h02'; d['properties'].append(p)
            else:
                d['properties'][0]['source']['verified'] = 'index'
            out, _, _ = refresh_city(d, {}, TODAY, lambda u: Result(u, 200, page()), [])
            self.assertEqual(out, d)

    def test_withdrawal_requires_consecutive_days_and_same_day_retry_does_not_count(self):
        gone = lambda u: Result(u, 200, '<h1>この物件の掲載は終了しました</h1>')
        d, state, _ = refresh_city(collection(), {}, TODAY, gone, [])
        self.assertEqual(len(d['properties']), 1)
        d, state, _ = refresh_city(d, state, TODAY, gone, [])
        self.assertEqual(len(d['properties']), 1)
        d, state, report = refresh_city(d, state, '2026-10-26', gone, [])
        self.assertEqual(d['properties'], [])
        self.assertEqual(report['removed'], 1)

    def test_failed_check_breaks_withdrawal_confirmation(self):
        gone = lambda u: Result(u, 200, '<h1>この物件の掲載は終了しました</h1>')
        d, state, _ = refresh_city(collection(), {}, TODAY, gone, [])
        d, state, _ = refresh_city(d, state, '2026-10-26', lambda u: Result(u, 500, ''), [])
        d, state, _ = refresh_city(d, state, '2026-10-27', gone, [])
        self.assertEqual(len(d['properties']), 1)

    def test_partial_refresh_does_not_advance_edition_research_date(self):
        d = collection(); p = copy.deepcopy(d['properties'][0]); p['id'] = 'h02'; p['source']['url'] = URL.replace('12345678', '99999999'); d['properties'].append(p)
        out, _, report = refresh_city(d, {}, TODAY, lambda u: Result(u, 200, page()) if u == URL else Result(u, 403, ''), [])
        self.assertEqual(out['site']['researchedOn'], '2026-10-23')
        self.assertEqual(out['properties'][0]['source']['checkedOn'], TODAY)
        self.assertNotIn('checkedOn', out['properties'][1]['source'])

    def test_additions_are_deduplicated_and_get_stable_ids(self):
        new = URL.replace('12345678', '87654321')
        out, state, report = refresh_city(collection(), {}, TODAY, lambda u: Result(u, 200, page(address='埼玉県川越市砂新田') if '87654321' in u else page()), [new, new + '?tracking=1'])
        self.assertEqual(len(out['properties']), 2)
        self.assertEqual(report['added'], 1)
        self.assertNotEqual(out['properties'][1]['id'], 'h01')
        self.assertTrue(out['properties'][1]['cautions'])
        again, _, report = refresh_city(out, state, TODAY, lambda u: Result(u, 200, page(address='埼玉県川越市砂新田') if '87654321' in u else page()), [new])
        self.assertEqual(len(again['properties']), 2); self.assertEqual(report['added'], 0)

    def test_cross_feed_duplicate_is_not_added(self):
        new = URL.replace('12345678', '87654321')
        out, _, report = refresh_city(collection(), {}, TODAY, lambda u: Result(u, 200, page()), [new])
        # Same address/station/areas/type at another portal ID is a duplicate.
        self.assertEqual(len(out['properties']), 1)


class Build(unittest.TestCase):
    def test_generated_outputs_agree_and_preserve_editorial_scoring(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); d = collection(); (root/'kawagoe/data').mkdir(parents=True)
            (root/'kawagoe/data/properties.json').write_text(json.dumps(d))
            (root/'cities.js').write_text('window.TADAIMA_CITIES = ' + json.dumps([{'slug': 'kawagoe', 'name': 'Kawagoe', 'nameJa': '川越', 'prefecture': 'Saitama', 'prefectureJa': '埼玉県', 'blurb': 'Keep me', 'status': 'live'}]) + ';')
            (root/'index.html').write_text('<meta name="description" content="1 city editions — 9 properties">')
            rebuild(root)
            cities = read_js(root/'cities.js'); city = read_js(root/'kawagoe/data.js')
            self.assertEqual(cities[0]['counts'], {'total': 1, 'houses': 1, 'land': 0})
            self.assertEqual(cities[0]['fromHouseMan'], 3200)
            self.assertEqual(cities[0]['blurb'], 'Keep me')
            self.assertEqual(city['scoring'], d['scoring'])
            self.assertEqual(read_js(root/'search-index.js')[0]['priceMan'], 3200)
            self.assertEqual(json.loads((root/'data/all-properties.json').read_text())['cities']['kawagoe'], d)
            self.assertIn('1 properties', (root/'index.html').read_text())
            before = {p: p.read_bytes() for p in root.rglob('*') if p.is_file()}
            rebuild(root)
            self.assertEqual(before, {p: p.read_bytes() for p in root.rglob('*') if p.is_file()})


if __name__ == '__main__':
    unittest.main()
