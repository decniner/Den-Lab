"""Rebuild published data together, preserving scoring and editorial metadata."""
from __future__ import annotations

import html
import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET


def read_js(path):
    return json.loads(path.read_text(encoding='utf-8').split('=', 1)[1].strip().rstrip(';'))


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def write_js(path, name, value, compact=False):
    text = json.dumps(value, ensure_ascii=False, indent=None if compact else 2)
    # Keep JavaScript data literals from containing script terminators.
    text = text.replace('</', '<\\/').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    path.write_text(f'window.{name} = {text};\n', encoding='utf-8')


def validate(data):
    ids = set()
    if not data.get('scoring') or not data.get('benchmarks'):
        raise ValueError('Missing existing scoring/benchmark configuration')
    for p in data['properties']:
        if not p.get('id') or p['id'] in ids:
            raise ValueError('Missing or duplicate property ID')
        ids.add(p['id'])
        for key in ('priceMan', 'landM2', 'walkMin'):
            if not isinstance(p.get(key), (int, float)) or p[key] <= 0:
                raise ValueError(f'Invalid {key} for {p["id"]}')
        if p['type'] not in ('house-new', 'house-used', 'land'):
            raise ValueError('Invalid property type')
        if p['type'] != 'land' and not p.get('buildingM2'):
            raise ValueError('House missing floor area')
        if not p.get('source', {}).get('url', '').startswith('https://'):
            raise ValueError('Invalid source URL')


def rebuild(root):
    root = Path(root)
    cities = read_js(root/'cities.js')
    records, index = {}, []
    for c in cities:
        path = root/c['slug']/'data/properties.json'
        if c.get('status') != 'live':
            continue
        data = json.loads(path.read_text(encoding='utf-8'))
        validate(data)
        records[c['slug']] = data
        props = data['properties']
        houses = [p for p in props if p['type'] != 'land']
        land = [p for p in props if p['type'] == 'land']
        c.update(researchedOn=data['site']['researchedOn'], counts={'total': len(props), 'houses': len(houses), 'land': len(land)},
                 fromHouseMan=min((p['priceMan'] for p in houses), default=0),
                 fromLandMan=min((p['priceMan'] for p in land), default=0))
        for key, field in [('stations', 'station'), ('stationsJa', 'stationJa'), ('districts', 'district')]:
            c[key] = list(dict.fromkeys(p[field] for p in props if p.get(field)))
        write_js(root/c['slug']/'data.js', 'TADAIMA_DATA', data)
        for p in props:
            row = {'slug': c['slug'], 'city': c['name']}
            row.update({key: p.get(key) for key in ('id', 'type', 'district', 'districtJa', 'station', 'stationJa', 'priceMan', 'walkMin', 'layout', 'landM2', 'buildingM2')})
            row['hay'] = ' '.join(str(v or '') for v in (c['name'], c['nameJa'], p.get('district'), p.get('districtJa'), p.get('station'), p.get('stationJa'), p.get('layout'), p.get('title'))).lower()
            index.append(row)
    write_js(root/'cities.js', 'TADAIMA_CITIES', cities)
    write_js(root/'search-index.js', 'TADAIMA_PROP_INDEX', index, compact=True)
    aggregate_path = root/'data/all-properties.json'
    aggregate = json.loads(aggregate_path.read_text(encoding='utf-8')) if aggregate_path.exists() else {}
    aggregate['cities'] = records
    write_json(aggregate_path, aggregate)
    total = sum(len(d['properties']) for d in records.values())
    path = root/'index.html'
    if path.exists():
        text = path.read_text(encoding='utf-8')
        text = re.sub(r'\d+ properties(?= under|["<])', f'{total} properties', text)
        path.write_text(text, encoding='utf-8')
    namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    ET.register_namespace('', namespace)
    sitemap_path = root/'sitemap.xml'
    if sitemap_path.exists():
        tree = ET.parse(sitemap_path)
        for url in tree.getroot().findall(f'{{{namespace}}}url'):
            loc = url.find(f'{{{namespace}}}loc')
            slug = (loc.text or '').rstrip('/').rsplit('/', 1)[-1] if loc is not None else ''
            # lastmod is content modification, not a promise that every listing was checked.
            dates = [p['source'].get('checkedOn', d['site']['researchedOn']) for d in ([records[slug]] if slug in records else records.values()) for p in d['properties']]
            if dates:
                lastmod = url.find(f'{{{namespace}}}lastmod')
                if lastmod is None:
                    lastmod = ET.SubElement(url, f'{{{namespace}}}lastmod')
                lastmod.text = max(dates)
        tree.write(sitemap_path, encoding='utf-8', xml_declaration=True)
