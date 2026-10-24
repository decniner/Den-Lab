(function bootCityBrochure(root){
'use strict';
const script=document.currentScript;
const siteRoot=new URL('./',script&&script.src?script.src:location.href);
const routeUrl=new URL('data/city-routes.json',siteRoot);
function loadJson(url){return fetch(url,{credentials:'same-origin'}).then(function(response){if(!response.ok)throw new Error('HTTP '+response.status);return response.json();});}
function setNote(block,message){const note=block.querySelector('[data-route-load-note]');if(note)note.textContent=message;}
function mountPhotoViewer(){
 const dialog=document.createElement('dialog');
 dialog.className='tb-photo-viewer';
 dialog.setAttribute('aria-label','Enlarged travel photo');
 dialog.innerHTML='<button class="tb-photo-viewer-close" type="button" aria-label="Close enlarged photo"><span aria-hidden="true">×</span></button><figure><img alt=""><figcaption></figcaption></figure>';
 document.body.append(dialog);
 const closeButton=dialog.querySelector('.tb-photo-viewer-close');
 const largeImage=dialog.querySelector('img');
 const caption=dialog.querySelector('figcaption');
 let lastFocus=null;
 function openViewer(image){
  const figure=image.closest('figure');
  lastFocus=image;
  largeImage.src=image.currentSrc||image.src;
  largeImage.alt=image.alt||'Travel photo';
  caption.textContent=figure&&figure.querySelector('figcaption')?figure.querySelector('figcaption').textContent.trim():largeImage.alt;
  dialog.showModal();
  closeButton.focus();
 }
 function closeViewer(){if(dialog.open)dialog.close();}
 document.querySelectorAll('.tb-route-gallery img,.tb-hero-frame img').forEach(function(image){
  const figure=image.closest('figure');
  const label=figure&&figure.querySelector('figcaption')?figure.querySelector('figcaption').textContent.trim():image.alt;
  image.tabIndex=0;image.setAttribute('role','button');image.setAttribute('aria-haspopup','dialog');image.setAttribute('aria-label','Enlarge photo: '+label);
 });
 document.addEventListener('click',function(event){const image=event.target.closest&&event.target.closest('.tb-route-gallery img,.tb-hero-frame img');if(image)openViewer(image);});
 document.addEventListener('keydown',function(event){const image=event.target.closest&&event.target.closest('.tb-route-gallery img,.tb-hero-frame img');if(image&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openViewer(image);}});
 closeButton.addEventListener('click',closeViewer);
 dialog.addEventListener('click',function(event){if(event.target===dialog)closeViewer();});
 dialog.addEventListener('close',function(){if(lastFocus)lastFocus.focus();lastFocus=null;});
}
async function mountRoute(block){
 const cityId=block.getAttribute('data-city-brochure');
 let registry;
 try{registry=await loadJson(routeUrl);}catch(error){setNote(block,'Map unavailable. The numbered stops and Google Maps directions remain available.');return;}
 const route=registry.routes&&registry.routes.find(function(item){return item.cityId===cityId;});
 const panel=block.querySelector('[data-city-route-view]');
 if(!route||!panel||!root.CityRouteUI||!root.CityRouteUI.mountCityRouteView){setNote(block,'Map unavailable. The numbered stops and Google Maps directions remain available.');return;}
 let mapData=null;
 try{mapData=await loadJson(new URL('maps/cities/'+encodeURIComponent(cityId)+'.geojson',siteRoot));}catch(error){}
 try{
  root.CityRouteUI.mountCityRouteView(panel,route,mapData,{hideStopPhotos:true,compactGuide:true});
  const note=block.querySelector('[data-route-load-note]');
  if(mapData&&note)note.hidden=true;
 }catch(error){setNote(block,'Interactive map unavailable. Use the stop order and Google Maps directions below.');}
}
function mount(){
 mountPhotoViewer();
 document.querySelectorAll('[data-city-brochure]').forEach(function(block){mountRoute(block);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof window!=='undefined'?window:globalThis);
