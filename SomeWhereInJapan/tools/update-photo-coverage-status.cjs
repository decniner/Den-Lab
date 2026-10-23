'use strict';
const fs=require('node:fs');
const manifestPath='data/coverage-manifest.json';
const source=fs.readFileSync(manifestPath,'utf8').replace(/\\n\s*$/,'');
const manifest=JSON.parse(source);
const audit=JSON.parse(fs.readFileSync('data/photo-audit.json','utf8'));
const rows=new Map(audit.rows.map(row=>[row.place,row]));
for(const place of manifest.records){
  const row=rows.get(place.name);
  if(row)place.imageStatus=row.verdict==='CORRECT'?'verified-source-photo':'photo-removed-unverified';
}
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n','utf8');
console.log(`Updated image status for ${manifest.records.length} coverage records.`);
