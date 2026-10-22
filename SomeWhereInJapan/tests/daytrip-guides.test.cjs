'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const trips = require('../daytrips.js').DAY_TRIPS;

test('each route profile includes precise, map-linked stops and practical route notes', () => {
  assert.equal(trips.length, 5);
  const photos = trips.map((trip) => trip.image.url);
  assert.equal(new Set(photos).size, trips.length, 'each route has a different exact-place photo');
  for (const trip of trips) {
    assert.ok(trip.guide.shortPlan?.duration && trip.guide.shortPlan.route && trip.guide.shortPlan.omitted, `${trip.slug}: shared shorter-day guidance`);
    const full = trip.modes.public.profiles.full;
    assert.deepEqual(full.stops.map((stop) => stop.name), trip.guide.stops.map((stop) => stop.name), `${trip.slug}: planner and guide full routes agree`);
    if (trip.modes.public.profiles.half) {
      const half = trip.modes.public.profiles.half;
      assert.ok(half.stops.length < full.stops.length, `${trip.slug}: half-day route is shorter`);
      assert.deepEqual(half.stops.map((stop) => stop.name), trip.guide.shortStopIndices.map((index) => trip.guide.stops[index].name), `${trip.slug}: half-day map follows its shorter itinerary`);
      const duration = trip.guide.shortPlan.duration.match(/([\d.]+)[–-]([\d.]+) hours?/i);
      assert.ok(duration, `${trip.slug}: shorter-day duration is explicit`);
      assert.equal(Number(duration[1]), half.totalHours.min, `${trip.slug}: short guidance minimum matches planner`);
      assert.equal(Number(duration[2]), half.totalHours.max, `${trip.slug}: short guidance maximum matches planner`);
    }
    for (const mode of Object.values(trip.modes)) for (const profile of Object.values(mode.profiles)) {
      assert.ok(profile.stops.length >= 3, `${trip.slug}: stops`);
      assert.ok(profile.stops.every((stop) => stop.name && stop.address && Number.isFinite(stop.lat) && Number.isFinite(stop.lon) && stop.walk && stop.duration), `${trip.slug}: stop fields`);
      assert.ok(profile.rainPlan && profile.sources.length > 0, `${trip.slug}: rain fallback and sources`);
    }
    const html = fs.readFileSync(path.join(root, 'day-trips', trip.slug, 'index.html'), 'utf8');
    assert.match(html, /<main[^>]+route-guide/);
    assert.match(html, /route-map-interactive/);
    assert.match(html, /short-route-card/);
    assert.match(html, /Planning ranges with stated gaps/);
    assert.match(html, /WHEN YOU HAVE LESS TIME/);
    assert.match(html, /route-sources/);
    assert.match(html, /youtube\.com\/results\?search_query=/);
    assert.match(html, /2026-10-22/);
    assert.match(html, /Return to the arrival station/);
    if (trip.slug === 'kawagoe') assert.match(html, /Open the Kawagoe street map on OpenStreetMap/);
    assert.doesNotMatch(html, /EDITORIAL ROUTE SKETCH|EDITORIAL TYPOGRAPHY FALLBACK/);
    assert.doesNotMatch(html, /Map data © OpenStreetMap contributors/);
  }
  assert.ok(fs.existsSync(path.join(root, 'docs/usability/day-trip-guide-session-script.md')));
  assert.ok(fs.existsSync(path.join(root, 'docs/usability/day-trip-guide-findings-template.md')));
  assert.ok(fs.existsSync(path.join(root, 'docs/day-trip-guide-evidence-gaps.md')));
});
