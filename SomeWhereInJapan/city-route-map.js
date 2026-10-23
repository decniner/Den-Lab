(function(root){
'use strict';
function mountCityRouteMap(container,mapData,onSelectStop){
 if(['schematic-stop-order','place-locator'].includes(mapData?.metadata?.geometryStatus)){
  const panel=container&&container.querySelector('[data-map-canvas]'),fallback=container&&container.querySelector('[data-map-fallback]');
  if(!root.maplibregl?.Map){if(panel)panel.hidden=true;if(fallback)fallback.hidden=false;return {selectStop(){},resize(){},destroy(){},get available(){return false;}};}
  let map=null,loaded=false,destroyed=false,markers=new Map(),markerRecords=[],selected=null,fitOnNextResize=false,west=0,south=0,east=0,north=0;
  function choose(id){selected=id;markers.forEach((marker,key)=>marker.getElement()?.classList.toggle('is-selected',key===id));if(typeof onSelectStop==='function')onSelectStop(id);}
  const fitRouteBounds=()=>map?.fitBounds([[west,south],[east,north]],{padding:{top:84,right:54,bottom:48,left:54},maxZoom:15,duration:0});
  function fanMobileMarkerCollisions(){
   if(!map||destroyed||panel.getBoundingClientRect().width===0||!root.matchMedia?.('(max-width: 760px)').matches)return;
   const points=markerRecords.map(record=>{record.marker.setOffset([0,0]);const point=map.project(record.marker.getLngLat());return {...record,x:point.x,y:point.y};});
   const groups=[];
   points.forEach(point=>{let group=groups.find(items=>items.some(item=>Math.hypot(item.x-point.x,item.y-point.y)<42));if(!group){group=[];groups.push(group);}group.push(point);});
   groups.filter(group=>group.length>1).forEach(group=>{const center=group.reduce((sum,point)=>({x:sum.x+point.x/group.length,y:sum.y+point.y/group.length}),{x:0,y:0});const spacing=38;group.forEach((point,index)=>point.marker.setOffset([center.x-point.x,center.y+(index-(group.length-1)/2)*spacing-point.y]));});
  }
  try{
   if(!panel)throw new Error('Map container unavailable');
   panel.hidden=false;
   [west,south,east,north]=mapData.metadata.bounds;
   fitOnNextResize=panel.getBoundingClientRect().width===0;
   const touchCapable=typeof root.PointerEvent==='function'?root.matchMedia?.('(any-pointer: coarse)').matches||root.navigator?.maxTouchPoints>0:root.matchMedia?.('(any-hover: none)').matches||root.navigator?.maxTouchPoints>0;
   const locale={'CooperativeGesturesHandler.WindowsHelpText':'Use Ctrl + scroll to zoom the map','CooperativeGesturesHandler.MacHelpText':'Use Ctrl + scroll to zoom the map','CooperativeGesturesHandler.MobileHelpText':touchCapable?'Use two fingers to zoom the map':'Use two fingers to move the map'};
   map=new root.maplibregl.Map({container:panel,style:'https://tiles.openfreemap.org/styles/liberty',center:[(west+east)/2,(south+north)/2],zoom:13,attributionControl:{compact:root.matchMedia?.('(max-width: 760px)').matches||false},cooperativeGestures:true,locale,dragRotate:false,pitchWithRotate:false});
   map.addControl(new root.maplibregl.ScaleControl({unit:'metric'}),'bottom-left');
   if(fallback)fallback.hidden=true;
   map.addControl(new root.maplibregl.NavigationControl({showCompass:false}),'top-right');
   map.on('load',()=>{
    loaded=true;
    const routeFeatures=mapData.features.filter(feature=>feature.geometry.type==='LineString'&&feature.properties.routeLegId);
    map.addSource('itinerary-lines',{type:'geojson',data:{type:'FeatureCollection',features:routeFeatures}});
    map.addLayer({id:'itinerary-line',type:'line',source:'itinerary-lines',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':['match',['get','mode'],'walking','#b64f3d','#285b70'],'line-width':4,'line-opacity':0.9,'line-dasharray':[2,1]}});
    const points=mapData.features.filter(feature=>feature.geometry.type==='Point');
    fitOnNextResize=fitOnNextResize&&panel.getBoundingClientRect().width===0;
    fitRouteBounds();
    requestAnimationFrame(fanMobileMarkerCollisions);
    if(fallback)fallback.hidden=true;
   });
   map.on('error',()=>{if(!loaded&&!destroyed){if(map){map.remove();map=null;}if(panel)panel.hidden=true;if(fallback)fallback.hidden=false;}});
   pointsForMapMarkers(mapData).forEach(({feature,label,index})=>{
    const p=feature.properties,id=p.routeStopId||p.id||feature.id,[lon,lat]=feature.geometry.coordinates;
    const markerEl=document.createElement('button');markerEl.type='button';markerEl.className=`maplibre-route-marker${p.role==='origin'?' origin':''}`;markerEl.textContent=label;markerEl.setAttribute('aria-label',`${label==='S/R'?'Start and return':label==='S'?'Start':`Stop ${label}`}: ${p.name}`);markerEl.title=markerEl.getAttribute('aria-label');
    markerEl.addEventListener('click',()=>choose(id));
    const popupNode=document.createElement('strong');popupNode.textContent=p.role==='origin'?(p.returnPoint?'START / RETURN':`START`):`STOP ${label} · ${p.name}`;
    const marker=new root.maplibregl.Marker({element:markerEl,anchor:'center'}).setLngLat([lon,lat]).setPopup(new root.maplibregl.Popup({offset:20,closeButton:false}).setDOMContent(popupNode)).addTo(map);
    markers.set(id,marker);
    markerRecords.push({id,marker});
   });
   map.on('moveend',fanMobileMarkerCollisions);
  }catch(error){if(map){map.remove();map=null;}if(panel)panel.hidden=true;if(fallback)fallback.hidden=false;}
  return {selectStop(id){if(markers.has(id)){choose(id);markers.get(id).togglePopup();}},resize(){if(map&&!destroyed){map.resize();if(loaded&&fitOnNextResize){fitOnNextResize=false;fitRouteBounds();}requestAnimationFrame(fanMobileMarkerCollisions);}},destroy(){destroyed=true;if(map){map.remove();map=null;}markers.clear();markerRecords=[];},get available(){return !!map&&!destroyed;}};
 }
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
function pointsForMapMarkers(mapData){let stop=0;return mapData.features.filter(feature=>feature.geometry.type==='Point').map((feature,index)=>({feature,index,label:feature.properties.role==='origin'?(feature.properties.returnPoint?'S/R':'S'):String(++stop).padStart(2,'0')}));}
root.CityRouteMap={mountCityRouteMap};
if(typeof module!=='undefined'&&module.exports)module.exports={mountCityRouteMap};
})(typeof window!=='undefined'?window:globalThis);
