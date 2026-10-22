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
const tokyoTools=document.createElement('details');
tokyoTools.className='tokyo-route-tools';
const tokyoSummary=document.createElement('summary');
tokyoSummary.textContent='Explore Tokyo’s five researched day trips';
const tokyoDescription=document.createElement('p');
tokyoDescription.textContent='Open the Tokyo route finder to compare the original day trips by month, travel mode, budget and interests.';
tokyoTools.append(tokyoSummary,tokyoDescription);
let routeMode='transit';
let availability='one';
select.replaceChildren(...core.CITY_ORIGINS.map(city=>{
 const option=document.createElement('option');
 option.value=city.id;
 option.textContent=`${city.city} · ${city.station}`;
 return option;
}));
const urlOrigin=new URLSearchParams(location.search).get('origin');
select.value=core.CITY_ORIGINS.some(city=>city.id===urlOrigin)?urlOrigin:'tokyo';
function escapeHtml(value){const el=document.createElement('span');el.textContent=String(value);return el.innerHTML;}
function stopCard(stop,dayStops,origin,index){
 const photo=photos[stop.name];
 const previous=dayStops[index-1];
 const leg=core.directionsUrl(origin,`${stop.name}, ${stop.area}`,routeMode,previous?`${previous.name}, ${previous.area}`:origin.station);
 const place=escapeHtml(stop.name);
 return `<li><div class="city-plan-stop-index">${String(index+1).padStart(2,'0')}</div><article><figure class="city-plan-stop-photo"><img src="${photo.url}" alt="${escapeHtml(photo.alt)}" loading="lazy" decoding="async"><a href="${photo.source}" target="_blank" rel="noopener noreferrer" aria-label="Photo by ${escapeHtml(photo.credit)}; ${escapeHtml(photo.license)}. Open image source" class="city-plan-photo-credit">PHOTO · ${escapeHtml(photo.credit)} · ${escapeHtml(photo.license)}</a><span class="city-plan-photo-fallback" hidden>Photo temporarily unavailable · <a href="${photo.source}" target="_blank" rel="noopener noreferrer">open the source image</a></span></figure><div class="city-plan-stop-meta"><span>${escapeHtml(stop.timing)}</span><span>Allow ${escapeHtml(stop.duration)}</span></div><h5>${place}</h5><p class="city-plan-stop-area">${escapeHtml(stop.area)}</p><details class="city-plan-stop-guide"><summary>How to see it at its best</summary><div><p>${escapeHtml(stop.story)}</p><p class="city-plan-visit-note">Use the suggested visit window as a planning guide. Opening days, access and seasonal conditions can change, so check the venue’s current visitor information before setting out.</p></div></details><a href="${leg}" target="_blank" rel="noopener noreferrer">${previous?'Directions from previous stop':`Directions from ${escapeHtml(origin.station)}`} <b aria-hidden="true">&#8599;</b></a></article></li>`;
}
function render(){
 if(tokyoTools.isConnected)tokyoTools.remove();
 const origin=core.CITY_ORIGINS.find(item=>item.id===select.value)||core.CITY_ORIGINS[2];
 const isTokyo=origin.id==='tokyo';
 const plan=core.CITY_DAY_PLANS[origin.id];
 cityLabel.textContent=origin.station;
 if(headingKicker)headingKicker.textContent=`A FULL DAY FROM ${origin.city.toUpperCase()} · CURATED CITY PLAN`;
 if(headingTitle)headingTitle.innerHTML=`A day in ${escapeHtml(origin.city)}.<br><em>Planned around you.</em>`;
 if(headingCopy)headingCopy.textContent=plan.intro;
 cityNote.textContent=`A curated ${origin.city} day plan starts at ${origin.station}; explore the place photos and open live directions for current connections.`;
 allForms.forEach(element=>{if(element)element.hidden=true;});
 panel.hidden=false;
 const places=core.nearbyPlaces(window.DESTINATIONS,origin.id).slice(0,8);
 const stops=plan.stops;
 const days=core.itineraryDays(stops,availability);
 const daysDescription=availability==='half'
  ?'A focused half-day route through two anchor stops. Allow for each visit window and the time needed to travel between them.'
  :availability==='two'
   ?`All ${stops.length} stops spread across two lighter days. Each morning starts again from ${origin.station}; check live connections before you set out.`
   :`The full ${stops.length}-stop sequence in one day. Begin early enough to enjoy each place without rushing.`;
 const dayMarkup=days.map((day,dayIndex)=>{
  const route=core.dayPlanDirectionsUrl(origin,day.stops,routeMode);
  const finalStop=day.stops.at(-1);
  const returnRoute=core.directionsUrl(origin,origin.station,routeMode,`${finalStop.name}, ${finalStop.area}`);
  const itinerary=day.stops.map((stop,index)=>stopCard(stop,day.stops,origin,index)).join('');
  return `<section class="city-plan-day" aria-labelledby="city-plan-day-${dayIndex+1}"><div class="city-plan-day-header"><div><p class="atlas-kicker">${availability==='two'?`DAY ${dayIndex+1} OF 2`:'YOUR ROUTE'}</p><h5 id="city-plan-day-${dayIndex+1}">${escapeHtml(day.title)}</h5></div><div class="city-plan-actions"><a href="${route}" target="_blank" rel="noopener noreferrer">Open this day in Google Maps <b aria-hidden="true">&#8599;</b></a><a href="${returnRoute}" target="_blank" rel="noopener noreferrer">Back to ${escapeHtml(origin.station)} <b aria-hidden="true">&#8599;</b></a></div></div><ol class="city-plan-stops">${itinerary}</ol></section>`;
 }).join('');
 const nearby=places.map(place=>`<article class="city-origin-card"><p>${escapeHtml(place.region)}</p><h4>${escapeHtml(place.name)}</h4><span>${escapeHtml(place.place)}</span><div><a href="${core.directionsUrl(origin,place.name+' '+place.place,'transit')}" target="_blank" rel="noopener noreferrer">Transit directions <b aria-hidden="true">&#8599;</b></a><a href="${core.directionsUrl(origin,place.name+' '+place.place,'car')}" target="_blank" rel="noopener noreferrer">Drive <b aria-hidden="true">&#8599;</b></a></div></article>`).join('');
 panel.innerHTML=`<div class="city-origin-heading"><p class="atlas-kicker">STARTING IN ${escapeHtml(origin.city.toUpperCase())} · ${escapeHtml(origin.region.toUpperCase())}</p><h3>From ${escapeHtml(origin.city)},<br><em>one good day.</em></h3><p>Start at ${escapeHtml(origin.station)} and follow a route shaped around the time you have. Open each place for its story and practical visit note.</p><p class="city-origin-result-count">${escapeHtml(plan.pace)}</p></div><section class="city-origin-plan" aria-labelledby="city-plan-title"><div class="city-plan-header"><div><p class="atlas-kicker">A THOUGHTFUL ORDER FOR THE DAY</p><h4 id="city-plan-title">${escapeHtml(plan.title)}</h4><p>${escapeHtml(plan.intro)}</p></div><div class="city-plan-controls"><label class="city-plan-availability" for="city-plan-availability">TIME YOU HAVE<select id="city-plan-availability"><option value="half" ${availability==='half'?'selected':''}>Half day · 2 places</option><option value="one" ${availability==='one'?'selected':''}>One day · all places</option><option value="two" ${availability==='two'?'selected':''}>Two days · all places</option></select></label><label class="city-plan-mode" for="city-plan-mode">GETTING AROUND<select id="city-plan-mode"><option value="transit" ${routeMode==='transit'?'selected':''}>Public transport</option><option value="car" ${routeMode==='car'?'selected':''}>By car</option></select></label></div></div><p class="city-plan-availability-note">${escapeHtml(daysDescription)}</p><p class="city-plan-caveat">Visit windows are suggestions, not timed admissions. Transfer times and fares change by date; check live directions and each venue’s current access before setting out.</p>${dayMarkup}<p class="city-plan-source">Route inspiration: <a href="${plan.source.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(plan.source.label)} <span aria-hidden="true">&#8599;</span></a></p></section><div class="city-origin-more"><div class="city-origin-more-heading"><p class="atlas-kicker">WHEN YOU HAVE ANOTHER DAY</p><h4>More to explore in ${escapeHtml(origin.region)}</h4><p>${places.length} regional places with live directions from ${escapeHtml(origin.station)}. Longer journeys can take several hours; check the route before choosing.</p></div><div class="city-origin-grid">${nearby}</div></div>`;
 if(isTokyo){allForms.forEach(element=>{if(element){element.hidden=false;tokyoTools.append(element);}});panel.append(tokyoTools);}
 panel.querySelector('#city-plan-availability').addEventListener('change',event=>{availability=event.target.value;render();});
 panel.querySelector('#city-plan-mode').addEventListener('change',event=>{routeMode=event.target.value;render();});
 panel.querySelectorAll('.city-plan-stop-photo img').forEach(image=>image.addEventListener('error',()=>{
  image.hidden=true;
  const fallback=image.parentElement.querySelector('.city-plan-photo-fallback');
  if(fallback)fallback.hidden=false;
 }));
}
select.addEventListener('change',()=>{
 const url=new URL(location.href);
 if(select.value==='tokyo')url.searchParams.delete('origin');else url.searchParams.set('origin',select.value);
 history.pushState({cityOrigin:select.value},'',url);
 render();
});
window.addEventListener('popstate',()=>{
 const value=new URLSearchParams(location.search).get('origin');
 select.value=core.CITY_ORIGINS.some(city=>city.id===value)?value:'tokyo';
 render();
});
render();
})();
