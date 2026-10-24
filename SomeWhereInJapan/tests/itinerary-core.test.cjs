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
  assert.ok(plan.days.some(day=>day.places.some(place=>place.id==='sapporo')));
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
  assert.match(plan.days[3].note,/Travel day: connect from Hokkaido to Kansai/);
  assert.equal(plan.days[3].places.length,0);
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

test('automatic region choice stays in one region instead of creating a multi-region loop', () => {
  const plan = buildItinerary({destinations:places,startDate:'2027-02-08',days:13,interests:['Culture'],pace:'balanced'});
  assert.equal(new Set(plan.days.map(day=>day.region).filter(Boolean)).size,1);
});

test('a confirmed event window can make its region the automatic best fit', () => {
  const eventPlaces = [
    {id:'event',name:'Sapporo Snow Festival',region:'Hokkaido',place:'Odori · Sapporo',tags:[],months:[2],eventDates:[{start:'2027-02-04',end:'2027-02-11'}]},
    ...Array.from({length:8},(_,index)=>({id:`tokyo${index}`,name:`Tokyo place ${index}`,region:'Kanto',place:'Tokyo · Kanto',tags:[],months:[2]}))
  ];
  const plan=buildItinerary({destinations:eventPlaces,startDate:'2027-02-08',days:13,pace:'balanced'});
  assert.equal(plan.days[0].region,'Hokkaido');
  assert.ok(plan.days[0].places.some(place=>place.id==='event'));
});

test('reserves the first day for a known cross-region journey from the supplied origin', () => {
  const plan=buildItinerary({destinations:places,startDate:'2027-02-08',days:3,regions:['Hokkaido'],origin:'Tokyo Station'});
  assert.equal(plan.days[0].places.length,0);
  assert.match(plan.days[0].note,/Travel day: connect from Tokyo Station to Hokkaido/);
  assert.equal(plan.days[1].region,'Hokkaido');
});

test('keeps each day within one city area', () => {
  const cityPlaces = [
    {id:'kyoto-a',name:'Kyoto A',region:'Kansai',place:'Central Kyoto · Kyoto',tags:[],months:[2]},
    {id:'kyoto-b',name:'Kyoto B',region:'Kansai',place:'Higashiyama · Kyoto',tags:[],months:[2]},
    {id:'kyoto-c',name:'Kyoto C',region:'Kansai',place:'Fushimi · Kyoto',tags:[],months:[2]},
    {id:'osaka-a',name:'Osaka A',region:'Kansai',place:'Namba · Osaka',tags:[],months:[2]},
    {id:'osaka-b',name:'Osaka B',region:'Kansai',place:'Umeda · Osaka',tags:[],months:[2]},
    {id:'osaka-c',name:'Osaka C',region:'Kansai',place:'Osaka Bay · Osaka',tags:[],months:[2]}
  ];
  const plan = buildItinerary({destinations:cityPlaces,startDate:'2027-02-08',days:2,regions:['Kansai'],pace:'active'});
  for (const day of plan.days) {
    const cities = day.places.map(place=>place.place.split('·').at(-1).trim());
    assert.ok(new Set(cities).size <= 1, `${day.date} mixes cities: ${cities.join(', ')}`);
  }
});

test('finishes the active city area before moving to another area', () => {
  const places = [
    {id:'a-seasonal',name:'A seasonal',region:'Kanto',place:'Tokyo · Kanto',tags:[],months:[2]},
    {id:'a-general',name:'A general',region:'Kanto',place:'Tokyo · Kanto',tags:[],months:[3]},
    {id:'b-seasonal-1',name:'B seasonal 1',region:'Kanto',place:'Kamakura · Kanagawa',tags:[],months:[2]},
    {id:'b-seasonal-2',name:'B seasonal 2',region:'Kanto',place:'Kamakura · Kanagawa',tags:[],months:[2]}
  ];
  const plan=buildItinerary({destinations:places,startDate:'2027-02-08',days:3,regions:['Kanto'],pace:'relaxed'});
  const areas=plan.days.map(day=>day.locality);
  const visited=new Set();
  let prior='';
  for(const area of areas){if(area!==prior)assert.ok(!visited.has(area),`planner returned to a previously visited area: ${areas.join(' → ')}`);visited.add(area);prior=area;}
});

test('does not schedule a dated event outside its verified event window', () => {
  const eventPlaces = [
    {id:'snowfest',name:'Sapporo Snow Festival',region:'Hokkaido',place:'Odori · Sapporo',tags:['Culture'],months:[2],eventDates:[{start:'2027-02-04',end:'2027-02-11'}]},
    {id:'beer',name:'Sapporo Beer Museum',region:'Hokkaido',place:'Higashi · Sapporo',tags:['Culture'],months:[2]}
  ];
  const plan = buildItinerary({destinations:eventPlaces,startDate:'2027-02-12',days:1,regions:['Hokkaido'],interests:['Culture']});
  assert.ok(!plan.days[0].places.some(place=>place.id==='snowfest'));
  assert.ok(plan.notes.some(note=>/confirmed event dates do not overlap/i.test(note)));
  const inWindow = buildItinerary({destinations:eventPlaces,startDate:'2027-02-08',days:1,regions:['Hokkaido'],interests:['Culture']});
  assert.ok(inWindow.days[0].places.some(place=>place.id==='snowfest'));
});

test('keeps full-day attractions as the only stop for that day', () => {
  const attractions = [
    {id:'park',name:'Theme Park',region:'Kanto',place:'Maihama · Chiba',tags:[],months:[2],fullDay:true},
    {id:'nearby',name:'Nearby Museum',region:'Kanto',place:'Maihama · Chiba',tags:[],months:[2]},
    {id:'nearby2',name:'Nearby Garden',region:'Kanto',place:'Maihama · Chiba',tags:[],months:[2]}
  ];
  const plan=buildItinerary({destinations:attractions,startDate:'2027-02-08',days:1,regions:['Kanto'],pace:'active'});
  assert.deepEqual(plan.days[0].places.map(place=>place.id),['park']);
  const describedFullDay=buildItinerary({
    destinations:[
      {id:'museum',name:'Large Museum',region:'Kanto',place:'Tokyo · Kanto',description:'This is a full-day visit.',months:[2]},
      {id:'other',name:'Another Stop',region:'Kanto',place:'Tokyo · Kanto',months:[2]}
    ],startDate:'2027-02-08',days:1,regions:['Kanto'],pace:'active'
  });
  assert.deepEqual(describedFullDay.days[0].places.map(place=>place.id),['museum']);
});
