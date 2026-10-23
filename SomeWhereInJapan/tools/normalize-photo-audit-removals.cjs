'use strict';
const fs=require('node:fs');
const file='data/photo-audit.json';
const data=JSON.parse(fs.readFileSync(file,'utf8'));
for(const row of data.rows){
  if(row.verdict==='CORRECT')continue;
  if(row.currentImageUrl)row.previousUrl=row.currentImageUrl;
  row.currentImageUrl='';
  row.photographer='';
  row.license='';
  row.altText='';
  row.verdict='REMOVED';
  row.action='Removed: the source page did not verify a destination-specific photograph with complete attribution and matching alt text';
}
fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n','utf8');
console.log(`Normalized ${data.rows.filter(row=>row.verdict==='REMOVED').length} removed catalogue-photo records.`);
