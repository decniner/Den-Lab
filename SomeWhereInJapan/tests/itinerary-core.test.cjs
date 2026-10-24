const test = require('node:test');
const assert = require('node:assert/strict');
const { buildItinerary, moveStop, removeStop } = require('../itinerary-core.js');

const places = [
  {id:'sapporo',name:'Sapporo',region:'Hokkaido',tags:['Food','Culture'],months:[1,2],monthReasons:{2:'Winter festival season.'}},
  {id:'otaru',name:'Otaru',region:'Hokkaido',tags:['Culture','Slow travel'],months:[2],monthReasons:{2:'Snow season.'}},
  {id:'kyoto',name:'Kyoto',region:'Kansai',tags:['Culture'],months:[2,3],monthReasons:{2:'Plum season may begin.'}},
  {id:'okinawa',name:'Okinawa',region:'Okinawa',tags:['Islands','Nature'],months:[7,8]}
];

test('creates one dated day per trip day and favors season-tagged places', () => {
  const plan = buildItinerary({destinations:places,startDate:'2027-02-08',days:2,regions:['Hokkaido'],interests:['Culture'],pace:'relaxed'});
  assert.equal(plan.days.length,2);
  assert.equal(plan.days[0].date,'2027-02-08');
  assert.ok(plan.days[0].places.some(place=>place.id==='sapporo'));
  assert.equal(plan.days[1].date,'2027-02-09');
});

test('keeps places unique across days and respects pace limit', () => {
  const plan = buildItinerary({destinations:places,startDate:'2027-02-08',days:3,regions:['Hokkaido','Kansai'],interests:[],pace:'relaxed'});
  const ids=plan.days.flatMap(day=>day.places.map(place=>place.id));
  assert.equal(new Set(ids).size,ids.length);
  assert.ok(plan.days.every(day=>day.places.length<=2));
});

test('returns an explanatory empty plan for invalid dates or no matching destinations', () => {
  assert.equal(buildItinerary({destinations:[],startDate:'bad',days:2}).days.length,0);
  const plan=buildItinerary({destinations:places,startDate:'2027-02-08',days:2,regions:['Kyushu']});
  assert.ok(plan.notes.length>0);
  assert.ok(plan.days.every(day=>day.places.length===0));
});

test('supports removing and moving a stop without mutating the input', () => {
  const plan={days:[{date:'2027-02-08',region:'Hokkaido',places:[places[0],places[1]]},{date:'2027-02-09',region:'Hokkaido',places:[]}]};
  const moved=moveStop(plan,'otaru',0,1,0);
  assert.deepEqual(moved.days[0].places.map(p=>p.id),['sapporo']);
  assert.deepEqual(moved.days[1].places.map(p=>p.id),['otaru']);
  assert.equal(plan.days[0].places.length,2);
  assert.equal(removeStop(moved,1,'otaru').days[1].places.length,0);
});

test('uses each calendar date month when a trip crosses into a new month', () => {
  const seasonalPlaces = [
    {id:'feb',name:'February place',region:'Hokkaido',tags:[],months:[2],monthReasons:{2:'February note'}},
    {id:'mar',name:'March place',region:'Hokkaido',tags:[],months:[3],monthReasons:{3:'March note'}}
  ];
  const plan = buildItinerary({destinations:seasonalPlaces,startDate:'2027-02-28',days:2,regions:['Hokkaido'],pace:'relaxed'});
  assert.equal(plan.days[0].places[0].id,'feb');
  assert.equal(plan.days[1].places[0].id,'mar');
});

test('groups multi-region draft days instead of alternating regions each day', () => {
  const manyPlaces = Array.from({length:12},(_,index)=>({
    id:`p${index}`,name:`Place ${index}`,region:index<6?'Hokkaido':'Kansai',tags:[],months:[2]
  }));
  const plan = buildItinerary({destinations:manyPlaces,startDate:'2027-02-08',days:6,regions:['Hokkaido','Kansai'],pace:'relaxed'});
  const sequence=plan.days.map(day=>day.region);
  assert.deepEqual(sequence,['Hokkaido','Hokkaido','Hokkaido','Kansai','Kansai','Kansai']);
});

test('recognizes locally saved places by their catalog name', () => {
  const savedFirst = [
    {id:'a',name:'A quiet stop',region:'Kanto',tags:[],months:[2]},
    {id:'b',name:'B quiet stop',region:'Kanto',tags:[],months:[2]},
    {id:'c',name:'C quiet stop',region:'Kanto',tags:[],months:[2]}
  ];
  const plan = buildItinerary({destinations:savedFirst,startDate:'2027-02-08',days:1,regions:['Kanto'],savedIds:['C quiet stop'],pace:'relaxed'});
  assert.equal(plan.days[0].places[0].name,'C quiet stop');
});
