const test=require('node:test');const assert=require('node:assert/strict');const origins=require('../city-origins.js');
const photos=require('../city-stop-photos.js');
test('offers major regional city-centre origins and honest live directions',()=>{
 const cities=origins.CITY_ORIGINS;assert.equal(cities.length,10);assert.ok(cities.some(x=>x.id==='tokyo'&&x.station==='Tokyo Station'));assert.ok(cities.some(x=>x.station==='Hakata Station'));
 const places=[{name:'A',place:'Sapporo ? Hokkaido',region:'Hokkaido'},{name:'B',place:'Osaka ? Kansai',region:'Kansai'}];assert.deepEqual(origins.nearbyPlaces(places,'sapporo').map(x=>x.name),['A']);
 const url=new URL(origins.directionsUrl(cities.find(x=>x.id==='osaka'),'Osaka Castle','transit'));assert.equal(url.hostname,'www.google.com');assert.equal(url.searchParams.get('travelmode'),'transit');assert.equal(url.searchParams.get('origin'),'Osaka Station, Japan');assert.equal(url.searchParams.get('destination'),'Osaka Castle, Japan');
});

test('offers real airport rail and bus terminals as origins for the matching city plans',()=>{
 const airports=origins.AIRPORT_ORIGINS;
 assert.ok(airports.length>=10);
 assert.ok(airports.some(x=>x.id==='haneda-terminal-3'&&x.station==='Haneda Airport Terminal 3 Station'&&x.planId==='tokyo'));
 assert.ok(airports.some(x=>x.id==='narita-terminal-1'&&x.station==='Narita Airport Station (Terminal 1)'&&x.planId==='tokyo'));
 assert.ok(airports.some(x=>x.id==='kansai-airport'&&x.station==='Kansai Airport Station'&&x.planId==='osaka'));
 for(const airport of airports){
  assert.ok(origins.CITY_DAY_PLANS[airport.planId],`${airport.id} reuses a matching city plan`);
  const route=new URL(origins.dayPlanDirectionsUrl(airport,origins.CITY_DAY_PLANS[airport.planId].stops,'transit'));
  assert.equal(route.searchParams.get('origin'),`${airport.station}, Japan`);
  assert.equal(origins.nearbyPlaces([{region:airport.region}],airport.id).length,1);
 }
});

test('gives every origin including Tokyo a detailed ordered day plan and live route links',()=>{
 const cities=origins.CITY_ORIGINS;
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

test('gives every itinerary stop a unique, credited photograph of that place',()=>{
 const stops=Object.values(origins.CITY_DAY_PLANS).flatMap(plan=>plan.stops);
 const urls=stops.map(stop=>photos[stop.name]?.url);
 assert.equal(urls.length,new Set(urls).size,'place photographs are distinct across the city routes');
 for(const stop of stops){
  const photo=photos[stop.name];
  assert.ok(photo,`${stop.name} has a photo`);
  assert.match(photo.url,/^https:\/\//,`${stop.name} photo uses HTTPS`);
  assert.match(photo.source,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/,`${stop.name} links its source file`);
  assert.ok(photo.credit&&photo.license&&photo.alt,`${stop.name} photo has attribution and descriptive alt text`);
 }
});

test('adapts each city route to a half day, one day, or two days',()=>{
 for(const [id,plan] of Object.entries(origins.CITY_DAY_PLANS)){
  const half=origins.itineraryDays(plan.stops,'half');
  const full=origins.itineraryDays(plan.stops,'one');
  const two=origins.itineraryDays(plan.stops,'two');
  assert.equal(half.length,1,`${id} half-day plan`);assert.equal(half[0].stops.length,2,`${id} half-day plan is focused`);
  assert.equal(full.length,1,`${id} one-day plan`);assert.equal(full[0].stops.length,plan.stops.length,`${id} full-day plan includes every stop`);
  assert.equal(two.length,2,`${id} two-day plan has two days`);assert.equal(two.flatMap(day=>day.stops).length,plan.stops.length,`${id} two-day plan preserves every stop`);
  assert.ok(two.every(day=>day.stops.length>=2),`${id} spreads visits across both days`);
 }
});

test('uses one shared itinerary renderer and preserves Tokyo day-trip tools as secondary content',()=>{
 const ui=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','city-origin-ui.js'),'utf8');
 const css=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','styles.css'),'utf8');
 assert.match(ui,/city-origin-plan/);
 assert.match(ui,/city-plan-availability/);
 assert.match(ui,/AIRPORT_ORIGINS/);
 assert.match(css,/\.city-origin-picker select\{width:100%;min-width:0;box-sizing:border-box\}/);
 assert.match(ui,/city-plan-stop-photo/);
 assert.match(ui,/tokyo-route-tools/);
 assert.doesNotMatch(ui,/if\s*\(isTokyo\)\s*return/);
});
