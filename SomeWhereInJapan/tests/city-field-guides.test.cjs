'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const origins=require('../city-origins.js');
const guides=require('../city-field-guides.js');

test('every researched city stop has an in-site field guide URL',()=>{
 for(const [city,plan] of Object.entries(origins.CITY_DAY_PLANS))for(const stop of plan.stops){
  const url=new URL(guides.urlFor(city,stop.name),'https://example.test/Den-Lab/SomeWhereInJapan/');
  assert.equal(url.pathname,'/Den-Lab/SomeWhereInJapan/city-field-guide.html',`${city}: ${stop.name}`);
  assert.equal(url.searchParams.get('city'),city);
  assert.ok(url.searchParams.get('place'));
 }
});

test('field guide provides stop story, credited photo, source and live access links',()=>{
 const source=fs.readFileSync(path.join(root,'city-field-guides.js'),'utf8');
 for(const marker of ['What makes this place worth the stop','city-field-guide-photo','OpenStreetMap','YouTube','Route reference','transit','driving'])assert.ok(source.includes(marker),`guide includes ${marker}`);
});

test('city itinerary and mapped stop list both link to the field guide',()=>{
 const originUI=fs.readFileSync(path.join(root,'city-origin-ui.js'),'utf8');
 const routeUI=fs.readFileSync(path.join(root,'city-route-ui.js'),'utf8');
 assert.match(originUI,/CityFieldGuides\?\.urlFor/);
 assert.match(originUI,/Open full field guide/);
 assert.match(routeUI,/guideUrlForStop/);
 assert.match(routeUI,/Open full field guide/);
});
