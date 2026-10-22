'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('seasonal shortlist cannot present regional groupings as a day route', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const start = app.indexOf('function renderMonthRoute(');
  const end = app.indexOf("document.querySelector('#build-month-route')", start);
  const renderer = app.slice(start, end);
  assert.match(renderer, /SEASONAL INSPIRATION/);
  assert.match(renderer, /does not confirm a practical same-day itinerary/);
  assert.match(renderer, /maps\/search\/\?api=1/);
  assert.doesNotMatch(renderer, /DAY \$\{|waypoints|maps\/dir\//i);
});

test('city-origin directions use independent legs and keep extra days open', () => {
  const core = require('../city-origins.js');
  const plan = core.CITY_DAY_PLANS.tokyo;
  const url = new URL(core.dayPlanDirectionsUrl(core.CITY_ORIGINS.find((item) => item.id === 'tokyo'), plan.stops, 'transit'));
  assert.equal(url.searchParams.has('waypoints'), false);
  assert.equal(url.searchParams.get('destination'), `${plan.stops[0].name}, ${plan.stops[0].area}, Japan`);
  assert.deepEqual(core.itineraryDays(plan.stops, '3')[2].stops, []);
});
