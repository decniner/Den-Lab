'use strict';
const fs=require('node:fs');
const file='index.html';
let html=fs.readFileSync(file,'utf8');
html=html.replace(/<meta property="og:image"[^>]*>/,'');
html=html.replace('<meta name="twitter:card" content="summary_large_image">','<meta name="twitter:card" content="summary">');
html=html.replace('<link rel="preconnect" href="https://images.unsplash.com">','');
html=html.replace('<small class="site-version">v1.0</small>','<small class="site-version">v1.1</small>');
for(const [oldValue,newValue] of Object.entries({
  'app.js?v=20261023-2':'app.js?v=20261024-1',
  'destination-photo-audit.js?v=20261023-1':'destination-photo-audit.js?v=20261024-1',
  'city-route-ui.js?v=20261024-2':'city-route-ui.js?v=20261024-3',
  'city-field-guides.js?v=20261023-1':'city-field-guides.js?v=20261024-1',
  'city-origin-ui.js?v=20261023-6':'city-origin-ui.js?v=20261024-1',
  'city-stop-photos.js?v=20261022-1':'city-stop-photos.js?v=20261024-1'
})) html=html.replace(oldValue,newValue);
fs.writeFileSync(file,html.replace(/\r?\n/g,'\r\n'),'utf8');
