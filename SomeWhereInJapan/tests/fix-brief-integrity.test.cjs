'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadRawDestinations } = require('../tools/destination-inventory.cjs');
const { picksForMonth } = require('../seasonal-eligibility.js');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const places = loadRawDestinations(root);
function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(file);
    return entry.isFile() && entry.name.endsWith('.html') ? [file] : [];
  });
}

test('catalogue prose and displayed travel ranges contain no corrupted punctuation', () => {
  const fields = ['name', 'place', 'description', 'alt', 'seasonReason'];
  const suspect = [];
  for (const place of places) for (const field of fields) {
    const value = place[field];
    if (typeof value !== 'string') continue;
    if (/\p{L}\?\p{L}/u.test(value)) suspect.push(`${place.name}.${field}: word-internal question mark`);
  }
  const source = ['index.html', 'app.js', 'daytrip-app.js'].map(read).join('\n');
  if (/\d["\u201c\u201d]\d/u.test(source)) suspect.push('numeric range uses a quote instead of a dash');
  for (const file of [path.join(root, 'index.html'), ...htmlFiles(path.join(root, 'places')), ...htmlFiles(path.join(root, 'day-trips'))]) {
    const html = fs.readFileSync(file, 'utf8');
    if (/\d["\u201c\u201d]\d/u.test(html)) suspect.push(`${path.relative(root, file)}: corrupted numeric range`);
    const visibleText = html.replace(/<[^>]*>/g, ' ');
    if (/\p{L}\?\p{L}/u.test(visibleText)) suspect.push(`${path.relative(root, file)}: word-internal question mark`);
  }
  assert.deepEqual(suspect, []);
});

test('known icon placeholders are not rendered as question marks', () => {
  assert.doesNotMatch(read('app.js'), /aria-hidden=["']true["']>\?[<]/);
  assert.doesNotMatch(read('city-origins.js'), /Suggested city highlights \?/);
  assert.doesNotMatch(read('destination-photo-expansion.js'), /\bInuyama \? Aichi\b|Japan\?s oldest/);
});

test('hero carousel has accessible controls and all nine map pins meet touch-target size', () => {
  const html = read('index.html');
  assert.match(html, /aria-roledescription="carousel"/);
  assert.match(html, /hero-carousel-prev/);
  assert.match(html, /hero-carousel-next/);
  assert.match(html, /hero-carousel-toggle/);
  assert.match(read('app.js'), /prefers-reduced-motion: reduce/);
  assert.match(read('app.js'), /mouseenter/);
  assert.match(read('app.js'), /focusin/);
  assert.equal((html.match(/class="atlas-region-pin"/g) || []).length, 9);
  assert.match(read('styles.css'), /\.atlas-region-pin\{width:46px;height:46px/);
  assert.match(html, /Natural Earth 1:10m · public domain/);
});

test('slash shortcut ignores selects and contenteditable fields; Tokyo tools are restricted by origin', () => {
  assert.match(read('app.js'), /matches\('input, textarea, select'\)/);
  assert.match(read('app.js'), /target\.isContentEditable/);
  const originUi = read('city-origin-ui.js');
  assert.match(originUi, /if\(isTokyo\).*tokyoTools\.append/);
  assert.match(originUi, /if\(tokyoTools\.isConnected\)tokyoTools\.remove\(\)/);
  assert.match(originUi, /origin\.city/);
});

test('share copies a stateful URL and announces confirmation; story galleries reject stale requests', () => {
  const app = read('app.js');
  assert.match(app, /clipboard\.writeText\(url\.href\)/);
  for (const field of ['month', 'days', 'region', 'style']) assert.match(app, new RegExp(`searchParams\\.set\\('${field}'`));
  assert.match(app, /Link copied/);
  assert.match(read('index.html'), /id="share-status" class="sr-only" role="status" aria-live="polite"/);
  assert.match(app, /requestId!==placeDialogRequest/);
  assert.match(app, /status\.textContent='Finding more photographs/);
  assert.match(app, /status\.textContent=`\$\{photos\.length\} additional/);
  assert.match(app, /placeDialog\.showModal\(\)/);
  assert.match(app, /placeDialog\.addEventListener\('close'/);
});

test('displayed catalogue counts are not hard-coded in page copy', () => {
  const copy = ['index.html', 'README.md'].map(read).join('\n');
  assert.doesNotMatch(copy, /\b(?:180|310) places\b/i);
  assert.doesNotMatch(read('app.js'), /Browse all (?:180|310) places/i);
});

test('guide manifest uses only complete or explicitly provisional states', () => {
  const manifest = JSON.parse(read('data/coverage-manifest.json'));
  assert.equal(manifest.records.length, places.length);
  for (const record of manifest.records) assert.ok(['complete', 'provisional'].includes(record.guideStatus), `${record.name}: ${record.guideStatus}`);
});

test('seasonal picks require the selected month and a month-specific rationale', () => {
  const source = read('app.js');
  assert.match(source, /JapanSeasonalEligibility/);
  assert.doesNotMatch(source, /place\.seasonReason\s*\|\|\s*'A seasonal place/);
  for (let month = 1; month <= 12; month += 1) {
    const picks = picksForMonth(places, month);
    assert.ok(picks.every(({place,reason}) => place.months.includes(month) && place.monthReasons[month].trim() === reason), `month ${month}`);
  }
});

