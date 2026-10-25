"""Public property sources. A failed request is never evidence of withdrawal."""
from __future__ import annotations

import html
import re
import time
import unicodedata
from dataclasses import dataclass
from datetime import date
from urllib import error, parse, request, robotparser

from bs4 import BeautifulSoup

HOSTS = {'suumo.jp', 'www.homes.co.jp', 'www.athome.co.jp', 'house.goo.ne.jp', 'house.ocn.ne.jp'}
AGENT = 'TadaimaRefresh/1.0 (+https://github.com/decniner/Den-Lab/tree/main/Tadaima)'
KINDS = {'ikkodate': 'house-new', 'chukoikkodate': 'house-used', 'tochi': 'land'}


def normal(text):
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', text or ''))


def allowed(url):
    p = parse.urlsplit(url)
    return p.scheme == 'https' and p.hostname in HOSTS and p.port in (None, 443) and not p.username and not p.password


def detail_url(url):
    if not allowed(url):
        return None
    p = parse.urlsplit(url)
    patterns = {
        'suumo.jp': r'^/(?:ikkodate|chukoikkodate|tochi)/[^/]+/sc_[^/]+/nc_\d+/$',
        'house.goo.ne.jp': r'^/buy/(?:bh|uh|la)/detail/.+\.html$',
        'house.ocn.ne.jp': r'^/buy/(?:bh|uh|la)/detail/.+\.html$',
        'www.homes.co.jp': r'^/(?:kodate|tochi)/b-[\d-]+/$',
        'www.athome.co.jp': r'^/(?:kodate|tochi)/\d+/$',
    }
    return parse.urlunsplit((p.scheme, p.netloc, p.path, '', '')) if re.fullmatch(patterns[p.hostname], p.path) else None


@dataclass
class Result:
    url: str
    status: int
    body: str
    error: str = ''


class SafeRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not allowed(newurl):
            raise ValueError('Redirect outside allowed public portals')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class Fetcher:
    def __init__(self, delay=1.0, timeout=15):
        self.delay, self.timeout = delay, timeout
        self.cache, self.robots, self.last, self.blocked = {}, {}, {}, set()
        self.opener = request.build_opener(SafeRedirect())

    def _get(self, url):
        host = parse.urlsplit(url).hostname
        time.sleep(max(0, self.delay - (time.monotonic() - self.last.get(host, 0))))
        self.last[host] = time.monotonic()
        try:
            with self.opener.open(request.Request(url, headers={'User-Agent': AGENT, 'Accept': 'text/html,text/plain'}), timeout=self.timeout) as response:
                raw = response.read(4_000_001)
                if len(raw) > 4_000_000:
                    return Result(url, 0, '', 'Response too large')
                content_type = response.headers.get_content_type()
                if content_type not in ('text/html', 'text/plain', 'application/xhtml+xml'):
                    return Result(url, 0, '', 'Unexpected content type')
                encoding = response.headers.get_content_charset() or 'utf-8'
                if encoding == 'utf-8':
                    match = re.search(br'charset=["\s]*([\w-]+)', raw[:4096], re.I)
                    if match:
                        encoding = match.group(1).decode('ascii')
                return Result(response.url, response.status, raw.decode(encoding, 'replace'))
        except error.HTTPError as exc:
            if exc.code in (403, 429):
                self.blocked.add(host)
            return Result(url, exc.code, '', f'HTTP {exc.code}')
        except (OSError, ValueError, LookupError) as exc:
            return Result(url, 0, '', type(exc).__name__)

    def fetch(self, url):
        if url in self.cache:
            return self.cache[url]
        if not allowed(url):
            return Result(url, 0, '', 'URL outside allowed public portals')
        p = parse.urlsplit(url)
        if p.hostname in self.blocked:
            return Result(url, 0, '', 'Portal blocked earlier in this run')
        if p.hostname not in self.robots:
            r = self._get(f'https://{p.hostname}/robots.txt')
            robots = robotparser.RobotFileParser()
            if r.status == 200:
                robots.parse(r.body.splitlines())
            elif r.status == 404:
                robots.parse([])
            else:
                robots.parse(['User-agent: *', 'Disallow: /'])
            self.robots[p.hostname] = robots
        robots = self.robots[p.hostname]
        if not robots.can_fetch(AGENT, url):
            result = Result(url, 0, '', 'robots.txt does not permit this request')
        else:
            self.delay = max(self.delay, robots.crawl_delay(AGENT) or 0)
            result = self._get(url)
        self.cache[url] = result
        return result


def fields_from(soup):
    fields = {}
    # Related-property widgets, enquiry forms and hidden content are not facts.
    for element in soup.select('script, style, form, nav, footer, .recommend, .recommendation'):
        element.decompose()
    for label in soup.select('th, dt'):
        value = label.find_next_sibling('td' if label.name == 'th' else 'dd')
        if value:
            key = normal(label.get_text(' ', strip=True)).replace('ヒント', '').strip(':：')
            text = normal(value.get_text(' ', strip=True))
            if text and text not in fields.setdefault(key, []):
                fields[key].append(text)
    return fields


def money(text):
    text = normal(text).replace(',', '')
    if re.search(r'[～〜~]|から|以上|以下|未定|相談|億', text):
        return None
    prices = re.findall(r'(\d+(?:\.\d+)?)万円', text)
    return float(prices[0]) if len(prices) == 1 and 0 < float(prices[0]) < 100000 else None


def measure(text):
    if re.search(r'[～〜~]', text):
        return None
    measures = re.findall(r'(\d+(?:\.\d+)?)(?:m2|m²|㎡)', normal(text).replace(',', ''), re.I)
    if len(measures) != 1 or any(int(n) > 1 for n in re.findall(r'(\d+)(?:区画|戸)', text)):
        return None
    return float(measures[0]) if float(measures[0]) > 0 else None


def source_date(text):
    m = re.search(r'(\d{2,4})[年/.-](\d{1,2})[月/.-](\d{1,2})', text)
    if not m:
        return ''
    y, mo, day = map(int, m.groups())
    try:
        return date(y + 2000 if y < 100 else y, mo, day).isoformat()
    except ValueError:
        return ''


def parse_detail(body, url, expected_area):
    unknown = {'status': 'unknown', 'url': url}
    if not detail_url(url):
        return unknown
    soup = BeautifulSoup(body, 'html.parser')
    heading = soup.find('h1')
    title = heading.get_text(' ', strip=True) if heading else ''
    visible = soup.get_text(' ', strip=True)
    if re.search(r'access denied|captcha|verify you are human|アクセスが集中|ロボットではない', visible[:10000], re.I):
        return unknown
    withdrawal_evidence = title + ' '.join(e.get_text(' ', strip=True) for e in soup.select('main.error, .error-message'))
    if any(message in normal(withdrawal_evidence) for message in ('この物件の掲載は終了しました', 'お探しの物件は掲載を終了しました', 'この物件は掲載終了しました')):
        return {'status': 'withdrawn', 'url': url}
    all_fields = fields_from(soup)
    scope = soup.select_one('#by_detail_01, #outline')
    if scope is None:
        for h in soup.find_all('h2'):
            if normal(h.get_text()) == '物件概要':
                scope = h.find_parent('div', class_='section_h2')
                break
    fields = fields_from(scope) if scope else all_fields

    def values(*labels):
        return [v for k, vs in fields.items() if k in labels for v in vs]

    def unique(convert, *labels):
        raw = values(*labels)
        converted = [convert(v) for v in raw]
        if not raw or any(v is None for v in converted):
            return None
        return converted[0] if all(v == converted[0] for v in converted) else None

    address = next((v for v in values('所在地', '住所') if normal(expected_area) in v), '')
    price = unique(money, '価格', '販売価格')
    if not heading or not address or price is None:
        return unknown
    walk_matches = []
    for v in values('交通', '沿線・駅'):
        # A bus journey followed by a short walk is not a station walk.
        for m in re.finditer(r'([^、\[\]]*?)「([^」]+)」(?:駅)?(?:徒歩|歩)(\d+)分', v):
            if 'バス' not in m.group(0):
                walk_matches.append((int(m.group(3)), m.group(2), m.group(1)))
        for m in re.finditer(r'(?:^|案内|情報)([^「]*?(?:線|ライン|鉄道))([^「駅]+)駅徒歩(\d+)分', v):
            if 'バス' not in m.group(0):
                walk_matches.append((int(m.group(3)), m.group(2), m.group(1)))
    if not walk_matches:
        return unknown
    walk, station, line = min(walk_matches)
    district = address.split(normal(expected_area), 1)[1]
    district = re.split(r'\[|周辺地図|周辺環境|の暮らしデータ', district)[0]
    date_values = [v for key in ('情報更新日', '情報提供日', '情報公開日') for v in fields.get(key, [])]
    dt = next((source_date(v) for v in date_values if source_date(v)), '')
    if not dt and scope is not None:
        # goo puts its own dated microdata after #outline; SUUMO puts its
        # information date in the listing's dedicated definition list.
        for selector in ('time[itemprop=datemodified]', 'time[itemprop=datepublished]'):
            dates = {source_date(e.get('datetime', '') or e.get_text()) for e in soup.select(selector) if not e.find_parent('aside')} - {''}
            if len(dates) == 1:
                dt = dates.pop()
                break
        if not dt and parse.urlsplit(url).hostname == 'suumo.jp':
            dates = set()
            for dl in soup.select('dl.definitionlist--layout'):
                for v in fields_from(dl).get('情報提供日', []):
                    if source_date(v):
                        dates.add(source_date(v))
            if len(dates) == 1:
                dt = dates.pop()
    built = next(iter(values('完成時期(築年月)', '完成時期', '築年月', '築年月(築年数)')), '')
    kind = next((v for k, v in KINDS.items() if parse.urlsplit(url).path.startswith('/'+k+'/')), None)
    if kind is None:
        path = parse.urlsplit(url).path
        kind = 'land' if '/la/' in path or '/tochi/' in path else ('house-new' if '/bh/' in path else 'house-used')
    return {'status': 'active', 'url': url, 'type': kind, 'title': html.escape(title),
            'districtJa': html.escape(district), 'address': html.escape(address),
            'priceMan': price, 'priceFrom': False,
            'landM2': unique(measure, '土地面積'), 'buildingM2': unique(measure, '建物面積'),
            'stationJa': html.escape(station), 'lineJa': html.escape(line), 'walkMin': walk,
            'layout': html.escape(next(iter(values('間取り')), '')),
            'built': html.escape(built), 'infoDate': dt,
            'zoning': html.escape(next(iter(values('用途地域')), '')),
            'legal': html.escape(' / '.join(values('その他制限事項', 'その他制限', '法令等制限', '私道負担・道路', '土地権利', '敷地権利', '建築条件')))}


def admission(facts, data):
    if facts.get('status') != 'active' or not facts.get('infoDate') or not facts.get('zoning') or not facts.get('legal'):
        return False
    if not (facts.get('landM2') and facts.get('districtJa') and facts.get('stationJa')):
        return False
    if not (0 < facts['priceMan'] <= data['defaults']['budgetMan'] and 0 < facts['walkMin'] <= data['defaults']['maxWalkMin']):
        return False
    if facts['type'] != 'land' and not (facts.get('buildingM2') and facts.get('layout') and re.search(r'\d{4}年', facts.get('built', ''))):
        return False
    return True


def discover_links(body, search_url):
    p = parse.urlsplit(search_url)
    # Only links in this exact city/ward + property category, never adverts.
    prefix = p.path.rstrip('/') + '/nc_'
    links = []
    for a in BeautifulSoup(body, 'html.parser').select('a[href]'):
        url = detail_url(parse.urljoin(search_url, a['href']))
        if url and parse.urlsplit(url).path.startswith(prefix) and url not in links:
            links.append(url)
    return links


def city_searches(body, prefecture_url, city_name):
    links = []
    prefix = parse.urlsplit(prefecture_url).path
    for a in BeautifulSoup(body, 'html.parser').select('a[href]'):
        url = parse.urljoin(prefecture_url, a['href'])
        path = parse.urlsplit(url).path
        if (allowed(url) and parse.urlsplit(url).hostname == 'suumo.jp'
                and re.fullmatch(re.escape(prefix) + r'sc_[a-z]+/', path)
                and normal(a.get_text()).startswith(normal(city_name)) and url not in links):
            links.append(url)
    return links
