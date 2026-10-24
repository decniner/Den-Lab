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

async function mount(){
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
