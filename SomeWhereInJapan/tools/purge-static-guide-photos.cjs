'use strict';
const fs=require('node:fs');
const path=require('node:path');
const site=path.resolve(__dirname,'..');
const identities=JSON.parse(fs.readFileSync(path.join(site,'data/destination-identities.json'),'utf8')).records;
const audit=JSON.parse(fs.readFileSync(path.join(site,'data/photo-audit.json'),'utf8')).rows;
const byName=new Map(audit.map(row=>[row.place,row]));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let kept=0,replaced=0,removed=0;
for(const identity of identities.filter(record=>!record.aliasOf)){
 const file=path.join(site,'places',identity.slug,'index.html');
 if(!fs.existsSync(file))throw new Error(`Missing destination page: ${identity.slug}`);
 let html=fs.readFileSync(file,'utf8');
 const images=[...html.matchAll(/<img\b[^>]*>/gi)];
 const row=byName.get(identity.rawName||identity.name);
 if(images.length===0&&! (row?.verdict==='CORRECT'&&row.currentImageUrl&&row.sourcePage&&row.photographer&&row.license&&row.altText)){
  const h=html.match(/<header class="[^"]*(?:fg|jg|kg|ng)-hero[^"]*"/i);if(h&&!/ng-hero-no-photo/.test(h[0]))html=html.replace(h[0],h[0].replace(/"$/,' ng-hero-no-photo"'));fs.writeFileSync(file,html,'utf8');removed++;continue;
 }
 if(images.length!==1)throw new Error(`${identity.slug}: expected one guide hero image or no verified image, found ${images.length}`);
 const image=images[0][0],imageIndex=images[0].index;
 const figureStart=html.lastIndexOf('<figure',imageIndex),figureEnd=html.indexOf('</figure>',imageIndex);
 if(figureStart<0||figureEnd<0)throw new Error(`${identity.slug}: image is not contained by a figure`);
 if(html.indexOf('<figure',figureStart+7)>=0&&html.indexOf('<figure',figureStart+7)<figureEnd)throw new Error(`${identity.slug}: nested image figure needs manual review`);
 const oldFigure=html.slice(figureStart,figureEnd+'</figure>'.length);
 const isVerified=row?.verdict==='CORRECT'&&row.currentImageUrl&&row.sourcePage&&row.photographer&&row.license&&row.altText;
 let figure;
 if(isVerified){
  const alt=esc(row.altText),source=esc(row.sourcePage),credit=esc(row.photographer),license=esc(row.license),url=esc(row.currentImageUrl);
  const newImage=`<img data-photo-verified="true" data-photo-source="${source}" data-photo-credit="${credit}" data-photo-license="${license}" data-photo-alt="${alt}" src="${url}" alt="${alt}" loading="eager" decoding="async" onerror="this.closest('figure')?.remove();this.closest('header')?.classList.add('ng-hero-no-photo')">`;
  const withImage=oldFigure.replace(image,newImage);
  figure=withImage.replace(/<figcaption\b([^>]*)>[\s\S]*?<\/figcaption>/i,`<figcaption$1>Photo: ${credit} / ${license} / <a href="${source}" target="_blank" rel="noopener noreferrer">Source</a></figcaption>`);
  if(figure===withImage&&!/<figcaption\b/i.test(withImage))throw new Error(`${identity.slug}: verified image has no caption target`);
  kept++;if(row.previousUrl&&row.previousUrl!==row.currentImageUrl)replaced++;
 }else{
  figure='';removed++;
  const headerStart=html.lastIndexOf('<header',figureStart),headerEnd=html.indexOf('>',headerStart);
  if(headerStart>=0&&headerEnd>headerStart&&headerStart<figureStart){
   const tag=html.slice(headerStart,headerEnd+1);
   if(/class="[^"]*(?:fg-hero|ng-hero)[^"]*"/.test(tag))html=html.slice(0,headerStart)+tag.replace(/class="([^"]*)"/,'class="$1 ng-hero-no-photo"')+html.slice(headerEnd+1);
  }
 }
 html=html.slice(0,figureStart)+figure+html.slice(figureEnd+'</figure>'.length);
 fs.writeFileSync(file,html,'utf8');
}
console.log(`Updated ${identities.filter(record=>!record.aliasOf).length} static destination guide heroes: ${kept} kept (${replaced} replacements), ${removed} removed.`);
