const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('field atlas offers nine region pins, direct picks, and independent Japan and Tokyo panels', () => {
  assert.equal((html.match(/class="atlas-region-pin"/g) || []).length, 9);
  assert.match(html, /id="region-spotlight-picks"/);
  assert.match(html, /data-atlas-tab="japan"/);
  assert.match(html, /data-atlas-tab="tokyo"/);
  assert.match(html, /id="daytrip-compare"/);
  assert.match(html, /id="destination-grid"/);
});

test('homepage advertises 230 places and loads the newest catalogue expansion before the app', () => {
  assert.match(html, /230 places/);
  assert.match(html, /destination-expansion-2\.js\?v=20261022-1/);
  assert.ok(html.indexOf('destination-expansion-2.js') < html.indexOf('app.js'), 'the destination data loads before its renderer');
});

test('public sitemap lists the home page and every expanded field note', () => {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  for (const slug of ['SomeWhereInJapan/index.html', 'day-trips/kawagoe/', 'day-trips/sawara/', 'day-trips/mitake/', 'day-trips/narita/', 'day-trips/odawara/']) {
    assert.ok(sitemap.includes(slug), 'missing sitemap entry: ' + slug);
  }
});
