const test=require('node:test');const assert=require('node:assert/strict');const origins=require('../city-origins.js');
test('offers major regional city-centre origins and honest live directions',()=>{
 const cities=origins.CITY_ORIGINS;assert.equal(cities.length,10);assert.ok(cities.some(x=>x.id==='tokyo'&&x.station==='Tokyo Station'));assert.ok(cities.some(x=>x.station==='Hakata Station'));
 const places=[{name:'A',place:'Sapporo ? Hokkaido',region:'Hokkaido'},{name:'B',place:'Osaka ? Kansai',region:'Kansai'}];assert.deepEqual(origins.nearbyPlaces(places,'sapporo').map(x=>x.name),['A']);
 const url=new URL(origins.directionsUrl(cities.find(x=>x.id==='osaka'),'Osaka Castle','transit'));assert.equal(url.hostname,'www.google.com');assert.equal(url.searchParams.get('travelmode'),'transit');assert.equal(url.searchParams.get('origin'),'Osaka Station, Japan');assert.equal(url.searchParams.get('destination'),'Osaka Castle, Japan');
});
