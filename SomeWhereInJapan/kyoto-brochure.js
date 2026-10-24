(function bootKyotoBrochure(root){
'use strict';
const script=document.currentScript;
const siteRoot=new URL('./',script&&script.src?script.src:location.href);
const routeUrl=new URL('data/city-routes.json',siteRoot);
const mapUrl=new URL('maps/cities/kyoto.geojson',siteRoot);
function loadJson(url){return fetch(url,{credentials:'same-origin'}).then(function(response){if(!response.ok)throw new Error('HTTP '+response.status);return response.json();});}
function setNote(block,message){const note=block.querySelector('[data-route-load-note]');if(note)note.textContent=message;}
function mountPhotoViewer(){
 const dialog=document.createElement('dialog');
 dialog.className='tb-photo-viewer';
 dialog.setAttribute('aria-label','Enlarged Kyoto photo');
 dialog.innerHTML='<button class="tb-photo-viewer-close" type="button" aria-label="Close enlarged photo"><span aria-hidden="true">×</span></button><figure><img alt=""><figcaption></figcaption></figure>';
 document.body.append(dialog);
 const closeButton=dialog.querySelector('.tb-photo-viewer-close');
 const largeImage=dialog.querySelector('img');
 const caption=dialog.querySelector('figcaption');
 let lastFocus=null;
 function openViewer(sourceImage){
  const figure=sourceImage.closest('figure');
  lastFocus=sourceImage;
  largeImage.src=sourceImage.currentSrc||sourceImage.src;
  largeImage.alt=sourceImage.alt||'Kyoto travel photo';
  caption.textContent=figure&&figure.querySelector('figcaption')?figure.querySelector('figcaption').textContent.trim():largeImage.alt;
  dialog.showModal();
  closeButton.focus();
 }
 function closeViewer(){if(dialog.open)dialog.close();}
 document.querySelectorAll('.tb-route-gallery img,.tb-hero-frame img').forEach(function(image){
  const figure=image.closest('figure');
  const label=figure&&figure.querySelector('figcaption')?figure.querySelector('figcaption').textContent.trim():image.alt;
  image.tabIndex=0;
  image.setAttribute('role','button');
  image.setAttribute('aria-haspopup','dialog');
  image.setAttribute('aria-label','Enlarge photo: '+label);
 });
 document.addEventListener('click',function(event){
  const image=event.target.closest&&event.target.closest('.tb-route-gallery img,.tb-hero-frame img');
  if(image)openViewer(image);
 });
 document.addEventListener('keydown',function(event){
  const image=event.target.closest&&event.target.closest('.tb-route-gallery img,.tb-hero-frame img');
  if(image&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openViewer(image);}
 });
 closeButton.addEventListener('click',closeViewer);
 dialog.addEventListener('click',function(event){if(event.target===dialog)closeViewer();});
 dialog.addEventListener('close',function(){if(lastFocus)lastFocus.focus();lastFocus=null;});
}
async function mount(){
 mountPhotoViewer();
 const blocks=Array.from(document.querySelectorAll('[data-kyoto-route-block]'));
 if(!blocks.length)return;
 let registry,mapData;
 try{registry=await loadJson(routeUrl);}catch(error){blocks.forEach(function(block){setNote(block,'Map unavailable. The numbered stops and Google Maps directions are still available.');});return;}
 try{mapData=await loadJson(mapUrl);}catch(error){mapData=null;}
 const route=registry.routes&&registry.routes.find(function(item){return item.id==='kyoto-city-day';});
 blocks.forEach(function(block){
  const panel=block.querySelector('[data-kyoto-route-view]');
  if(!route||!panel||!root.CityRouteUI||!root.CityRouteUI.mountCityRouteView){setNote(block,'Map unavailable. The numbered stops and Google Maps directions are still available.');return;}
  try{
   root.CityRouteUI.mountCityRouteView(panel,route,mapData,{hideStopPhotos:true,compactGuide:true});
   const note=block.querySelector('[data-route-load-note]');
   if(mapData&&note)note.hidden=true;
  }catch(error){setNote(block,'Interactive map unavailable. Use the stop order and Google Maps directions below.');}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof window!=='undefined'?window:globalThis);
