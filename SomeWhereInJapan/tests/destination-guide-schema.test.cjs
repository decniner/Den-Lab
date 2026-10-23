const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateGuideCompletion, validateGuideRecord, knownCostTotal } = require('../tools/destination-guide-schema.cjs');

const types = ['city','neighborhood','attraction','island','walking-route','hiking-route','region'];
function fixture(type) {
  const specific = {
    city: { areas: ['Central district'] },
    neighborhood: { walkingRoute: ['Main street','Market lane'] },
    attraction: { highlights: ['Main hall'] },
    island: { arrivalOptions: ['Ferry'] },
    'walking-route': { routeSections: ['Riverside','Old town'] },
    'hiking-route': { routeSections: ['Trailhead','Summit'], terrain: 'Steep trail' },
    region: { areas: ['North coast'] }
  }[type];
  return { id:'sample', type, story:'A researched destination story with context.', visitPlan:'Allow time to explore the main area.', access:'Use the named public entrance.', ...specific,
    costs:[{status:'unknown',sourceIds:[]}],
    sources:[{id:'official',url:'https://example.jp/official',checkedOn:'2026-10-22'}],
    claims:[{text:'The visitor entrance is on the east side.',sourceIds:['official']}]
  };
}

test('requiresTypeSpecificGuideEvidence', () => {
  for (const type of types) assert.deepEqual(evaluateGuideCompletion(fixture(type)), {complete:true,missing:[]}, type);
  for (const type of types) {
    const record = fixture(type);
    delete record[Object.keys({city:{areas:1},neighborhood:{walkingRoute:1},attraction:{highlights:1},island:{arrivalOptions:1},'walking-route':{routeSections:1},'hiking-route':{terrain:1},region:{areas:1}}[type])[0]];
    assert.equal(evaluateGuideCompletion(record).complete, false, type);
  }
});

test('unknownRequiredCostNeverCountsAsZero', () => {
  const record = fixture('attraction');
  assert.equal(knownCostTotal(record.costs), null);
  record.costs = [{status:'known',amount:500,currency:'JPY',sourceIds:['official']}];
  assert.equal(knownCostTotal(record.costs), 500);
});

test('materialClaimsRequireCheckedSources', () => {
  const record = fixture('attraction');
  record.claims[0].sourceIds = ['missing'];
  assert.ok(validateGuideRecord(record).some(issue => issue.code === 'claim-source-missing'));
});

test('checkedOnMustBeAnActualDate', () => {
  for (const checkedOn of ['2026-02-30','yesterday','2026-1-2']) {
    const record = fixture('attraction'); record.sources[0].checkedOn = checkedOn;
    assert.ok(validateGuideRecord(record).some(issue => issue.code === 'invalid-checked-on'), checkedOn);
  }
});
