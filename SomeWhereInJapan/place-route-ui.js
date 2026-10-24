(function(root){
'use strict';
let placeRegistryPromise;
function fetchJson(path){return fetch(new URL(path,document.baseURI)).then(response=>response.ok?response.json():null).catch(()=>null);}
function placeRegistry(){return placeRegistryPromise||(placeRegistryPromise=fetchJson(`${root.location.pathname.includes('/places/')?'../../':'./'}data/place-routes.json?v=20261024-11`));}
function mount(host,route,mapData,viewOptions={}){
 if(!route||!mapData||!root.CityRouteUI)return null;
 route.cityId=route.cityId||'nikko';
 return root.CityRouteUI.mountCityRouteView(host,route,mapData,{origin:{station:route.origin?.name||route.cityId},...viewOptions});
}
function placeIdForName(name){
 return String(name||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
function routeWalkingUrl(route){
 return root.GoogleMapsRoutes?.buildWalkingRouteUrl(route) || (route?.origin&&route?.stops?.[0]
  ?root.GoogleMapsRoutes?.buildStationToPlaceUrl(route.origin,route.stops[0],{firstLegMode:route.legs?.[0]?.mode})
  :null);
}
function addGuideNotes(host,route){
 if(route?.timeEstimate){const note=document.createElement('aside');note.className='place-route-time-estimate';const label=document.createElement('strong');label.textContent='TIME TO ALLOW';const estimate=document.createElement('p');estimate.textContent=`${route.timeEstimate.label}. ${route.timeEstimate.basis}`;note.append(label,estimate);host.append(note);}
 if(route?.returnTransit){const href=root.GoogleMapsRoutes?.buildTransitRouteUrl(route.returnTransit.from,route.returnTransit.to);if(href){const section=document.createElement('aside');section.className='place-route-return-option';const label=document.createElement('strong');label.textContent='ALTERNATIVE RETURN';const link=document.createElement('a');link.href=href;link.target='_blank';link.rel='noopener';link.className='place-route-transit-return';link.textContent='World Heritage bus from Taiyuin/Futarasan Jinja Mae to Tobu-Nikko Station';link.setAttribute('aria-label','World Heritage bus directions from Taiyuin/Futarasan Jinja Mae to Tobu-Nikko Station on Google Maps');const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');arrow.setAttribute('viewBox','0 0 20 20');arrow.setAttribute('aria-hidden','true');arrow.setAttribute('focusable','false');arrow.innerHTML='<path d="M6 14 14 6M7 6h7v7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>';link.append(arrow);const note=document.createElement('p');note.textContent='Google Maps opens current public-transport directions; check the operator timetable before setting out.';const source=document.createElement('a');source.href=route.returnTransit.sourceUrl;source.target='_blank';source.rel='noopener';source.textContent='Nikko official bus map';section.append(label,link,note,source);host.append(section);}}
 if(route?.photoNote){const note=document.createElement('p');note.className='place-route-photo-policy';note.textContent=route.photoNote;host.append(note);}
}
function makeWalkingRouteLink(route){
 const href=routeWalkingUrl(route);if(!href)return null;
 const link=document.createElement('a');link.className='place-route walking-google-route';link.href=href;link.target='_blank';link.rel='noopener';link.setAttribute('aria-label','Walking route on Google Maps');
 const label=document.createElement('span');label.textContent='Walking route on Google Maps';
 const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');arrow.setAttribute('viewBox','0 0 20 20');arrow.setAttribute('aria-hidden','true');arrow.setAttribute('focusable','false');arrow.innerHTML='<path d="M6 14 14 6M7 6h7v7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>';
 link.append(label,arrow);return link;
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
 const routeLinks=document.querySelector('#place-dialog-routes');
 routeLinks?.querySelector('[data-walking-route-action]')?.remove();
 const walkingLink=record&&makeWalkingRouteLink(record);
 if(walkingLink){walkingLink.dataset.walkingRouteAction='true';routeLinks?.append(walkingLink);}
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
 const controller=mount(host,route,mapData,{compactGuide:host.dataset.compactRouteGuide==='true',hideWalkingRouteLink:true});addGuideNotes(host,route);requestAnimationFrame(()=>controller?.resize());
}
root.PlaceRouteUI=Object.freeze({mountDialog,mountGuide});
document.addEventListener('DOMContentLoaded',()=>{if(document.querySelector('[data-place-route-guide]'))mountGuide();},{once:true});
})(typeof window!=='undefined'?window:globalThis);
