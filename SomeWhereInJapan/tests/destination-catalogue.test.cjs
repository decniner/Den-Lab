const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const site = path.resolve(__dirname, '..');
const scope = { window: null };
scope.window = scope;
vm.createContext(scope);
vm.runInContext(fs.readFileSync(path.join(site, 'destinations.js'), 'utf8'), scope);
vm.runInContext(fs.readFileSync(path.join(site, 'destination-expansion.js'), 'utf8'), scope);
vm.runInContext(fs.readFileSync(path.join(site, 'destination-photo-expansion.js'), 'utf8'), scope);

test('nationwide destination catalogue has 180 unique entries across all regions', () => {
  const places = scope.DESTINATIONS;
  assert.equal(places.length, 180);
  assert.equal(new Set(places.map(place => place.name)).size, 180);
  assert.deepEqual([...new Set(places.map(place => place.region))].sort(), [
    'Chubu', 'Chugoku', 'Hokkaido', 'Kansai', 'Kanto', 'Kyushu', 'Okinawa', 'Shikoku', 'Tohoku'
  ]);
});

test('each new destination has a region, story, season and visual treatment', () => {
  const added = scope.DESTINATIONS.slice(110);
  assert.equal(added.length, 70);
  for (const place of added) {
    assert.ok(place.place && place.description && place.description.length > 80, place.name);
    assert.ok(place.tags.length > 0, place.name);
    assert.ok(place.months.length > 0 && place.months.every(month => month >= 1 && month <= 12), place.name);
    assert.ok(place.seasonReason && place.illustration, place.name);
    if (scope.DESTINATIONS.indexOf(place) >= 150) { assert.ok(place.photo?.url, `${place.name} needs a photo`); assert.ok(place.photo?.source, `${place.name} needs a photo source`); }
  }
});

test('the 30 newest place stories use 30 distinct credited place photos', () => {
  const additions = scope.DESTINATIONS.slice(150);
  assert.equal(additions.length, 30);
  const urls = additions.map(place => place.photo?.url);
  assert.ok(urls.every(Boolean));
  assert.equal(new Set(urls).size, 30);
  assert.ok(additions.every(place => place.photo.source.startsWith('https://commons.wikimedia.org/wiki/File:')));
});
