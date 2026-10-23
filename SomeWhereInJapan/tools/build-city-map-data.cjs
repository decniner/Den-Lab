'use strict';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);

function validPoint(point) {
  return Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]) && point[0] >= -180 && point[0] <= 180 && point[1] >= -90 && point[1] <= 90;
}

function clipSegment(a, b, bounds) {
  const [xmin,ymin,xmax,ymax] = bounds;
  const dx=b[0]-a[0], dy=b[1]-a[1];
  let t0=0,t1=1;
  const p=[-dx,dx,-dy,dy], q=[a[0]-xmin,xmax-a[0],a[1]-ymin,ymax-a[1]];
  for(let i=0;i<4;i++){
    if(p[i]===0){if(q[i]<0)return null;continue;}
    const t=q[i]/p[i];
    if(p[i]<0){if(t>t1)return null;if(t>t0)t0=t;}
    else{if(t<t0)return null;if(t<t1)t1=t;}
  }
  return [[a[0]+t0*dx,a[1]+t0*dy],[a[0]+t1*dx,a[1]+t1*dy]];
}

function clipLine(line, bounds) {
  const segments=[]; let current=[];
  for(let i=1;i<line.length;i++){
    const clipped=clipSegment(line[i-1],line[i],bounds);
    if(!clipped){if(current.length>1)segments.push(current);current=[];continue;}
    if(!current.length)current.push(clipped[0]);
    else if(current[current.length-1][0]!==clipped[0][0] || current[current.length-1][1]!==clipped[0][1]){if(current.length>1)segments.push(current);current=[clipped[0]];}
    current.push(clipped[1]);
  }
  if(current.length>1)segments.push(current);
  return segments;
}

function pointLineDistance(point, start, end) {
  const dx=end[0]-start[0],dy=end[1]-start[1];
  if(dx===0&&dy===0)return Math.hypot(point[0]-start[0],point[1]-start[1]);
  const t=Math.max(0,Math.min(1,((point[0]-start[0])*dx+(point[1]-start[1])*dy)/(dx*dx+dy*dy)));
  return Math.hypot(point[0]-(start[0]+t*dx),point[1]-(start[1]+t*dy));
}

function simplifyLine(points, tolerance=0.000025) {
  if(points.length<=2)return points;
  let max=0,index=0;
  for(let i=1;i<points.length-1;i++){const distance=pointLineDistance(points[i],points[0],points[points.length-1]);if(distance>max){max=distance;index=i;}}
  if(max<=tolerance)return [points[0],points[points.length-1]];
  const left=simplifyLine(points.slice(0,index+1),tolerance),right=simplifyLine(points.slice(index),tolerance);
  return left.slice(0,-1).concat(right);
}

function buildCityMapData(cityId, route, sourceGeoJson) {
  const meta=sourceGeoJson?.metadata||{};
  if(sourceGeoJson?.type!=='FeatureCollection'||!Array.isArray(sourceGeoJson.features))throw new Error('Source map must be a GeoJSON FeatureCollection');
  if(!meta.sourceUrl||!meta.extractedOn||meta.license!=='ODbL-1.0'||!meta.attribution||!Array.isArray(meta.bounds)||meta.bounds.length!==4)throw new Error('Source metadata must include a URL, extraction date, ODbL-1.0 license, attribution, and bounds');
  if(!meta.attribution.includes('OpenStreetMap contributors'))throw new Error('OpenStreetMap attribution is required');
  if(meta.cityId&&meta.cityId!==cityId)throw new Error('Source geometry city id does not match the requested city');
  const [minLon,minLat,maxLon,maxLat]=meta.bounds;
  if(!validPoint([minLon,minLat])||!validPoint([maxLon,maxLat])||minLon>=maxLon||minLat>=maxLat)throw new Error('Invalid city viewport bounds');
  const features=[];
  for(const feature of sourceGeoJson.features){
    if(feature.type!=='Feature'||!feature.geometry)throw new Error('Invalid GeoJSON feature');
    const lines=feature.geometry.type==='LineString'?[feature.geometry.coordinates]:feature.geometry.type==='MultiLineString'?feature.geometry.coordinates:null;
    if(!lines)continue;
    for(const line of lines){
      if(!Array.isArray(line)||line.some(point=>!validPoint(point)))throw new Error('Invalid coordinate in source geometry');
      for(const clipped of clipLine(line,meta.bounds)){
        const simplified=simplifyLine(clipped);
        if(simplified.length>1)features.push({type:'Feature',id:`${feature.id||'road'}-${features.length+1}`,properties:{...(feature.properties||{}),source:'OpenStreetMap'},geometry:{type:'LineString',coordinates:simplified}});
      }
    }
  }
  const positions=[{id:route.origin.id,name:route.origin.name,role:'origin',coordinates:route.origin.coordinates},...(route.stops||[]).map(stop=>({id:stop.id,name:stop.name,role:'stop',coordinates:stop.coordinates}))];
  for(const item of positions){
    const point=item.coordinates;
    if(!point||!Number.isFinite(point.longitude)||!Number.isFinite(point.latitude)||point.longitude< -180||point.longitude>180||point.latitude< -90||point.latitude>90)throw new Error(`Invalid route position: ${item.id}`);
    if(point.longitude<minLon||point.longitude>maxLon||point.latitude<minLat||point.latitude>maxLat)throw new Error(`Route position falls outside the local city viewport: ${item.id}`);
    features.push({type:'Feature',id:item.id,properties:{name:item.name,role:item.role,routeStopId:item.role==='stop'?item.id:undefined},geometry:{type:'Point',coordinates:[point.longitude,point.latitude]}});
  }
  for(const leg of route.legs||[]){
    if(leg.geometry?.status!=='verified')continue;
    const line=leg.geometry.coordinates;
    if(!Array.isArray(line)||line.length<2||line.some(point=>!validPoint(point)))throw new Error(`Invalid reviewed route geometry: ${leg.id}`);
    features.push({type:'Feature',id:`route-${leg.id}`,properties:{routeLegId:leg.id,mode:leg.mode,sourceIds:leg.geometry.sourceIds},geometry:{type:'LineString',coordinates:line.map(point=>point.slice())}});
  }
  const output={type:'FeatureCollection',metadata:{cityId,sourceUrl:meta.sourceUrl,license:meta.license,attribution:meta.attribution,extractedOn:meta.extractedOn,bounds:meta.bounds,geometryStatus:'locally-simplified-context'},features};
  return {geojson:output,fallbackSvg:buildFallbackSvg(output)};
}

function buildFallbackSvg(collection) {
  const [minX,minY,maxX,maxY]=collection.metadata.bounds;
  const width=900,height=560,pad=50;
  const x=lon=>pad+(lon-minX)/(maxX-minX)*(width-pad*2);
  const y=lat=>height-pad-(lat-minY)/(maxY-minY)*(height-pad*2);
  const roads=collection.features.filter(feature=>feature.geometry.type==='LineString'&&!feature.properties.routeLegId).map(feature=>`<polyline points="${feature.geometry.coordinates.map(point=>`${x(point[0]).toFixed(1)},${y(point[1]).toFixed(1)}`).join(' ')}" fill="none" stroke="#b6c5bd" stroke-width="1.4"/>`).join('');
  const routes=collection.features.filter(feature=>feature.properties.routeLegId).map(feature=>`<polyline points="${feature.geometry.coordinates.map(point=>`${x(point[0]).toFixed(1)},${y(point[1]).toFixed(1)}`).join(' ')}" fill="none" stroke="#b64f3d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const markers=collection.features.filter(feature=>feature.geometry.type==='Point').map((feature,index)=>{const [lon,lat]=feature.geometry.coordinates;return `<g><circle cx="${x(lon).toFixed(1)}" cy="${y(lat).toFixed(1)}" r="12" fill="${feature.properties.role==='origin'?'#194c41':'#b64f3d'}"/><text x="${(x(lon)+17).toFixed(1)}" y="${(y(lat)+4).toFixed(1)}" font-size="15" fill="#17211f">${escapeHtml(feature.properties.name)}</text></g>`;}).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="map-title map-desc"><title id="map-title">${escapeHtml(collection.metadata.cityId)} route map</title><desc id="map-desc">Simplified local street context with itinerary points. Lines are for orientation and are not navigation instructions.</desc><rect width="100%" height="100%" fill="#f4f0e8"/>${roads}${routes}${markers}<text x="24" y="${height-18}" font-size="12" fill="#303b37">${escapeHtml(collection.metadata.attribution)} · Map lines are simplified</text></svg>`;
}

module.exports={buildCityMapData};
