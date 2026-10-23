'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { loadRawDestinations, buildInventory } = require('./destination-inventory.cjs');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'data/destination-map-locations.json');
const cachePath = path.join(root, 'data/.destination-map-geocode-cache.json');
const userAgent = 'SomewhereInJapan/1.0 (+https://github.com/decniner/Den-Lab)';
const referer = 'https://decniner.github.io/Den-Lab/SomeWhereInJapan/';
const locationOverrides = {
  'glover-garden': {latitude:32.7333666,longitude:129.869055,precision:'destination',locator:'Glover Garden',query:'Glover Garden Nagasaki Japan',matchedName:'Glover Garden',matchedType:'leisure/garden',sourceUrl:'https://www.openstreetmap.org/search?query=Glover%20Garden%20Nagasaki%20Japan'},
  'kokura-castle': {latitude:33.8844476,longitude:130.8742512,precision:'destination',locator:'Kokura Castle',query:'Kokura Castle Kitakyushu Japan',matchedName:'Kokura Castle',matchedType:'historic/castle',sourceUrl:'https://www.openstreetmap.org/search?query=Kokura%20Castle%20Kitakyushu%20Japan'},
  'mikata-five-lakes': {latitude:35.5673974,longitude:135.8843333,precision:'area',locator:'Mikata Lake, Wakasa, Fukui',query:'Mikatako Fukui Japan',matchedName:'Mikata Lake',matchedType:'water/lake',sourceUrl:'https://www.openstreetmap.org/search?query=Mikatako%20Fukui%20Japan'}
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const read = file => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const write = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

function isDestinationFeature(item) {
  if (!item) return false;
  const category = item.category || item.class || '', type = item.type || '';
  return ['tourism', 'historic', 'natural', 'water', 'waterway', 'leisure', 'railway', 'aerialway', 'man_made', 'bridge', 'junction'].includes(category) ||
    ['landuse/religious', 'landuse/retail', 'building/castle', 'amenity/place_of_worship', 'amenity/marketplace', 'amenity/public_bath', 'amenity/theatre', 'amenity/arts_centre'].includes(`${category}/${type}`);
}

function isAreaFeature(item) {
  if (!item) return false;
  const category = item.category || item.class || '', type = item.type || '';
  return (category === 'boundary' && ['administrative', 'civil', 'national_park'].includes(type)) ||
    (category === 'place' && ['city', 'town', 'village', 'suburb', 'quarter', 'neighbourhood', 'locality', 'island', 'islet', 'region'].includes(type)) ||
    (category === 'natural' && ['cape', 'island', 'peninsula', 'bay', 'valley', 'mountain_range', 'volcano'].includes(type));
}

async function main() {
  const raw = loadRawDestinations(root);
  const identities = read(path.join(root, 'data/destination-identities.json')).records || [];
  const destinations = buildInventory(raw, identities).records.filter(record => record.id && !record.aliasOf);
  const locations = read(outputPath);
  locations.schemaVersion = 1;
  locations.attribution = 'Location results from OpenStreetMap Nominatim; copyright OpenStreetMap contributors, ODbL 1.0.';
  locations.sourcePolicy = 'One-time build lookup; results are cached locally and no geocoding request is made by the published site.';
  locations.records ||= {};
  if (process.argv.includes('--refresh')) locations.records = {};
  const cache = read(cachePath);
  let lastRequestAt = 0;
  let completed = 0;

  async function search(query) {
    if (Object.hasOwn(cache, query)) return cache[query];
    const delay = Math.max(0, 1100 - (Date.now() - lastRequestAt));
    if (delay) await sleep(delay);
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.search = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', countrycodes: 'jp' });
    lastRequestAt = Date.now();
    const response = await fetch(url, { headers: { 'User-Agent': userAgent, Referer: referer } });
    if (!response.ok) throw new Error(`Nominatim returned HTTP ${response.status} for ${query}`);
    const rows = await response.json();
    cache[query] = rows[0] || null;
    write(cachePath, cache);
    return cache[query];
  }

  for (const record of destinations) {
    if (locationOverrides[record.id]) {
      locations.records[record.id] = {name:record.name,...locationOverrides[record.id],checkedOn:'2026-10-23'};
      write(outputPath, locations);
      completed += 1;
      continue;
    }
    if (locations.records[record.id]?.latitude) { completed += 1; continue; }
    const placeLabel = String(record.raw.place || record.region || '').trim();
    const placeCore = placeLabel.split(/[,\u00b7]+/)[0].replace(/\s+/g, ' ').trim();
    const featureQuery = `${record.name}, ${placeLabel.replace(/[,\u00b7]+/g, ' ').replace(/\s+/g, ' ').trim()}, Japan`;
    let result = await search(featureQuery);
    let used = result && isDestinationFeature(result) ? { query: featureQuery, precision: 'destination' } : null;
    if (!used) {
      const areaQuery = `${placeCore}, Japan`;
      const areaResult = placeCore ? await search(areaQuery) : null;
      if (isAreaFeature(areaResult)) { result = areaResult; used = { query: areaQuery, precision: 'area' }; }
      else if (result) used = { query: featureQuery, precision: 'nearby' };
      else if (areaResult) { result = areaResult; used = { query: areaQuery, precision: 'nearby' }; }
    }
    if (result && used) {
      const category = result.category || result.class || '';
      const type = result.type || '';
      const osmType = String(result.osm_type || '').toLowerCase();
      const sourceUrl = ['node', 'way', 'relation'].includes(osmType) && result.osm_id
        ? `https://www.openstreetmap.org/${osmType}/${result.osm_id}`
        : `https://www.openstreetmap.org/search?query=${encodeURIComponent(used.query)}`;
      locations.records[record.id] = {
        name: record.name,
        latitude: Number(result.lat),
        longitude: Number(result.lon),
        precision: used.precision,
        locator: used.precision === 'destination' ? record.name : (record.raw.place || record.region),
        query: used.query,
        matchedName: result.name || null,
        matchedType: `${category}/${type}`,
        sourceUrl,
        checkedOn: new Date().toISOString().slice(0, 10)
      };
    } else {
      locations.records[record.id] = { name: record.name, precision: 'unavailable', locator: record.raw.place || record.region };
    }
    write(outputPath, locations);
    completed += 1;
    if (completed % 10 === 0 || completed === destinations.length) console.log(`Resolved ${completed}/${destinations.length} destinations`);
  }
  console.log(`Saved ${Object.values(locations.records).filter(item => Number.isFinite(item.latitude)).length} mapped locations for ${destinations.length} destination guides.`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
