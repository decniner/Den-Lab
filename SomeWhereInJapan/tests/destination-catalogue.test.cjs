const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadRawDestinations } = require('../tools/destination-inventory.cjs');

const site = path.resolve(__dirname, '..');
const places = loadRawDestinations(site);

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
  assert.ok(places.filter(place => place.photo?.url).length >= 200);
});
test('the previous 30 place stories use 30 distinct credited place photos', () => {
  const additions = places.slice(150, 180);
  assert.equal(additions.length, 30);
  const urls = additions.map(place => place.photo?.url);
  assert.ok(urls.every(Boolean));
  assert.equal(new Set(urls).size, 30);
  assert.ok(additions.every(place => place.photo.source.startsWith('https://commons.wikimedia.org/wiki/File:')));
});

test('the 50 newest destinations have distinct credited photos, useful stories, and seasonal guidance', () => {
  const additions = places.slice(180, 230);
  assert.equal(additions.length, 50);
  const photoUrls = additions.map(place => place.photo?.url);
  assert.ok(photoUrls.every(Boolean));
  assert.equal(new Set(photoUrls).size, 50);
  for (const place of additions) {
    assert.ok(place.name && place.place && place.description.length > 80, place.name);
    assert.ok(place.tags.length > 0, place.name);
    assert.ok(place.months.length > 0 && place.months.every(month => month >= 1 && month <= 12), place.name);
    assert.ok(place.seasonReason && place.illustration && place.alt, place.name);
    assert.match(place.photo.url, /^https:\/\/(thumb|upload)\.wikimedia\.org\/wikipedia\/commons\//, `${place.name} photo is served by Wikimedia Commons`);
    assert.match(place.photo.source, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/, `${place.name} photo has a source page`);
    assert.ok(place.photo.credit && place.photo.license && place.photo.licenseUrl, `${place.name} photo has complete attribution`);
  }
});

