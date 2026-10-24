const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('homepage exposes an accessible multi-day itinerary builder', () => {
  for (const id of ['itinerary','itinerary-form','itinerary-start-date','itinerary-days','itinerary-origin','itinerary-endpoint','itinerary-days-output','itinerary-status']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `missing ${id}`);
  }
  assert.match(html, /itinerary-core\.js/);
  assert.match(html, /itinerary-planner\.js/);
  assert.match(html, /href=["']#itinerary["']/);
  assert.match(html, /one best-fit region/i);
  assert.match(html, /reserves a transfer day/i);
  assert.doesNotMatch(html, /Leave all unchecked for all Japan/i);
});

test('itinerary UI includes transparent route and source cautions', () => {
  const scriptPath = path.join(root, 'itinerary-planner.js');
  assert.ok(fs.existsSync(scriptPath), 'planner controller script exists');
  const source = fs.readFileSync(scriptPath, 'utf8');
  assert.match(html, /does not calculate|not calculate/i);
  assert.match(html, /current access|official sources/i);
  assert.match(source, /localStorage/);
  assert.match(source, /maps\/dir/);
  assert.match(source, /Verified event dates/);
  assert.match(source, /transitionNote/);
  assert.match(source, /earlierStops/);
});
