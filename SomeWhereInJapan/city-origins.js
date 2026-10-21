(function attachCityOrigins(root){
'use strict';
const CITY_ORIGINS=Object.freeze([
{id:'sapporo',city:'Sapporo',station:'Sapporo Station',region:'Hokkaido'},
{id:'sendai',city:'Sendai',station:'Sendai Station',region:'Tohoku'},
{id:'tokyo',city:'Tokyo',station:'Tokyo Station',region:'Kanto'},
{id:'nagoya',city:'Nagoya',station:'Nagoya Station',region:'Chubu'},
{id:'kyoto',city:'Kyoto',station:'Kyoto Station',region:'Kansai'},
{id:'osaka',city:'Osaka',station:'Osaka Station',region:'Kansai'},
{id:'hiroshima',city:'Hiroshima',station:'Hiroshima Station',region:'Chugoku'},
{id:'takamatsu',city:'Takamatsu',station:'Takamatsu Station',region:'Shikoku'},
{id:'fukuoka',city:'Fukuoka',station:'Hakata Station',region:'Kyushu'},
{id:'naha',city:'Naha',station:'Naha Bus Terminal',region:'Okinawa'}
]);
function nearbyPlaces(places,originId){const origin=CITY_ORIGINS.find(item=>item.id===originId);return origin?(places||[]).filter(place=>place.region===origin.region):[];}
function directionsUrl(origin,destination,mode='transit'){const url=new URL('https://www.google.com/maps/dir/');url.searchParams.set('api','1');url.searchParams.set('origin',`${origin.station}, Japan`);url.searchParams.set('destination',`${destination}, Japan`);url.searchParams.set('travelmode',mode==='car'?'driving':'transit');return url.href;}
const api=Object.freeze({CITY_ORIGINS,nearbyPlaces,directionsUrl});if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.CityOrigins=api;
})(typeof globalThis!=='undefined'?globalThis:this);
