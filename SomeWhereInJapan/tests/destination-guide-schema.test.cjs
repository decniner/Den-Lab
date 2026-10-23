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
    claims:[{text:'The visitor entrance is on the east side.',sourceIds:['official']}],
    accessModes:Object.fromEntries(['rail','bus','air','car'].map(mode=>[mode,{status:'known',detail:`${mode} access via the visitor entrance`,sourceIds:['official']} ])),
    points:[{name:'Main entrance',address:'1 Example Street',coordinates:{latitude:35.6,longitude:139.7},sourceIds:['official']}],
    contacts:[{status:'unknown',note:'No verified phone contact found in the cited official visitor information.'}],
    stayRecommendations:[{name:'Central visitor area',area:'Near the named station',sourceIds:['official']}],
    photo:{status:'verified',url:'https://example.jp/photo.jpg',source:'https://example.jp/photo',license:'CC BY 4.0',sourceIds:['official']},
    mapLocation:{status:'verified',latitude:35.6,longitude:139.7,sourceIds:['official']},
    weatherPlan:{alternative:'Use the indoor visitor area during rain.',sourceIds:['official']}
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

test('a guide cannot be complete without sourced map points, access, contact, stay, photo, and weather notes', () => {
  const record = fixture('attraction');
  delete record.mapLocation; delete record.accessModes; delete record.contacts;
  record.photo.status = 'unverified'; delete record.stayRecommendations; delete record.weatherPlan;
  const result = evaluateGuideCompletion(record);
  assert.equal(result.complete,false);
  const codes = validateGuideRecord(record).map(issue=>issue.code);
  for (const code of ['missing-access-mode','missing-contact-evidence','missing-stay-recommendations','photo-not-verified','map-location-not-verified','weather-plan-not-verified']) assert.ok(codes.includes(code),code);
});

test('firstResearchBatchCoversEveryApplicableTypeAndHasSourceLedger', () => {
  const fs = require('node:fs'); const path = require('node:path');
  const batch = JSON.parse(fs.readFileSync(path.join(__dirname,'..','research','batches','01.json'),'utf8'));
  assert.ok(batch.records.length <= 20);
  const covered = new Set(batch.records.map(record=>record.type));
  for (const type of types) assert.ok(covered.has(type),type);
  for (const record of batch.records) {
    assert.ok(['in-progress','partially-verified','verified','identity-alias'].includes(record.status),record.id);
    assert.ok(record.sources.length && record.sources.every(source=>source.url && source.checkedOn && /^\d{4}-\d{2}-\d{2}$/.test(source.checkedOn)),record.id);
    assert.ok(record.nextAction,record.id);
  }
});
