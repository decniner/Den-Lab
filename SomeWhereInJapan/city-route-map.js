(function(root){
'use strict';
function mountCityRouteMap(container,mapData,onSelectStop){
 let map=null,markers=new Map(),selected=null,destroyed=false;
 const fallback=container&&container.querySelector('[data-map-fallback]');
 const panel=container&&container.querySelector('[data-map-canvas]');
 function fail(){if(map){map.remove();map=null;} if(panel)panel.hidden=true;if(fallback)fallback.hidden=false;}
 function choose(id){selected=id;markers.forEach((marker,key)=>{const active=key===id,icon=marker.getElement()?.querySelector('[data-route-marker]');icon?.classList.toggle('is-selected',active);});if(typeof onSelectStop==='function')onSelectStop(id);}
 try{
  if(!container||!panel||!root.L||!mapData||mapData.type!=='FeatureCollection')throw new Error('Local map unavailable');
  panel.hidden=false;
  map=root.L.map(panel,{zoomControl:true,scrollWheelZoom:false,keyboard:true,attributionControl:true});
  const bounds=mapData.metadata?.bounds;
  if(!Array.isArray(bounds)||bounds.length!==4)throw new Error('Map bounds missing');
  map.fitBounds([[bounds[1],bounds[0]],[bounds[3],bounds[2]]],{padding:[20,20]});
  const grid=mapData.features.filter(f=>f.geometry.type==='LineString'&&f.properties.mapGrid);
  const roads=mapData.features.filter(f=>f.geometry.type==='LineString'&&!f.properties.routeLegId&&!f.properties.mapGrid);
  const routes=mapData.features.filter(f=>f.geometry.type==='LineString'&&f.properties.routeLegId);
  const points=mapData.features.filter(f=>f.geometry.type==='Point');
  root.L.geoJSON({type:'FeatureCollection',features:grid},{style:{color:'#e3dfd4',weight:1,opacity:.9,dashArray:'2 4'}}).addTo(map);
  root.L.geoJSON({type:'FeatureCollection',features:roads},{style:feature=>{const type=feature.properties.highway,major=['primary','secondary','trunk'].includes(type),pedestrian=['pedestrian','footway','steps','cycleway'].includes(type);return {color:major?'#c2a577':pedestrian?'#a9bda9':'#a9b8b0',weight:major?2.1:pedestrian?.75:type==='tertiary'?1.35:1,opacity:major?.85:pedestrian?.62:.72,dashArray:pedestrian?'2 3':null};}}).addTo(map);
  root.L.geoJSON({type:'FeatureCollection',features:routes},{style:f=>({color:f.properties.mode==='walking'?'#b64f3d':'#285b70',weight:5,dashArray:f.properties.routeGeometryStatus==='schematic'?'8 8':f.properties.mode==='walking'?null:'8 6',opacity:.9})}).addTo(map);
  points.forEach((feature,index)=>{
   const [lon,lat]=feature.geometry.coordinates,p=feature.properties,id=p.routeStopId||p.id||feature.id;
   const label=p.role==='origin'?(p.returnPoint?'S/R':'S'):String(index).padStart(2,'0'),markerClass=p.role==='origin'?'city-route-map-marker origin':'city-route-map-marker stop';
   const icon=root.L.divIcon({className:'city-route-map-marker-host',html:`<span class="${markerClass}" data-route-marker>${label}</span>`,iconSize:[34,34],iconAnchor:[17,17]});
   const marker=root.L.marker([lat,lon],{icon,keyboard:true,title:p.name});
   marker.bindTooltip(`${p.role==='origin'?(p.returnPoint?'Start and return':'Start'):`Stop ${index}`}: ${p.name}`);
   marker.on('click',()=>choose(id));
   marker.on('add',()=>{const el=marker.getElement();if(el){el.setAttribute('role','button');el.setAttribute('aria-label',`${p.name}, ${p.role==='origin'&&p.returnPoint?'route start and return point':'select itinerary stop'}`);el.setAttribute('tabindex','0');el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(id);}});}});
   marker.addTo(map);markers.set(id,marker);
  });
  const attribution=map.attributionControl;if(attribution){const legal=mapData.metadata.license==='ODbL-1.0'?` · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">ODbL</a>`:` · <a href="${mapData.metadata.sourceUrl}" target="_blank" rel="noopener noreferrer">${mapData.metadata.license}</a>`;attribution.addAttribution(`${mapData.metadata.attribution}${legal}`);}
  if(root.L.control?.scale)root.L.control.scale({imperial:false,metric:true,position:'bottomleft'}).addTo(map);
  if(fallback)fallback.hidden=true;if(panel)panel.hidden=false;
 }catch(error){fail();}
 return {selectStop(id){if(markers.has(id))choose(id);},resize(){if(map&&!destroyed){map.invalidateSize({pan:false});map.fitBounds([[bounds[1],bounds[0]],[bounds[3],bounds[2]]],{padding:[20,20]});}},destroy(){destroyed=true;if(map){map.remove();map=null;}markers.clear();},get available(){return !!map&&!destroyed;}};
}
root.CityRouteMap={mountCityRouteMap};
if(typeof module!=='undefined'&&module.exports)module.exports={mountCityRouteMap};
})(typeof window!=='undefined'?window:globalThis);
