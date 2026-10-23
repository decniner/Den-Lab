const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { loadRawDestinations } = require('../tools/destination-inventory.cjs');

const site = path.resolve(__dirname, '..');
const places = loadRawDestinations(site);
const photoAudit = JSON.parse(fs.readFileSync(path.join(site, 'data/photo-audit.json'), 'utf8'));

test('nationwide destination catalogue has 310 unique entries across all regions', () => {
  assert.equal(places.length, 310);
  assert.equal(new Set(places.map(place => place.name)).size, 310);
  assert.deepEqual([...new Set(places.map(place => place.region))].sort(), [
    'Chubu', 'Chugoku', 'Hokkaido', 'Kansai', 'Kanto', 'Kyushu', 'Okinawa', 'Shikoku', 'Tohoku'
  ]);
});

test('the nationwide raw records preserve their available editorial fields without defaults', () => {
  for (const place of places) {
    assert.ok(place.name && place.region && place.description, place.name);
    assert.ok(Array.isArray(place.tags) && place.tags.length > 0, place.name);
    if (place.months !== undefined) assert.ok(place.months.every(month => month >= 1 && month <= 12), place.name);
  }
  assert.ok(places.every(place => place.photo?.url || place.image), 'all 310 destinations retain a photograph');
  assert.equal(places.filter(place => place.photoAudit?.verdict === 'CORRECT').length, photoAudit.rows.filter(row => row.verdict === 'CORRECT').length);
  const verifiedPhotos = photoAudit.rows.filter(row => row.verdict === 'CORRECT');
  assert.equal(new Set(verifiedPhotos.map(row => row.currentImageUrl)).size, verifiedPhotos.length, 'verified destination photos are unique');
  assert.ok(verifiedPhotos.every(row => row.photographer && row.license && row.altText && row.sourcePage), 'verified photos include source attribution and alt text');
  assert.ok(places.every(place => ['complete','provisional'].includes(place.guide_status)), 'every place has an explicit guide status');
  for (const place of places) {
    const row = photoAudit.rows.find(item => item.place === place.name);
    assert.ok(row, place.name);
    assert.equal(place.photoAudit?.verdict, row.verdict, `${place.name} keeps its verification status`);
    assert.ok(place.photo?.url || place.image, `${place.name} keeps its image`);
  }
});
test('verified images in the previous 30 place stories have distinct source-backed credits', () => {
  const additions = places.slice(150, 180);
  assert.equal(additions.length, 30);
  const verified = additions.filter(place => place.photo?.url);
  const urls = verified.map(place => place.photo.url);
  assert.equal(new Set(urls).size, verified.length);
  assert.ok(verified.every(place => place.photo.source.startsWith('https://commons.wikimedia.org/wiki/File:')));
});

test('verified images in the next 50 destinations have unique attribution while all retain their stories and seasonal data', () => {
  const additions = places.slice(180, 230);
  assert.equal(additions.length, 50);
  const verified = additions.filter(place => place.photo?.url);
  const photoUrls = verified.map(place => place.photo.url);
  assert.equal(new Set(photoUrls).size, verified.length);
  for (const place of additions) {
    assert.ok(place.name && place.place && place.description.length > 80, place.name);
    assert.ok(place.tags.length > 0, place.name);
    assert.ok(place.months.length > 0 && place.months.every(month => month >= 1 && month <= 12), place.name);
    assert.ok(place.seasonReason && place.illustration, place.name);
    if(place.photo?.url){
      assert.match(place.photo.url, /^https:\/\/(thumb|upload)\.wikimedia\.org\/wikipedia\/commons\//, `${place.name} photo is served by Wikimedia Commons`);
      assert.match(place.photo.source, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/, `${place.name} photo has a source page`);
      assert.ok(place.photo.credit && place.photo.license && place.photo.licenseUrl, `${place.name} photo has complete attribution`);
    }
  }
});

