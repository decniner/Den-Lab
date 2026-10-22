const test=require('node:test');const assert=require('node:assert/strict');const origins=require('../city-origins.js');
test('offers major regional city-centre origins and honest live directions',()=>{
 const cities=origins.CITY_ORIGINS;assert.equal(cities.length,10);assert.ok(cities.some(x=>x.id==='tokyo'&&x.station==='Tokyo Station'));assert.ok(cities.some(x=>x.station==='Hakata Station'));
 const places=[{name:'A',place:'Sapporo ? Hokkaido',region:'Hokkaido'},{name:'B',place:'Osaka ? Kansai',region:'Kansai'}];assert.deepEqual(origins.nearbyPlaces(places,'sapporo').map(x=>x.name),['A']);
 const url=new URL(origins.directionsUrl(cities.find(x=>x.id==='osaka'),'Osaka Castle','transit'));assert.equal(url.hostname,'www.google.com');assert.equal(url.searchParams.get('travelmode'),'transit');assert.equal(url.searchParams.get('origin'),'Osaka Station, Japan');assert.equal(url.searchParams.get('destination'),'Osaka Castle, Japan');
});

test('gives every non-Tokyo city a detailed ordered day plan and live route links',()=>{
 const cities=origins.CITY_ORIGINS.filter(city=>city.id!=='tokyo');
 assert.equal(Object.keys(origins.CITY_DAY_PLANS).length,cities.length);
 for(const city of cities){
  const plan=origins.CITY_DAY_PLANS[city.id];
  assert.ok(plan,`${city.city} plan`);
  assert.ok(plan.title&&plan.intro&&plan.pace,`${city.city} plan overview`);
  assert.ok(plan.stops.length>=4,`${city.city} has a usable full-day sequence`);
  assert.ok(plan.stops.every(stop=>stop.name&&stop.area&&stop.duration&&stop.story),`${city.city} stops have useful detail`);
  const route=new URL(origins.dayPlanDirectionsUrl(city,plan.stops,'transit'));
  assert.equal(route.searchParams.get('origin'),`${city.station}, Japan`);
  assert.equal(route.searchParams.get('destination'),`${plan.stops.at(-1).name}, ${plan.stops.at(-1).area}, Japan`);
  assert.equal(route.searchParams.get('waypoints'),plan.stops.slice(0,-1).map(stop=>`${stop.name}, ${stop.area}, Japan`).join('|'));
 }
});
