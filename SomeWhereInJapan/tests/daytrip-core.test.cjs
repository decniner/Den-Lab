'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
let tripData = {};
try { tripData = require('../daytrips.js'); } catch (_error) { /* expected before data task */ }

let core = {};
try {
  core = require('../daytrip-core.js');
} catch (_error) {
  // Let each behavior test fail with a clear missing-export assertion.
}

const makeProfile = (slug, totalHours, costMax) => ({
  roundTripHours: { min: 2, max: 3 },
  totalHours: { min: totalHours - 1, max: totalHours },
  costYen: { min: 5000, max: costMax },
  estimateStatus: 'complete',
  costBreakdown: { transport: { min: 1000, max: costMax - 4500 }, admissions: { min: 500, max: 500 }, meal: { min: 3500, max: 4000 } },
  arrival: `${slug} Station`,
  sources: ['https://example.jp/route']
});

const makeTrip = (slug, overrides = {}) => ({
  id: slug,
  slug,
  months: [4],
  interests: ['nature'],
  modes: {
    public: {
      profiles: { half: makeProfile(slug, 6, 8000), full: makeProfile(slug, 8, 12000) }
    },
    car: {
      profiles: { half: makeProfile(`${slug} parking`, 6, 9000), full: makeProfile(`${slug} parking`, 8, 13000) }
    }
  },
  ...overrides
});

test('pilotTripRecordsAreCompleteAndCosted', () => {
  const trips = tripData.DAY_TRIPS;
  assert.ok(Array.isArray(trips), 'DAY_TRIPS data export exists');
  if (!Array.isArray(trips)) return;
  assert.deepEqual(trips.map((trip) => trip.slug).sort(), ['kawagoe', 'mitake', 'narita', 'odawara', 'sawara']);
  for (const trip of trips) {
    assert.ok(Array.isArray(trip.months) && trip.months.length > 0 && trip.months.every((month) => month >= 1 && month <= 12), trip.slug + ' months');
    assert.ok(trip.seasonFit && trip.months.every((month) => typeof trip.seasonFit[month] === 'string'), trip.slug + ' seasonal guidance');
    assert.ok(trip.effort && trip.tradeoff && trip.arrival, trip.slug + ' effort, tradeoff and arrival');
    assert.ok(trip.sources && trip.sources.length > 0 && trip.checkedOn, trip.slug + ' research metadata');
    if (trip.image) assert.ok(trip.image.credit && trip.image.license, trip.slug + ' image rights');
    else assert.ok(['sawara', 'mitake', 'narita'].includes(trip.slug), trip.slug + ' photo-free only after destination-specific source audit');
    assert.ok(Object.keys(trip.modes).length > 0, trip.slug + ' supported mode');
    for (const [mode, record] of Object.entries(trip.modes)) for (const [time, profile] of Object.entries(record.profiles)) {
      assert.ok(profile.totalHours.min > 0 && profile.totalHours.max >= profile.totalHours.min, trip.slug + ' ' + mode + ' ' + time + ' duration');
      if (profile.estimateStatus === 'complete') {
        assert.ok(profile.costYen.max >= profile.costYen.min && profile.costYen.min > 0, trip.slug + ' ' + mode + ' ' + time + ' cost');
        const components = Object.values(profile.costBreakdown);
        assert.equal(components.reduce((total, part) => total + part.min, 0), profile.costYen.min, trip.slug + ' minimum cost components sum');
        assert.equal(components.reduce((total, part) => total + part.max, 0), profile.costYen.max, trip.slug + ' maximum cost components sum');
        assert.ok(profile.timeBudget, trip.slug + ' complete estimate has explicit day-time components');
        assert.equal(Object.values(profile.timeBudget).reduce((total, part) => total + part.min, 0), profile.totalHours.min, trip.slug + ' minimum time components sum');
        assert.equal(Object.values(profile.timeBudget).reduce((total, part) => total + part.max, 0), profile.totalHours.max, trip.slug + ' maximum time components sum');
      } else {
        assert.equal(profile.costYen, null, trip.slug + ' incomplete total is not displayed');
        assert.equal(profile.costBreakdown, null, trip.slug + ' unknown costs are not zero-filled');
      }
      assert.ok(profile.arrival && Array.isArray(profile.stops) && profile.stops.length >= 2 && profile.sources.length > 0, trip.slug + ' route detail');
    }
  }
  assert.deepEqual(trips.filter((trip) => trip.modes.public.profiles.full.estimateStatus === 'complete').map((trip) => trip.slug), ['sawara']);
});

test('filtersByMonthTransportDurationAndUpperBudget', () => {
  assert.equal(typeof core.filterTrips, 'function', 'filterTrips export exists');
  if (typeof core.filterTrips !== 'function') return;

  const trips = [
    makeTrip('boundary-fit'),
    makeTrip('too-long', { modes: { public: { profiles: { half: makeProfile('too-long', 6.1, 7000) } } } }),
    makeTrip('over-budget', { modes: { public: { profiles: { half: makeProfile('over-budget', 6, 8001) } } } }),
    makeTrip('wrong-month', { months: [5] }),
    makeTrip('wrong-mode', { modes: { car: makeTrip('car-only').modes.car } })
  ];
  const matches = core.filterTrips(trips, {
    month: 4, time: 'half', transport: 'public', budget: 8000, interest: 'balanced'
  });

  assert.deepEqual(matches.map((trip) => trip.slug), ['boundary-fit']);
});

test('ignores legacy saved finder state but restores versioned state', () => {
  const storage = { value: JSON.stringify({ month: 10, time: 'full', transport: 'public', budget: 1000, interest: 'balanced' }), getItem() { return this.value; }, setItem(_key, value) { this.value = value; } };
  assert.equal(core.loadPlan(storage, ['sawara']), null, 'unversioned ¥1,000 state must not override defaults');
  assert.equal(core.savePlan(storage, { month: 10, time: 'full', transport: 'public', budget: 15000, interest: 'balanced', selectedId: 'sawara' }), true);
  assert.deepEqual(core.loadPlan(storage, ['sawara']), { ...core.DEFAULTS, selectedId: 'sawara', compareIds: [] });
});

test('incomplete or inconsistent cost estimates never qualify for a budget match', () => {
  const incomplete = makeTrip('unknown-cost', { modes: { public: { profiles: {
    half: { ...makeProfile('unknown-cost', 6, 1000), estimateStatus: 'incomplete', costBreakdown: { transport: { min: 0, max: 0 }, admissions: { min: 0, max: 0 }, meal: { min: 0, max: 0 } } }
  } } } });
  const inconsistent = makeTrip('bad-total', { modes: { public: { profiles: {
    half: { ...makeProfile('bad-total', 6, 1000), estimateStatus: 'complete', costBreakdown: { transport: { min: 100, max: 100 }, admissions: { min: 0, max: 0 }, meal: { min: 100, max: 100 } } }
  } } } });
  assert.deepEqual(core.filterTrips([incomplete, inconsistent], { month: 4, time: 'half', transport: 'public', budget: 2000 }), []);
  assert.deepEqual(core.findUnbudgetedTrips([incomplete, inconsistent], { month: 4, time: 'half', transport: 'public', budget: 2000 }).map((trip) => trip.slug), ['unknown-cost', 'bad-total']);
  assert.match(core.createNoMatchMessage([incomplete], { month: 4, time: 'half', transport: 'public', budget: 2000 }), /costs are incomplete/i);
});

test('ranksInterestThenDurationThenSlugAndCapsAtThree', () => {
  assert.equal(typeof core.filterTrips, 'function', 'filterTrips export exists');
  if (typeof core.filterTrips !== 'function') return;

  const trip = (slug, interests, maxHours) => makeTrip(slug, {
    interests,
    modes: { public: { profiles: { full: {
      ...makeProfile(`${slug} Station`, maxHours, 7000),
      totalHours: { min: 7, max: maxHours }, costYen: { min: 4000, max: 7000 },
      costBreakdown: { transport: { min: 500, max: 3000 }, admissions: { min: 0, max: 500 }, meal: { min: 3500, max: 3500 } }
    } } } }
  });
  const trips = [
    trip('match-slower', ['culture'], 10),
    trip('zeta', ['food'], 8),
    trip('alpha', ['food'], 8),
    trip('match-faster', ['culture'], 9),
    trip('fourth', ['nature'], 8)
  ];
  const matches = core.filterTrips(trips, {
    month: 4, time: 'full', transport: 'public', budget: 7000, interest: 'culture'
  });

  assert.deepEqual(matches.map((item) => item.slug), ['match-faster', 'match-slower', 'alpha']);
});

test('suggestsConcreteChangesWhenNoTripFits', () => {
  assert.equal(typeof core.createNoMatchMessage, 'function', 'createNoMatchMessage export exists');
  if (typeof core.createNoMatchMessage !== 'function') return;

  const trips = [makeTrip('spring-nature', { modes: { public: { profiles: {
    half: makeProfile('Spring Station', 8, 8000), full: makeProfile('Spring Station', 8, 8000)
  } } } })];
  const message = core.createNoMatchMessage(trips, {
    month: 4, time: 'half', transport: 'public', budget: 7000, interest: 'balanced'
  });

  assert.match(message, /full day/i);
  assert.match(message, /8,000|8000/);
});

test('restoresOnlyValidSharedStateAndTripIds', () => {
  assert.equal(typeof core.readSharedPlan, 'function', 'readSharedPlan export exists');
  assert.equal(typeof core.buildShareUrl, 'function', 'buildShareUrl export exists');
  if (typeof core.readSharedPlan !== 'function' || typeof core.buildShareUrl !== 'function') return;

  const trips = [makeTrip('alpha'), makeTrip('beta')];
  const state = {
    month: 4, time: 'full', transport: 'public', budget: 16000,
    interest: 'culture', compareIds: ['alpha', 'beta'], selectedId: 'beta'
  };
  const url = core.buildShareUrl('https://example.jp/guide/index.html', state);
  const restored = core.readSharedPlan(new URL(url).search, trips);

  assert.deepEqual(restored, state);
  const unsafe = core.readSharedPlan('?month=99&time=overnight&transport=plane&budget=-2&interest=<script>&trip=missing', trips);
  assert.equal(unsafe.month >= 1 && unsafe.month <= 12, true);
  assert.equal(['half', 'full'].includes(unsafe.time), true);
  assert.equal(['public', 'car'].includes(unsafe.transport), true);
  assert.equal(Number.isFinite(unsafe.budget) && unsafe.budget >= 0, true);
  assert.deepEqual(unsafe.compareIds, []);
  assert.equal(unsafe.selectedId, null);
});

test('handlesMalformedOrThrowingStorage', () => {
  assert.equal(typeof core.savePlan, 'function', 'savePlan export exists');
  assert.equal(typeof core.loadPlan, 'function', 'loadPlan export exists');
  if (typeof core.savePlan !== 'function' || typeof core.loadPlan !== 'function') return;

  const state = {
    month: 4, time: 'full', transport: 'public', budget: 16000,
    interest: 'balanced', compareIds: ['alpha'], selectedId: 'alpha'
  };
  let stored = '';
  const workingStorage = {
    setItem(_key, value) { stored = value; },
    getItem() { return stored; }
  };
  assert.equal(core.savePlan(workingStorage, state), true);
  assert.deepEqual(core.loadPlan(workingStorage, ['alpha']), state);
  assert.equal(core.loadPlan({ getItem() { return '{'; } }, ['alpha']), null);
  assert.equal(core.savePlan({ setItem() { throw new Error('quota'); } }, state), false);
  assert.equal(core.loadPlan({ getItem() { throw new Error('denied'); } }, ['alpha']), null);
});
