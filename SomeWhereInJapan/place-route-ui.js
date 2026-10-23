(function(root){
'use strict';
let registryPromise;
function registry(){return registryPromise||(registryPromise=fetch(new URL(`${root.location.pathname.includes('/places/')?'../../':'./'}data/place-routes.json?v=20261023-1`,document.baseURI)).then(r=>r.ok?r.json():null).catch(()=>null));}
function mount(host,record,registryData){
 const route=record.route||record,mapData=registryData.maps?.[record.placeId];
 if(!route||!mapData||!root.CityRouteUI)return null;
 route.cityId='nikko';
 return root.CityRouteUI.mountCityRouteView(host,route,mapData,{origin:{station:route.origin.name}});
}
async function mountDialog(placeName){
 const routeDetails=document.querySelector('#place-dialog-route-details');
 const host=document.querySelector('#place-dialog-route-map');
 if(!routeDetails||!host)return;
 routeDetails.hidden=true;routeDetails.open=false;host.replaceChildren();
 const result=await registry();const record=result?.routes?.find(item=>item.placeId==='nikko-in-the-cedars'&&placeName==='Nikko in the cedars');
 if(!record)return;
 routeDetails.hidden=false;
 let controller=null;
 const open=()=>{routeDetails.open=true;if(!controller)controller=mount(host,record,result);requestAnimationFrame(()=>controller?.resize());};
 const summary=routeDetails.querySelector('summary');
 summary.onclick=event=>{event.preventDefault();if(routeDetails.open){routeDetails.open=false;}else open();};
 const observer=new MutationObserver(()=>{if(!routeDetails.open)requestAnimationFrame(()=>controller?.resize());});
 observer.observe(routeDetails,{attributes:true,attributeFilter:['open']});
 routeDetails._cleanup=()=>{observer.disconnect();controller?.destroy();controller=null;};
}
async function mountGuide(){
 const host=document.querySelector('[data-place-route-guide]');if(!host)return;
 const result=await registry();const record=result?.routes?.find(item=>item.placeId==='nikko-in-the-cedars');
 if(!record)return;
 const controller=mount(host,record,result);
 requestAnimationFrame(()=>controller?.resize());
}
root.PlaceRouteUI=Object.freeze({mountDialog,mountGuide});
document.addEventListener('DOMContentLoaded',()=>{if(document.querySelector('[data-place-route-guide]'))mountGuide();},{once:true});
})(typeof window!=='undefined'?window:globalThis);
