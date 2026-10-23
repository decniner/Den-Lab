(function(root){
'use strict';
function mountCityRouteMap(container,mapData,onSelectStop){
 let map=null,markers=new Map(),selected=null,destroyed=false;
 const fallback=container&&container.querySelector('[data-map-fallback]');
 const panel=container&&container.querySelector('[data-map-canvas]');
 function fail(){if(map){map.remove();map=null;} if(panel)panel.hidden=true;if(fallback)fallback.hidden=false;}
 function choose(id){selected=id;markers.forEach((marker,key)=>{const active=key===id;if(marker.setStyle)marker.setStyle({fillColor:active?'#b64f3d':'#194c41',radius:active?10:8});});if(typeof onSelectStop==='function')onSelectStop(id);}
 try{
  if(!container||!panel||!root.L||!mapData||mapData.type!=='FeatureCollection')throw new Error('Local map unavailable');
  panel.hidden=false;
  map=root.L.map(panel,{zoomControl:true,scrollWheelZoom:false,keyboard:true,attributionControl:true});
  const bounds=mapData.metadata?.bounds;
  if(!Array.isArray(bounds)||bounds.length!==4)throw new Error('Map bounds missing');
  map.fitBounds([[bounds[1],bounds[0]],[bounds[3],bounds[2]]],{padding:[20,20]});
  const roads=mapData.features.filter(f=>f.geometry.type==='LineString'&&!f.properties.routeLegId);
  const routes=mapData.features.filter(f=>f.geometry.type==='LineString'&&f.properties.routeLegId);
  const points=mapData.features.filter(f=>f.geometry.type==='Point');
  root.L.geoJSON({type:'FeatureCollection',features:roads},{style:{color:'#a9b8b0',weight:2,opacity:.8}}).addTo(map);
  root.L.geoJSON({type:'FeatureCollection',features:routes},{style:f=>({color:f.properties.mode==='walking'?'#b64f3d':'#285b70',weight:5,dashArray:f.properties.mode==='walking'?null:'8 6',opacity:.9})}).addTo(map);
  points.forEach((feature,index)=>{
   const [lon,lat]=feature.geometry.coordinates,p=feature.properties,id=p.routeStopId||p.id||feature.id;
   const marker=root.L.circleMarker([lat,lon],{radius:p.role==='origin'?11:8,color:'#fff',weight:2,fillColor:p.role==='origin'?'#194c41':'#b64f3d',fillOpacity:1,keyboard:true,title:p.name});
   marker.bindTooltip(`${p.role==='origin'?'Start':`Stop ${index}`}: ${p.name}`);
   marker.on('click',()=>choose(id));
   marker.on('add',()=>{const el=marker.getElement();if(el){el.setAttribute('role','button');el.setAttribute('aria-label',`${p.name}, select itinerary stop`);el.setAttribute('tabindex','0');el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(id);}});}});
   marker.addTo(map);markers.set(id,marker);
  });
  const attribution=map.attributionControl;if(attribution)attribution.addAttribution(`${mapData.metadata.attribution} · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">ODbL</a>`);
  if(fallback)fallback.hidden=true;if(panel)panel.hidden=false;
 }catch(error){fail();}
 return {selectStop(id){if(markers.has(id))choose(id);},destroy(){destroyed=true;if(map){map.remove();map=null;}markers.clear();},get available(){return !!map&&!destroyed;}};
}
root.CityRouteMap={mountCityRouteMap};
if(typeof module!=='undefined'&&module.exports)module.exports={mountCityRouteMap};
})(typeof window!=='undefined'?window:globalThis);
