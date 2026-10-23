(function(){
'use strict';
const core=window.CityOrigins,photos=window.CityStopPhotos;
const select=document.querySelector('#city-origin'),panel=document.querySelector('#city-origin-results');
if(!core||!photos||!select||!panel)return;
const cityLabel=document.querySelector('#daytrip-city-label');
const cityNote=document.querySelector('#daytrip-city-note');
const headingKicker=document.querySelector('#daytrip-heading-kicker');
const headingTitle=document.querySelector('#daytrip-heading-title');
const headingCopy=document.querySelector('#daytrip-heading-copy');
const standard=document.querySelector('.daytrip-layout');
const compare=document.querySelector('#daytrip-compare');
const directory=document.querySelector('.daytrip-directory');
const method=document.querySelector('.daytrip-method');
const allForms=[standard,compare,directory,method];
let activeMappedRoute=null;
const cityRouteRecords=fetch(new URL('data/city-routes.json',document.baseURI)).then(response=>response.ok?response.json():null).catch(()=>null);
const tokyoTools=document.createElement('details');
tokyoTools.className='tokyo-route-tools';
const tokyoSummary=document.createElement('summary');
tokyoSummary.textContent='Compare Tokyo day trips';
const tokyoDescription=document.createElement('p');
tokyoDescription.textContent='Open the Tokyo route finder to compare the original day trips by month, travel mode, budget and interests.';
tokyoTools.append(tokyoSummary,tokyoDescription);
let routeMode='transit';
let availability='1';
let halfDay=false;
const cityGroup=document.createElement('optgroup');cityGroup.label='Major city stations';
const airportGroup=document.createElement('optgroup');airportGroup.label='Airport stations';
for(const origin of core.CITY_ORIGINS){const option=document.createElement('option');option.value=origin.id;option.textContent=`${origin.city}  /  ${origin.station}`;cityGroup.append(option);}
for(const origin of core.AIRPORT_ORIGINS){const option=document.createElement('option');option.value=origin.id;option.textContent=origin.label;airportGroup.append(option);}
select.replaceChildren(cityGroup,airportGroup);
const urlOrigin=new URLSearchParams(location.search).get('origin');
select.value=core.ALL_ORIGINS.some(origin=>origin.id===urlOrigin)?urlOrigin:'tokyo';
function escapeHtml(value){const el=document.createElement('span');el.textContent=String(value);return el.innerHTML;}
async function attachMappedRoute(origin){
 const cityId=origin.planId||origin.id;
 const registry=await cityRouteRecords;
 if(select.value!==origin.id||!registry)return;
 const route=(registry.routes||[]).find(record=>record.cityId===cityId);
 if(!route||!Array.isArray(route.stops)||route.stops.length<2||!window.CityRouteUI)return;
 const legacyPlan=panel.querySelector('.city-origin-plan'),legacyMore=panel.querySelector('.city-origin-more');
 if(legacyPlan)legacyPlan.hidden=true;if(legacyMore)legacyMore.hidden=true;
 let mapData=null;
 try{const response=await fetch(new URL(`maps/cities/${encodeURIComponent(cityId)}.geojson`,document.baseURI));if(response.ok)mapData=await response.json();}catch(error){mapData=null;}
 if(select.value!==origin.id)return;
 activeMappedRoute?.destroy();
 activeMappedRoute=window.CityRouteUI.mountCityRouteView(panel,route,mapData,{origin,photos,airport:core.AIRPORT_ORIGINS.some(item=>item.id===origin.id),fallbackUrl:new URL(`maps/cities/${encodeURIComponent(cityId)}.svg`,document.baseURI).href});
}
function stopCard(stop,dayStops,origin,index){
 const photo=photos[stop.name]||stop.photo||(stop.image?{url:`https://images.unsplash.com/${stop.image}?auto=format&fit=crop&w=1200&q=85`,source:'https://unsplash.com',credit:'Unsplash',license:'Unsplash License',alt:stop.alt||stop.name}:null);
 const guideUrl=window.GuideLinks?.destinationUrl(stop.name);
 const guideTitle=guideUrl?`<a href="${guideUrl}">${escapeHtml(stop.name)}</a>`:escapeHtml(stop.name);
 if(!photo)return `<li class="city-plan-stop-text"><div class="city-plan-stop-index">${String(index+1).padStart(2,'0')}</div><article><div class="city-plan-stop-meta"><span>${escapeHtml(stop.timing||'Suggested visit')}</span><span>Allow ${escapeHtml(stop.duration||'60-90 min')}</span></div><h5>${guideTitle}</h5><p class="city-plan-stop-area">${escapeHtml(stop.area||'')}</p><p>${escapeHtml(stop.story||'')}</p></article></li>`;
 const previous=dayStops[index-1];
 const leg=core.directionsUrl(origin,`${stop.name}, ${stop.area}`,routeMode,previous?`${previous.name}, ${previous.area}`:origin.station);
 const place=escapeHtml(stop.name);
 return `<li><div class="city-plan-stop-index">${String(index+1).padStart(2,'0')}</div><article><figure class="city-plan-stop-photo"><img src="${photo.url}" alt="${escapeHtml(photo.alt||stop.alt||stop.name)}" loading="lazy" decoding="async"><a href="${photo.source||'https://unsplash.com'}" target="_blank" rel="noopener noreferrer" aria-label="Photo by ${escapeHtml(photo.credit||'Unsplash')}; ${escapeHtml(photo.license||'see linked source')}. Open image source" class="city-plan-photo-credit">PHOTO  /  ${escapeHtml(photo.credit||'Unsplash')}  /  ${escapeHtml(photo.license||'see linked source')}</a><span class="city-plan-photo-fallback" hidden>Photo temporarily unavailable  /  <a href="${photo.source||'https://unsplash.com'}" target="_blank" rel="noopener noreferrer">open the source image</a></span></figure><div class="city-plan-stop-meta"><span>${escapeHtml(stop.timing||'Suggested visit  /  check current access')}</span><span>Allow ${escapeHtml(stop.duration||'60-90 min  /  planning estimate')}</span></div><h5>${guideUrl?`<a href="${guideUrl}">${place}</a>`:place}</h5><p class="city-plan-stop-area">${escapeHtml(stop.area)}</p><details class="city-plan-stop-guide"><summary>How to see it at its best</summary><div><p>${escapeHtml(stop.story)}</p><p class="city-plan-visit-note">Use the suggested visit window as a planning guide. Opening days, access and seasonal conditions can change, so check the venue's current visitor information before setting out.</p></div></details><a href="${leg}" target="_blank" rel="noopener noreferrer">${previous?'Directions from previous stop':`Directions from ${escapeHtml(origin.station)}`} <b aria-hidden="true">&#8599;</b></a></article></li>`;
}
function render(){
 if(activeMappedRoute){activeMappedRoute.destroy();activeMappedRoute=null;}
 if(tokyoTools.isConnected)tokyoTools.remove();
 const origin=core.ALL_ORIGINS.find(item=>item.id===select.value)||core.CITY_ORIGINS[2];
 const isTokyo=origin.id==='tokyo';
 const plan=core.CITY_DAY_PLANS[origin.planId||origin.id];
 cityLabel.textContent=origin.station;
 if(headingKicker)headingKicker.textContent=`A FULL DAY FROM ${origin.city.toUpperCase()}  /  CURATED CITY PLAN`;
 if(headingTitle)headingTitle.innerHTML=`A day in ${escapeHtml(origin.city)}.<br><em>Planned around you.</em>`;
 if(headingCopy)headingCopy.textContent=plan.intro;
 cityNote.textContent=isTokyo?'Tokyo outing estimates below use Tokyo Station. Other origin selections show city ideas and individual live directions, without inherited Tokyo costs or times.':`This is a suggested ${origin.city} sequence starting from ${origin.station}. It has no calculated transfer times or budget; use individual live directions and verify the route before combining places.`;
 allForms.forEach(element=>{if(element)element.hidden=true;});
 panel.hidden=false;
 const regionalPlaces=core.nearbyPlaces(window.DESTINATIONS,origin.id);
 const places=regionalPlaces.slice(0,8);
 const stops=plan.stops;
 const days=core.itineraryDays(stops,halfDay?'half':availability,regionalPlaces,origin.city);
 const dayCount=days.length;

 const daysDescription=halfDay
  ?`A focused half-day sequence through two anchor stops from ${stops.length} researched places. Turn off half-day mode to plan a longer visit.`
  :dayCount===1
   ?`All ${stops.length} researched stops are included in this suggested city sequence. Begin early and adjust the pace to suit you.`
   :`Day 1 shows a suggested ${stops.length}-stop city sequence, with individual directions for each leg. Additional days remain open; choose and verify places separately instead of treating nearby listings as a tested route.`;
 const dayMarkup=days.map((day,dayIndex)=>{
  const finalStop=day.stops.at(-1);
  const returnRoute=finalStop?core.directionsUrl(origin,origin.station,routeMode,`${finalStop.name}, ${finalStop.area}`):'';
  const itinerary=day.stops.map((stop,index)=>stopCard(stop,day.stops,origin,index)).join('');
  const actions=day.stops.length?`<div class="city-plan-actions"><a href="${returnRoute}" target="_blank" rel="noopener noreferrer">Directions back to ${escapeHtml(origin.station)} <b aria-hidden="true">&#8599;</b></a></div>`:'';
  const content=day.stops.length?`<ol class="city-plan-stops">${itinerary}</ol>`:'<p class="city-plan-open-day">Keep this day flexible: revisit a favorite, take a slower neighborhood walk, or add a place from the regional suggestions below.</p>';
  return `<section class="city-plan-day" aria-labelledby="city-plan-day-${dayIndex+1}"><div class="city-plan-day-header"><div><p class="atlas-kicker">${halfDay?'HALF-DAY ROUTE':day.stops.length?`DAY ${dayIndex+1} OF ${dayCount}  /  ${day.stops.length} PLACES`:`DAY ${dayIndex+1} OF ${dayCount}  /  FLEXIBLE`}</p><h5 id="city-plan-day-${dayIndex+1}">${escapeHtml(day.title)}</h5></div>${actions}</div>${content}</section>`;
 }).join('');
 const nearby=places.map(place=>`<article class="city-origin-card"><p>${escapeHtml(place.region)}</p><h4>${escapeHtml(place.name)}</h4><span>${escapeHtml(place.place)}</span><div><a href="${core.directionsUrl(origin,place.name+' '+place.place,'transit')}" target="_blank" rel="noopener noreferrer">Transit directions <b aria-hidden="true">&#8599;</b></a><a href="${core.directionsUrl(origin,place.name+' '+place.place,'car')}" target="_blank" rel="noopener noreferrer">Drive <b aria-hidden="true">&#8599;</b></a></div></article>`).join('');
 panel.innerHTML=`<div class="city-origin-heading"><p class="atlas-kicker">STARTING IN ${escapeHtml(origin.city.toUpperCase())}  /  ${escapeHtml(origin.region.toUpperCase())}</p><h3>From ${escapeHtml(origin.city)},<br><em>${dayCount>1?`${dayCount} days, well spent.`:'one good day.'}</em></h3><p>Start at ${escapeHtml(origin.station)} and follow a suggested sequence. Each place has separate directions; no multi-stop transit schedule is implied.</p><p class="city-origin-result-count">${escapeHtml(plan.pace)}</p></div><section class="city-origin-plan" aria-labelledby="city-plan-title"><div class="city-plan-header"><div><p class="atlas-kicker">${dayCount>1?`${dayCount}-DAY CITY IDEAS`:'A SUGGESTED ORDER FOR THE DAY'}</p><h4 id="city-plan-title">${escapeHtml(plan.title)}</h4><p>${escapeHtml(plan.intro)}</p></div><div class="city-plan-controls"><label class="city-plan-availability" for="city-plan-availability">NUMBER OF DAYS<input id="city-plan-availability" type="number" min="1" max="30" step="1" inputmode="numeric" value="${escapeHtml(availability)}"></label><label class="city-plan-half-day"><input id="city-plan-half-day" type="checkbox" ${halfDay?'checked':''}> Plan a focused half-day</label><label class="city-plan-mode" for="city-plan-mode">GETTING AROUND<select id="city-plan-mode"><option value="transit" ${routeMode==='transit'?'selected':''}>Public transport</option><option value="car" ${routeMode==='car'?'selected':''}>By car</option></select></label></div></div><p class="city-plan-availability-note">${escapeHtml(daysDescription)}</p><p class="city-plan-caveat">Visit windows are suggestions, not timed admissions. The sequence is not a timetable; transfer times and fares change by date. Check each individual leg and venue before setting out.</p>${dayMarkup}<p class="city-plan-source">Route inspiration: <a href="${plan.source.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(plan.source.label)} <span aria-hidden="true">&#8599;</span></a></p></section><div class="city-origin-more"><div class="city-origin-more-heading"><p class="atlas-kicker">WHEN YOU HAVE ANOTHER DAY</p><h4>More to explore in ${escapeHtml(origin.region)}</h4><p>${places.length} regional place ideas with individual directions from ${escapeHtml(origin.station)}. Longer journeys can take several hours; check each route before choosing.</p></div><div class="city-origin-grid">${nearby}</div></div>`;
 if(isTokyo){allForms.forEach(element=>{if(element){element.hidden=false;tokyoTools.append(element);}});panel.append(tokyoTools);}
 panel.querySelector('#city-plan-availability').addEventListener('change',event=>{const entered=Number.parseInt(event.target.value,10);availability=String(Number.isFinite(entered)?Math.max(1,Math.min(30,entered)):1);halfDay=false;render();});
 panel.querySelector('#city-plan-half-day').addEventListener('change',event=>{halfDay=event.target.checked;render();});
 panel.querySelector('#city-plan-mode').addEventListener('change',event=>{routeMode=event.target.value;render();});
 panel.querySelectorAll('.city-plan-stop-photo img').forEach(image=>image.addEventListener('error',()=>{
  image.hidden=true;
  const fallback=image.parentElement.querySelector('.city-plan-photo-fallback');
  if(fallback)fallback.hidden=false;
 }));
 attachMappedRoute(origin);
}
select.addEventListener('change',()=>{
 const url=new URL(location.href);
 if(select.value==='tokyo')url.searchParams.delete('origin');else url.searchParams.set('origin',select.value);
 history.pushState({cityOrigin:select.value},'',url);
 render();
});
window.addEventListener('popstate',()=>{
 const value=new URLSearchParams(location.search).get('origin');
 select.value=core.ALL_ORIGINS.some(origin=>origin.id===value)?value:'tokyo';
 render();
});
render();
})();

