'use strict';
const fs=require('node:fs');
const path=require('node:path');
let changed=0;
for(const folder of ['places','day-trips'])for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  const file=path.join(folder,entry.name,'index.html');
  if(!fs.existsSync(file))continue;
  let html=fs.readFileSync(file,'utf8');
  const next=html.replace(/styles\.css\?v=20261024-(?:2|3)/g,'styles.css?v=20261024-4').replace(/city-route-ui\.js\?v=20261024-2/g,'city-route-ui.js?v=20261024-3');
  if(next!==html){fs.writeFileSync(file,next,'utf8');changed++;}
}
console.log(`Updated photo-layout cache references in ${changed} static place/day-trip pages.`);
