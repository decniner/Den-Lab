(function(root){
'use strict';
let placeRegistryPromise;
function fetchJson(path){return fetch(new URL(path,document.baseURI)).then(response=>response.ok?response.json():null).catch(()=>null);}
function placeRegistry(){return placeRegistryPromise||(placeRegistryPromise=fetchJson(`${root.location.pathname.includes('/places/')?'../../':'./'}data/place-routes.json?v=20261023-3`));}
function mount(host,route,mapData){
 if(!route||!mapData||!root.CityRouteUI)return null;
 route.cityId=route.cityId||'nikko';
 return root.CityRouteUI.mountCityRouteView(host,route,mapData,{origin:{station:route.origin?.name||route.cityId}});
}
function placeIdForName(name){
 const normalized=String(name||'').trim().toLowerCase();
 return normalized==='nikko in the cedars'?'nikko-in-the-cedars':normalized==='furano in bloom'?'furano-in-bloom':null;
}
async function mountDialog(placeName){
 const details=document.querySelector('#place-dialog-route-details'),host=document.querySelector('#place-dialog-route-map');
 if(!details||!host)return;
 details.hidden=true;details.open=false;host.replaceChildren();
 const data=await placeRegistry(),record=data?.routes?.find(item=>item.placeId===placeIdForName(placeName));
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
  const data=await placeRegistry();route=data?.routes?.find(item=>item.id===id);if(route)mapData=data?.maps?.[route.placeId];
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
