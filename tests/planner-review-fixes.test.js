import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = existsSync(path.join(root, 'sijdev/index.html')) ? 'sijdev' : 'dist';
const read = file => readFile(path.join(root, file.replace(/^dist\//, site + '/')), 'utf8');
const require = createRequire(import.meta.url);
require(`../${site}/city-origins.js`);
require(`../${site}/daytrips.js`);
const origins = globalThis.CityOrigins;
const trips = globalThis.TokyoDayTrips;

test('city planner distinguishes ten city plans from Tokyo-only detailed comparison estimates', async () => {
  assert.equal(origins.CITY_ORIGINS.length, 10);
  for (const origin of origins.CITY_ORIGINS) {
    assert.ok(origins.CITY_DAY_PLANS[origin.id], `missing city plan for ${origin.city}`);
    assert.ok(origins.CITY_DAY_PLANS[origin.id].stops.length >= 3);
  }
  const html = await read('dist/index.html');
  assert.match(html, /10 city plans/i);
  assert.match(html, /Tokyo has five detailed cost comparisons/i);
});

test('Tokyo heading explains that only Tokyo has sourced price comparisons', async () => {
  const ui = await read(`${site}/city-origin-ui.js`);
  assert.match(ui, /ten researched city plans across Japan/);
  assert.match(ui, /only origin with five sourced day-trip cost comparisons/);
  assert.match(ui, /tokyoTools\\.open=true/);
});

test('Tokyo field-note links stay inside the Dev Version and select the matching route', async () => {
  const html = await read('dist/index.html');
  const block = html.match(/<nav aria-label="Tokyo day-trip field notes" id="daytrip-guides">([\s\S]*?)<\/nav>/);
  assert.ok(block);
  assert.doesNotMatch(block[1], /SomeWhereInJapan/);
  const links = [...block[1].matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  assert.equal(links.length, 5);
  for (const trip of trips.DAY_TRIPS) assert.ok(links.some(href => href.includes(`selected=${trip.id}`)), `missing local link for ${trip.id}`);
});

test('itinerary defaults each daily start to the chosen origin and explains unknown timing', async () => {
  const planner = await read('dist/itinerary-planner.js');
  assert.match(planner, /day\.navigationStart = currentConfig\.origin \|\| ''/);
  assert.match(await read('dist/index.html'), /total travel time, visit duration, opening hours and fares are not calculated/i);
  assert.match(planner, /Google Maps provides live directions for each leg/);
});

test('unavailable street maps offer a retry and retain a Google Maps fallback', async () => {
  const ui = await read('dist/city-route-ui.js');
  assert.match(ui, /data-map-retry/);
  assert.match(ui, /Retrying street map/);
  assert.match(ui, /mountCityRouteMap\(host,mapData/);
  assert.match(ui, /Google Maps/);
});
