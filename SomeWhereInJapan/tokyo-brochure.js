(function bootTokyoBrochure(root){
'use strict';
const script=document.currentScript;
const siteRoot=new URL('./',script?.src||location.href);
const jsonUrl=new URL('data/tokyo-brochure-routes.json',siteRoot);

function setLoadNote(block,message){
 const note=block.querySelector('[data-route-load-note]');
 if(note) note.textContent=message;
}

async function loadJson(url){
 const response=await fetch(url,{credentials:'same-origin'});
 if(!response.ok) throw new Error('HTTP '+response.status);
 return response.json();
}


function mountPhotoViewer(){
 const dialog=document.createElement('dialog');
 dialog.className='tb-photo-viewer';
 dialog.setAttribute('aria-label','Enlarged Tokyo photo');
 dialog.innerHTML='<button class="tb-photo-viewer-close" type="button" aria-label="Close enlarged photo"><span aria-hidden="true">×</span></button><figure><img alt=""><figcaption></figcaption></figure>';
 document.body.append(dialog);
 const closeButton=dialog.querySelector('.tb-photo-viewer-close');
 const largeImage=dialog.querySelector('img');
 const caption=dialog.querySelector('figcaption');
 let lastFocus=null;
 function closeViewer(){
  if(dialog.open) dialog.close();
 }
 function openViewer(sourceImage){
  const sourceFigure=sourceImage.closest('figure');
  lastFocus=sourceImage;
  largeImage.src=sourceImage.currentSrc||sourceImage.src;
  largeImage.alt=sourceImage.alt||'Tokyo travel photo';
  caption.textContent=sourceFigure?.querySelector('figcaption')?.textContent?.trim()||largeImage.alt;
  dialog.showModal();
  closeButton.focus();
 }
 document.querySelectorAll('.tb-route-gallery img').forEach(image=>{
  const label=image.closest('figure')?.querySelector('figcaption')?.textContent?.trim()||image.alt;
  image.tabIndex=0;
  image.setAttribute('role','button');
  image.setAttribute('aria-haspopup','dialog');
  image.setAttribute('aria-label',`Enlarge photo: ${label}`);
 });
 document.addEventListener('click',event=>{
  const image=event.target.closest?.('.tb-route-gallery img');
  if(image) openViewer(image);
 });
 document.addEventListener('keydown',event=>{
  const image=event.target.closest?.('.tb-route-gallery img');
  if(image&&(event.key==='Enter'||event.key===' ')){
   event.preventDefault();
   openViewer(image);
  }
 });
 closeButton.addEventListener('click',closeViewer);
 dialog.addEventListener('click',event=>{if(event.target===dialog)closeViewer();});
 dialog.addEventListener('close',()=>{lastFocus?.focus();lastFocus=null;});
}

async function mount(){
 mountPhotoViewer();
 const blocks=[...document.querySelectorAll('[data-tokyo-route-block]')];
 if(!blocks.length) return;
 let registry;
 try{registry=await loadJson(jsonUrl);}
 catch(error){
  blocks.forEach(block=>setLoadNote(block,'Map unavailable. Open More details for stop notes and directions.'));
  return;
 }
 for(const block of blocks){
  const routeId=block.getAttribute('data-tokyo-route-block');
  const route=registry.routes?.find(item=>item.id===routeId);
  const panel=block.querySelector('[data-tokyo-route-view]');
  if(!route||!panel||!root.CityRouteUI?.mountCityRouteView){
   setLoadNote(block,'Map unavailable. Open More details for stop notes and directions.');
   continue;
  }
  let mapData=null;
  try{mapData=await loadJson(new URL(route.mapDataPath,siteRoot));}
  catch(error){setLoadNote(block,'Map data unavailable. The ordered stops and Google Maps directions remain available.');}
  try{
   root.CityRouteUI.mountCityRouteView(panel,route,mapData,{hideStopPhotos:true,compactGuide:true});
   const note=block.querySelector('[data-route-load-note]');
   if(mapData&&note) note.hidden=true;
  }catch(error){
   setLoadNote(block,'Interactive map unavailable. The stop list and Google Maps link below still work.');
  }
 }
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
})(typeof window!=='undefined'?window:globalThis);
