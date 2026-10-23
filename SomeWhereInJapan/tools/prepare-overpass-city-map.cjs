'use strict';
const fs=require('node:fs');
const path=require('node:path');

function prepareCityMap(cityId,inputFile,outputFile,bounds,query){
  const raw=JSON.parse(fs.readFileSync(inputFile,'utf8'));
  const roads=new Set(['primary','secondary','tertiary','residential','unclassified','living_street','pedestrian','footway','steps','cycleway']);
  const features=[];
  for(const way of raw.elements||[]){
    if(way.type!=='way'||!roads.has(way.tags?.highway)||!Array.isArray(way.geometry)||way.geometry.length<2)continue;
    const coordinates=way.geometry.map(point=>[Number(point.lon.toFixed(6)),Number(point.lat.toFixed(6))]);
    const properties={highway:way.tags.highway,source:'OpenStreetMap'};
    if(way.tags.name)properties.name=way.tags.name;
    if(way.tags.bridge==='yes')properties.bridge=true;
    if(way.tags.tunnel==='yes')properties.tunnel=true;
    features.push({type:'Feature',id:`way-${way.id}`,properties,geometry:{type:'LineString',coordinates}});
  }
  const collection={type:'FeatureCollection',metadata:{cityId,sourceUrl:'https://overpass-api.de/api/interpreter',license:'ODbL-1.0',attribution:`${String.fromCodePoint(0x00a9)} OpenStreetMap contributors`,extractedOn:'2026-10-23',sourceTimestamp:raw.osm3s?.timestamp_osm_base||null,bounds,query,geometryStatus:'source-street-context',note:'Local OSM street context is provided for geographic orientation. Dashed route connectors remain stop-order illustrations unless individually marked verified.'},features};
  fs.writeFileSync(outputFile,`${JSON.stringify(collection)}\n`,'utf8');
  return {featureCount:features.length,sourceTimestamp:collection.metadata.sourceTimestamp,bytes:Buffer.byteLength(JSON.stringify(collection))};
}

module.exports={prepareCityMap};
if(require.main===module){
  const root=path.resolve(__dirname,'..');
  const [cityId,input=path.join(root,'maps/sources/sapporo.overpass.json'),output=path.join(root,'maps/sources',`${cityId}.geojson`)]=process.argv.slice(2);
  if(!cityId)throw new Error('Usage: node tools/prepare-overpass-city-map.cjs <city-id> [input-json] [output-geojson]');
  const sourceBounds=cityId==='sapporo'?[141.344,43.052,141.375,43.074]:null;
  if(!sourceBounds)throw new Error(`No reviewed bounds are configured for ${cityId}`);
  const query='[out:json][timeout:30];way["highway"](43.052,141.344,43.074,141.375);out geom;';
  console.log(JSON.stringify(prepareCityMap(cityId,input,output,sourceBounds,query)));
}
