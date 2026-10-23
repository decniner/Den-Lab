'use strict';
const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');
const records={
 kawagoe:{file:'Kurazukuri Street in Little Edo.jpg',source:'https://commons.wikimedia.org/wiki/File:Kurazukuri_Street_in_Little_Edo.jpg',credit:'Dandy1022',license:'CC BY-SA 4.0',alt:'The Kurazukuri merchant street in Kawagoe, Saitama'},
 odawara:{file:'Odawara Castle.jpg',source:'https://commons.wikimedia.org/wiki/File:Odawara_Castle.jpg',credit:'ZAC',license:'CC BY 2.0',alt:'Odawara Castle in Kanagawa, Japan'}
};
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let kept=0,removed=0;
for(const slug of ['kawagoe','sawara','mitake','narita','odawara']){
 const file=path.join(root,'day-trips',slug,'index.html');let html=fs.readFileSync(file,'utf8');
 const start=html.indexOf('<figure class="route-visual route-visual-photo">'),end=html.indexOf('</figure>',start);if(start<0||end<0)throw new Error(`Missing day-trip hero figure: ${slug}`);
 const figure=html.slice(start,end+'</figure>'.length),image=figure.match(/<img\b[^>]*>/i)?.[0];if(!image)throw new Error(`Missing day-trip hero image: ${slug}`);
 const record=records[slug];
 if(!record){const copy=figure.match(/<div class="route-visual-copy">[\s\S]*?<\/div>/)?.[0];if(!copy)throw new Error(`Missing text hero block: ${slug}`);html=html.slice(0,start)+`<div class="route-visual route-visual-no-photo">${copy}</div>`+html.slice(end+'</figure>'.length);html=html.replace(/<li><a href="[^"]+"[^>]*>Image source and license:[\s\S]*?<\/a><\/li>/,'');removed++;}
 else {const filename=encodeURIComponent(record.file);const url=`https://commons.wikimedia.org/wiki/Special:FilePath/${filename}?width=1600`;const attrs=`data-photo-verified="true" data-photo-source="${esc(record.source)}" data-photo-credit="${esc(record.credit)}" data-photo-license="${esc(record.license)}" data-photo-alt="${esc(record.alt)}"`;
  const fresh=`<img ${attrs} src="${esc(url)}" alt="${esc(record.alt)}" width="1600" height="1000" loading="eager" fetchpriority="high" onerror="this.remove();const f=this.closest('figure');f.classList.remove('route-visual-photo');f.classList.add('route-visual-no-photo');f.querySelector('.route-photo-frame')?.remove();f.querySelector('figcaption')?.remove()">`;
  let next=figure.replace(image,fresh);
  next=next.replace(/<a class="route-photo-credit"[^>]*>[\s\S]*?<\/a>/,`<a class="route-photo-credit" href="${esc(record.source)}" target="_blank" rel="noopener noreferrer">${esc(record.credit)} / ${esc(record.license)} / Photo source</a>`);
  next=next.replace(/<figcaption>[\s\S]*?<\/figcaption>/,`<figcaption>Photograph: ${esc(record.credit)}, licensed ${esc(record.license)}. <a href="${esc(record.source)}" target="_blank" rel="noopener noreferrer">Review the original image and license</a></figcaption>`);
  html=html.slice(0,start)+next+html.slice(end+'</figure>'.length);
  const imageSourceLine=/<li><a href="[^"]+"[^>]*>Image source and license:[\s\S]*?<\/a><\/li>/;
  if(imageSourceLine.test(html))html=html.replace(imageSourceLine,`<li><a href="${esc(record.source)}" target="_blank" rel="noopener noreferrer">Image source and license: ${esc(record.credit)} / ${esc(record.license)}</a></li>`);
  kept++;
 }
 fs.writeFileSync(file,html,'utf8');
}
console.log(`Updated 5 day-trip guide heroes: ${kept} kept, ${removed} removed.`);
