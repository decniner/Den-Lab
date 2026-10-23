const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadRawDestinations, validateInventory } = require('../tools/destination-inventory.cjs');

const site = path.resolve(__dirname, '..');

test('loadRawDestinationsUsesIndexScriptOrderAndCounts310Records', () => {
  const places = loadRawDestinations(site);
  assert.equal(places.length, 310);
  assert.equal(new Set(places.map(place => place.name)).size, 310);
  assert.deepEqual([...new Set(places.map(place => place.region))].sort(), [
    'Chubu', 'Chugoku', 'Hokkaido', 'Kansai', 'Kanto', 'Kyushu', 'Okinawa', 'Shikoku', 'Tohoku'
  ]);
  const withoutCoordinates = places.filter(place => !place.coordinates);
  assert.equal(withoutCoordinates.length, 310);
  assert.ok(withoutCoordinates.every(place => !('coordinates' in place)));
});

test('validateInventoryRejectsDuplicateIdsAndInvalidCoordinates', () => {
  const issues = validateInventory({ records: [
    { id: 'one', coordinates: { latitude: 0, longitude: 0 } },
    { id: 'one', coordinates: { latitude: 91, longitude: 200 } }
  ] });
  assert.ok(issues.some(issue => issue.code === 'duplicate-id'));
  assert.ok(issues.some(issue => issue.code === 'invalid-coordinates'));
});
