const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { loadRawDestinations, validateInventory, buildInventory } = require('../tools/destination-inventory.cjs');
const site = path.resolve(__dirname, '..');

test('loadRawDestinationsUsesIndexScriptOrderAndCounts310Records', () => {
  const places = loadRawDestinations(site);
  assert.equal(places.length, 310);
  assert.equal(new Set(places.map(place => place.name)).size, 310);
  assert.deepEqual([...new Set(places.map(place => place.region))].sort(), ['Chubu','Chugoku','Hokkaido','Kansai','Kanto','Kyushu','Okinawa','Shikoku','Tohoku']);
  assert.ok(places.every(place => !('coordinates' in place)));
});

test('validateInventoryRejectsDuplicateIdsAndInvalidCoordinates', () => {
  const issues = validateInventory({ records: [
    { id: 'one', coordinates: { latitude: 0, longitude: 0 } },
    { id: 'one', coordinates: { latitude: 91, longitude: 200 } }
  ] });
  assert.ok(issues.some(issue => issue.code === 'duplicate-id'));
  assert.ok(issues.some(issue => issue.code === 'invalid-coordinates'));
});

test('everyRawRecordHasStableIdentityAndType', () => {
  const identities = JSON.parse(fs.readFileSync(path.join(site, 'data/destination-identities.json'), 'utf8'));
  const inventory = buildInventory(loadRawDestinations(site), identities.records, '/Den-Lab/SomeWhereInJapan/');
  assert.equal(inventory.records.length, 310);
  assert.equal(new Set(inventory.records.map(record => record.id)).size, 310);
  const allowed = ['city','neighborhood','attraction','island','walking-route','hiking-route','region'];
  for (const record of inventory.records) {
    assert.ok(record.id && record.slug && record.type && allowed.includes(record.type), record.name);
    assert.equal(record.region, record.raw.region);
    assert.ok(Array.isArray(record.oldPaths));
  }
});

test('aliasesPreserveOldUrlsAndRequireEvidence', () => {
  const issues = validateInventory({ records: [
    { id: 'alias', aliasOf: 'target', oldPaths: ['/old/'] },
    { id: 'broken', aliasOf: 'missing', oldPaths: [], aliasEvidence: '' }
  ] });
  assert.ok(issues.some(issue => issue.code === 'alias-missing-target'));
  assert.ok(issues.some(issue => issue.code === 'alias-missing-evidence'));
  const routeGuides = JSON.parse(fs.readFileSync(path.join(site, 'data/route-guide-urls.json'), 'utf8'));
  assert.equal(routeGuides.records.length, 5);
  assert.ok(routeGuides.records.every(record => record.url.startsWith('/Den-Lab/SomeWhereInJapan/day-trips/')));
});
