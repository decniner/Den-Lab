(function(root){
'use strict';
let placeRegistryPromise;
function fetchJson(path){return fetch(new URL(path,document.baseURI)).then(response=>response.ok?response.json():null).catch(()=>null);}
function placeRegistry(){return placeRegistryPromise||(placeRegistryPromise=fetchJson(`${root.location.pathname.includes('/places/')?'../../':'./'}data/place-routes.json?v=20261023-2`));}
function mount(host,route,mapData){
 if(!route||!mapData||!root.CityRouteUI)return null;
 route.cityId=route.cityId||'nikko';
 return root.CityRouteUI.mountCityRouteView(host,route,mapData,{origin:{station:route.origin?.name||route.cityId}});
}
async function mountDialog(placeName){
 const details=document.querySelector('#place-dialog-route-details'),host=document.querySelector('#place-dialog-route-map');
 if(!details||!host)return;
 details.hidden=true;details.open=false;host.replaceChildren();
 const data=await placeRegistry(),record=data?.routes?.find(item=>item.placeId==='nikko-in-the-cedars'&&placeName==='Nikko in the cedars');
 if(!record)return;
 details.hidden=false;let controller=null;
 const open=()=>{details.open=true;if(!controller)controller=mount(host,record,data.maps?.[record.placeId]);requestAnimationFrame(()=>controller?.resize());};
 const summary=details.querySelector('summary');summary.onclick=event=>{event.preventDefault();if(details.open)details.open=false;else open();};
 const observer=new MutationObserver(()=>{if(!details.open)requestAnimationFrame(()=>controller?.resize());});observer.observe(details,{attributes:true,attributeFilter:['open']});
 details._cleanup=()=>{observer.disconnect();controller?.destroy();controller=null;};
}
async function mountGuide(){
 const host=document.querySelector('[data-place-route-guide]');if(!host)return;
 const kind=host.dataset.routeKind||'place',id=host.dataset.routeId||'nikko-world-heritage-loop';
 let route=null,mapData=null;
 if(kind==='location'){
  const latitude=Number(host.dataset.routeLat),longitude=Number(host.dataset.routeLon),name=host.dataset.routeName||'Destination',locator=host.dataset.routeLocator||name,precision=host.dataset.routePrecision||'area',source=host.dataset.routeSource||'https://www.openstreetmap.org/';
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return;
  const stopId='place-location';
  route={id,cityId:'destination',title:`${name}: location map`,introduction:precision==='destination'?`One destination marker for ${name}. No connecting route is implied without a researched stop order.`:`Approximate ${precision==='area'?'area':'nearby-feature'} locator for ${locator}; it may not mark the attraction entrance.`,researchStatus:'place-locator',locatorPrecision:precision,locatorLabel:precision==='destination'?'NAMED DESTINATION':precision==='area'?'AREA LOCATOR':'NEARBY MAP MATCH',stops:[{id:stopId,order:1,name,address:locator,story:`Open the linked location record to confirm the exact entrance and current access.`,coordinates:{latitude,longitude,precision,sourceIds:['osm-location']}}],legs:[],sources:[{url:source,label:'OpenStreetMap location record',checkedOn:host.dataset.routeChecked||'2026-10-23'}]};
  const delta=0.008;
  mapData={type:'FeatureCollection',metadata:{bounds:[longitude-delta,latitude-delta,longitude+delta,latitude+delta],geometryStatus:'place-locator',attribution:'Map data © OpenStreetMap contributors',license:'ODbL-1.0',sourceUrl:source},features:[{type:'Feature',id:stopId,geometry:{type:'Point',coordinates:[longitude,latitude]},properties:{id:stopId,routeStopId:stopId,role:'stop',name}}]};
 }else if(kind==='city'){
  const data=await fetchJson('../../data/city-routes.json?v=20261023-1');
  route=data?.routes?.find(item=>item.id===id&&item.cityId===host.dataset.routeCity);
  if(route)mapData=await fetchJson(`../../maps/cities/${encodeURIComponent(route.cityId)}.geojson?v=20261023-1`);
 }else{
  const data=await placeRegistry();route=data?.routes?.find(item=>item.id===id)||data?.routes?.find(item=>item.placeId==='nikko-in-the-cedars');
  if(route)mapData=data?.maps?.[route.placeId];
 }
 if(!route||!mapData)return;
 const controller=mount(host,route,mapData);requestAnimationFrame(()=>controller?.resize());
}
root.PlaceRouteUI=Object.freeze({mountDialog,mountGuide});
document.addEventListener('DOMContentLoaded',()=>{if(document.querySelector('[data-place-route-guide]'))mountGuide();},{once:true});
})(typeof window!=='undefined'?window:globalThis);
