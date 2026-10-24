import test from 'node:test';
import assert from 'node:assert/strict';

let plannerModule;
try {
  plannerModule = await import('../src/planner.js');
} catch {
  plannerModule = {};
}

function validate(input) {
  assert.equal(typeof plannerModule.validateTrip, 'function', 'validateTrip should be exported');
  return plannerModule.validateTrip(input);
}

function validateData(input) {
  assert.equal(typeof plannerModule.validateData, 'function', 'validateData should be exported');
  return plannerModule.validateData(input);
}

test('accepts a valid trip with a start, end, and origin', () => {
  assert.deepEqual(validate({ startDate: '2027-02-08', endDate: '2027-02-20', origin: 'Tokyo Station' }), {
    valid: true,
    errors: []
  });
});

test('requires both trip dates', () => {
  const result = validate({ origin: 'Tokyo Station' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /start date/i.test(error)));
  assert.ok(result.errors.some((error) => /end date/i.test(error)));
});

test('requires an origin', () => {
  const result = validate({ startDate: '2027-02-08', endDate: '2027-02-20', origin: '  ' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /starting point/i.test(error)));
});

test('rejects malformed calendar dates', () => {
  const result = validate({ startDate: '2027-02-30', endDate: '2027-03-02', origin: 'Tokyo Station' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /valid (start|end) date/i.test(error)));
});

test('rejects an end date before the start date', () => {
  const result = validate({ startDate: '2027-02-20', endDate: '2027-02-08', origin: 'Tokyo Station' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /after the start date/i.test(error)));
});

test('validateData rejects duplicate place ids', () => {
  const result = validateData({
    places: [
      { id: 'same', localityId: 'tokyo', name: 'A', durationHours: 1, status: 'sample' },
      { id: 'same', localityId: 'tokyo', name: 'B', durationHours: 1, status: 'sample' }
    ], routes: [], events: []
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /duplicate place id/i.test(error)));
});

test('validateData requires provenance metadata for verified places', () => {
  const result = validateData({
    places: [{ id: 'ueno', localityId: 'tokyo', name: 'Ueno Park', durationHours: 2, status: 'verified' }],
    routes: [], events: []
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /source url and checked date/i.test(error)));
});

test('validateData rejects impossible visit durations and malformed event dates', () => {
  const result = validateData({
    places: [{ id: 'ueno', localityId: 'tokyo', name: 'Ueno Park', durationHours: 0, status: 'sample' }],
    routes: [],
    events: [{ id: 'festival', localityId: 'sapporo', name: 'Festival', startDate: '2027-02-12', endDate: '2027-02-11', sourceUrl: 'https://example.org', checkedAt: '2026-10-24', status: 'verified' }]
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /duration/i.test(error)));
  assert.ok(result.errors.some((error) => /event date range/i.test(error)));
});

test('buildItinerary is exported for deterministic route planning', () => {
  assert.equal(typeof plannerModule.buildItinerary, 'function');
});

test('keeps distinct localities on separate sightseeing days and inserts transfer days', () => {
  const result = plannerModule.buildItinerary({
    startDate: '2027-02-08', endDate: '2027-02-12', origin: 'Tokyo Station',
    selectedRegions: ['hokkaido'], pace: 'balanced'
  }, {
    places: [
      { id: 'sapporo-stop', name: 'Sapporo stop', localityId: 'sapporo', durationHours: 3, status: 'sample' },
      { id: 'otaru-stop', name: 'Otaru stop', localityId: 'otaru', durationHours: 3, status: 'sample' }
    ],
    localities: [
      { id: 'sapporo', name: 'Sapporo', regionId: 'hokkaido' },
      { id: 'otaru', name: 'Otaru', regionId: 'hokkaido' }
    ],
    routes: [{ id: 'hokkaido', regionId: 'hokkaido', localityIds: ['sapporo', 'otaru'], transferDays: 1, status: 'sample' }],
    events: []
  });
  assert.equal(result.days[0].type, 'transfer');
  const sightseeingDays = result.days.filter((day) => day.stops.length);
  assert.deepEqual(sightseeingDays.map((day) => day.localityId), ['sapporo', 'otaru']);
  assert.ok(result.days.some((day) => day.type === 'transfer' && day.localityId === 'otaru'));
});

test('only schedules an event when the day is inside its stated date range', () => {
  const data = {
    places: [{ id: 'festival', name: 'Snow festival', localityId: 'sapporo', durationHours: 3, status: 'sample' }],
    localities: [{ id: 'sapporo', name: 'Sapporo', regionId: 'hokkaido' }],
    routes: [{ id: 'hokkaido', regionId: 'hokkaido', localityIds: ['sapporo'], transferDays: 0, status: 'sample' }],
    events: [{ id: 'snow', placeId: 'festival', name: 'Snow festival', startDate: '2027-02-04', endDate: '2027-02-11', status: 'sample' }]
  };
  const result = plannerModule.buildItinerary({ startDate: '2027-02-12', endDate: '2027-02-12', origin: 'Sapporo', selectedRegions: ['hokkaido'], mustSee: ['festival'] }, data);
  assert.equal(result.days.flatMap((day) => day.stops).some((stop) => stop.id === 'festival'), false);
  assert.ok(result.warnings.some((warning) => /event/i.test(warning.message)));
  assert.ok(result.warnings.some((warning) => /must-see places not scheduled: snow festival/i.test(warning.message)));
});

test('arrival and departure dates with limited hours are not filled as full sightseeing days', () => {
  const data = {
    places: [{ id: 'park', name: 'Park', localityId: 'tokyo', durationHours: 2, status: 'sample' }],
    localities: [{ id: 'tokyo', name: 'Tokyo', regionId: 'kanto' }],
    routes: [{ id: 'kanto', regionId: 'kanto', localityIds: ['tokyo'], transferDays: 0, status: 'sample' }],
    events: []
  };
  const result = plannerModule.buildItinerary({ startDate: '2027-02-08', endDate: '2027-02-09', origin: 'Tokyo Station', arrivalTime: '17:00', departureTime: '10:00', selectedRegions: ['kanto'] }, data);
  assert.equal(result.days[0].stops.length, 0);
  assert.equal(result.days[1].stops.length, 0);
});

test('February 8–20 from Tokyo reserves a transfer day and keeps the festival inside its verified window', async () => {
  const [places, localities, routes, events] = await Promise.all(['places', 'localities', 'routes', 'events'].map(async (file) => {
    const { readFile } = await import('node:fs/promises');
    return JSON.parse(await readFile(new URL(`../data/${file}.json`, import.meta.url), 'utf8'));
  }));
  const result = plannerModule.buildItinerary({ startDate: '2027-02-08', endDate: '2027-02-20', origin: 'Tokyo Station', routeId: 'hokkaido-winter', selectedRegions: ['hokkaido'], pace: 'balanced' }, { places, localities, routes, events });
  assert.equal(result.days[0].type, 'transfer');
  const festivalDay = result.days.find((day) => day.stops.some((stop) => stop.id === 'sapporo-snow-festival'));
  assert.ok(festivalDay, 'festival should be scheduled during the trip');
  assert.ok(festivalDay.date >= '2027-02-04' && festivalDay.date <= '2027-02-11');
  assert.equal(festivalDay.type, 'sightseeing', 'events must not be placed on a transfer day');
  for (const day of result.days) assert.ok(new Set(day.stops.map((stop) => stop.localityId)).size <= 1, 'a day must not mix distant localities');
  assert.ok(result.days.slice(5).every((day) => day.type === 'buffer' && day.base === 'Furano'), 'unused dates should be labeled as open buffers at the final base');
});

test('preferred overnight bases limit the route to selected places', () => {
  const data = {
    places: [
      { id: 'sapporo', name: 'Sapporo stop', localityId: 'sapporo', durationHours: 2, status: 'sample' },
      { id: 'otaru', name: 'Otaru stop', localityId: 'otaru', durationHours: 2, status: 'sample' }
    ],
    localities: [{ id: 'sapporo', name: 'Sapporo', regionId: 'hokkaido' }, { id: 'otaru', name: 'Otaru', regionId: 'hokkaido' }],
    routes: [{ id: 'hokkaido', regionId: 'hokkaido', localityIds: ['sapporo', 'otaru'], transferDays: 1, status: 'sample' }], events: []
  };
  const result = plannerModule.buildItinerary({ startDate: '2027-02-08', endDate: '2027-02-10', origin: 'Sapporo', selectedRegions: ['hokkaido'], preferredBases: ['otaru'] }, data);
  assert.deepEqual(result.days.flatMap((day) => day.stops).map((stop) => stop.id), ['otaru']);
  assert.ok(result.days.every((day) => day.localityId === 'otaru' || day.type === 'sightseeing'));
});

test('separate Okinawa islands receive a full transfer day', async () => {
  const [places, localities, routes, events] = await Promise.all(['places', 'localities', 'routes', 'events'].map(async (file) => {
    const { readFile } = await import('node:fs/promises');
    return JSON.parse(await readFile(new URL(`../data/${file}.json`, import.meta.url), 'utf8'));
  }));
  const result = plannerModule.buildItinerary({ startDate: '2027-02-08', endDate: '2027-02-14', origin: 'Tokyo Station', routeId: 'okinawa-islands', selectedRegions: ['okinawa'] }, { places, localities, routes, events });
  assert.ok(result.days.some((day) => day.type === 'transfer' && day.localityId === 'naha'));
  assert.ok(result.days.some((day) => day.type === 'transfer' && day.localityId === 'ishigaki'));
  assert.ok(result.days.every((day) => new Set(day.stops.map((stop) => stop.localityId)).size <= 1));
});

test('short regional links show a transfer note without consuming a full day', async () => {
  const [places, localities, routes, events] = await Promise.all(['places', 'localities', 'routes', 'events'].map(async (file) => {
    const { readFile } = await import('node:fs/promises');
    return JSON.parse(await readFile(new URL(`../data/${file}.json`, import.meta.url), 'utf8'));
  }));
  const result = plannerModule.buildItinerary({ startDate: '2027-02-08', endDate: '2027-02-20', origin: 'Tokyo Station', routeId: 'hokkaido-winter', selectedRegions: ['hokkaido'] }, { places, localities, routes, events });
  const regionalMove = result.days.find((day) => day.transferNotes.some((note) => /Sapporo to Otaru/.test(note)));
  assert.ok(regionalMove, 'the local base change should be visible');
  assert.ok(regionalMove.stops.some((stop) => stop.localityId === 'otaru'), 'a short link should not consume a full day by itself');
  assert.equal(regionalMove.type, 'sightseeing');
});

test('the complete sample catalog satisfies its own provenance and reference rules', async () => {
  const [places, localities, routes, events] = await Promise.all(['places', 'localities', 'routes', 'events'].map(async (file) => {
    const { readFile } = await import('node:fs/promises');
    return JSON.parse(await readFile(new URL(`../data/${file}.json`, import.meta.url), 'utf8'));
  }));
  assert.deepEqual(plannerModule.validateData({ places, localities, routes, events }), { valid: true, errors: [] });
});

test('reports sample, estimated, verified, stale, and unverified provenance distinctly', () => {
  assert.deepEqual(plannerModule.getRecordStatus({ status: 'sample' }, '2026-10-24'), { label: 'Sample planning data', kind: 'sample' });
  assert.deepEqual(plannerModule.getRecordStatus({ status: 'estimated' }, '2026-10-24'), { label: 'Planning estimate', kind: 'estimated' });
  assert.deepEqual(plannerModule.getRecordStatus({ status: 'verified', checkedAt: '2026-10-24' }, '2026-10-24'), { label: 'Source checked 2026-10-24', kind: 'verified' });
  assert.deepEqual(plannerModule.getRecordStatus({ status: 'verified', checkedAt: '2026-01-01' }, '2026-10-24'), { label: 'Source is stale', kind: 'stale' });
  assert.deepEqual(plannerModule.getRecordStatus({ status: 'unverified' }, '2026-10-24'), { label: 'Unverified', kind: 'unknown' });
});
