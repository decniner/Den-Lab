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

test('nationwide destination catalogue has 150 unique entries across all regions', () => {
  const places = scope.DESTINATIONS;
  assert.equal(places.length, 150);
  assert.equal(new Set(places.map(place => place.name)).size, 150);
  assert.deepEqual([...new Set(places.map(place => place.region))].sort(), [
    'Chubu', 'Chugoku', 'Hokkaido', 'Kansai', 'Kanto', 'Kyushu', 'Okinawa', 'Shikoku', 'Tohoku'
  ]);
});

test('each new destination has a region, story, season and visual treatment', () => {
  const added = scope.DESTINATIONS.slice(110);
  assert.equal(added.length, 40);
  for (const place of added) {
    assert.ok(place.place && place.description && place.description.length > 80, place.name);
    assert.ok(place.tags.length > 0, place.name);
    assert.ok(place.months.length > 0 && place.months.every(month => month >= 1 && month <= 12), place.name);
    assert.ok(place.seasonReason && place.illustration, place.name);
    assert.equal(place.image, '', `${place.name} should use the distinct editorial artwork, not a repeated photo`);
  }
});
