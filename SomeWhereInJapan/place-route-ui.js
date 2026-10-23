(function(root){
'use strict';
let placeRegistryPromise;
function fetchJson(path){return fetch(new URL(path,document.baseURI)).then(response=>response.ok?response.json():null).catch(()=>null);}
function placeRegistry(){return placeRegistryPromise||(placeRegistryPromise=fetchJson(`${root.location.pathname.includes('/places/')?'../../':'./'}data/place-routes.json?v=20261023-9`));}
function mount(host,route,mapData,viewOptions={}){
 if(!route||!mapData||!root.CityRouteUI)return null;
 route.cityId=route.cityId||'nikko';
 return root.CityRouteUI.mountCityRouteView(host,route,mapData,{origin:{station:route.origin?.name||route.cityId},...viewOptions});
}
function placeIdForName(name){
 const normalized=String(name||'').trim().toLowerCase();
 return normalized==='nikko in the cedars'?'nikko-in-the-cedars':normalized==='furano in bloom'?'furano-in-bloom':null;
}
function primaryAction(){return document.querySelector('#route > p > a.ng-button, #route > a.ng-button');}
function setDirectionsAction(route){
 const link=primaryAction();if(!link)return;
 const current=new URL(link.href,document.baseURI),fallback=current.searchParams.get('destination')||document.querySelector('#route h2')?.textContent||document.title;
 const legs=route?.legs||[],stops=[...(route?.stops||[])].sort((a,b)=>(a.order||0)-(b.order||0));
 const modes=[...new Set(legs.map(leg=>leg.mode==='walking'?'walking':leg.mode==='driving'?'driving':'transit'))];
 let href,label;
 if(route?.fullRouteUrl){href=route.fullRouteUrl;label=modes.length===1&&modes[0]==='driving'?'Open full driving loop in Google Maps':'Open full route in Google Maps';}
 else if(stops.length>=2&&legs.length&&modes.length===1&&modes[0]!=='walking'&&stops.length<=4){
  const point=stop=>`${stop.address||stop.name}, ${stop.area||'Japan'}, Japan`,params=new URLSearchParams({api:'1',origin:point(route.origin||stops[0]),destination:point(stops.at(-1)),travelmode:modes[0]}),middle=route.origin?stops.slice(0,-1):stops.slice(1,-1);
  if(middle.length)params.set('waypoints',middle.map(point).join('|'));
  href=`https://www.google.com/maps/dir/?${params}`;label=modes[0]==='driving'?'Open driving route in Google Maps':'Open public transport route in Google Maps';
 }else if(stops.length>=2&&legs.length){href='#route-map';label='View mapped route and leg directions';}
 else{href=`https://www.google.com/maps/dir/?${new URLSearchParams({api:'1',destination:fallback})}`;label='Get directions to this place in Google Maps';}
 link.href=href;link.textContent=label;link.removeAttribute('target');link.removeAttribute('rel');
 if(href.startsWith('https://')){link.target='_blank';link.rel='noopener noreferrer';}
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
 const host=document.querySelector('[data-place-route-guide]');
 if(!host){setDirectionsAction(null);return;}
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
 setDirectionsAction(route);
 if(!route||!mapData)return;
 const controller=mount(host,route,mapData,host.dataset.compactRouteGuide==='true'?{compactGuide:true}:{});requestAnimationFrame(()=>controller?.resize());
}
root.PlaceRouteUI=Object.freeze({mountDialog,mountGuide});
document.addEventListener('DOMContentLoaded',()=>{if(document.querySelector('[data-place-route-guide]'))mountGuide();},{once:true});
})(typeof window!=='undefined'?window:globalThis);
