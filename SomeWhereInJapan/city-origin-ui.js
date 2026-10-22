(function(){
'use strict';
const core=window.CityOrigins,select=document.querySelector('#city-origin'),panel=document.querySelector('#city-origin-results');
if(!core||!select||!panel)return;
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
const tokyoSummary=document.createElement('summary');tokyoSummary.textContent='Explore Tokyo’s five researched day trips';
const tokyoDescription=document.createElement('p');tokyoDescription.textContent='Open the Tokyo route finder to compare the original day trips by month, travel mode, budget and interests.';
tokyoTools.append(tokyoSummary,tokyoDescription);
let routeMode='transit';
select.replaceChildren(...core.CITY_ORIGINS.map(city=>{const option=document.createElement('option');option.value=city.id;option.textContent=`${city.city} \u00b7 ${city.station}`;return option;}));
const urlOrigin=new URLSearchParams(location.search).get('origin');
select.value=core.CITY_ORIGINS.some(city=>city.id===urlOrigin)?urlOrigin:'tokyo';
function escapeHtml(value){const el=document.createElement('span');el.textContent=String(value);return el.innerHTML;}
function render(){
 if(tokyoTools.isConnected)tokyoTools.remove();
 const origin=core.CITY_ORIGINS.find(item=>item.id===select.value)||core.CITY_ORIGINS[2],isTokyo=origin.id==='tokyo';
 const plan=core.CITY_DAY_PLANS[origin.id];
 cityLabel.textContent=origin.station;
 if(headingKicker)headingKicker.textContent=`A FULL DAY FROM ${origin.city.toUpperCase()} \u00b7 CURATED CITY PLAN`;
 if(headingTitle)headingTitle.innerHTML=`A day in ${escapeHtml(origin.city)}.<br><em>Planned around you.</em>`;
 if(headingCopy)headingCopy.textContent=plan.intro;
 cityNote.textContent=`A curated ${origin.city} day plan starts at ${origin.station}; open live directions for current times and routes.`;
 allForms.forEach(element=>{if(element)element.hidden=true;});panel.hidden=false;
 const places=core.nearbyPlaces(window.DESTINATIONS,origin.id).slice(0,8);
 const stops=plan.stops;
 const route=core.dayPlanDirectionsUrl(origin,stops,routeMode);
 const returnRoute=core.directionsUrl(origin,origin.station,routeMode,`${stops.at(-1).name}, ${stops.at(-1).area}`);
 const itinerary=stops.map((stop,index)=>{
  const previous=index?`${stops[index-1].name}, ${stops[index-1].area}`:origin.station;
  const leg=core.directionsUrl(origin,`${stop.name}, ${stop.area}`,routeMode,previous);
  return `<li><div class="city-plan-stop-index">${String(index+1).padStart(2,'0')}</div><article><div class="city-plan-stop-meta"><span>${escapeHtml(stop.timing)}</span><span>Suggested visit \u00b7 ${escapeHtml(stop.duration)}</span></div><h5>${escapeHtml(stop.name)}</h5><p class="city-plan-stop-area">${escapeHtml(stop.area)}</p><p class="city-plan-stop-story">${escapeHtml(stop.story)}</p><a href="${leg}" target="_blank" rel="noopener noreferrer">${index?'Directions from previous stop':'Directions from '+escapeHtml(origin.station)} <b aria-hidden="true">&#8599;</b></a></article></li>`;
 }).join('');
 const nearby=places.map(place=>`<article class="city-origin-card"><p>${escapeHtml(place.region)}</p><h4>${escapeHtml(place.name)}</h4><span>${escapeHtml(place.place)}</span><div><a href="${core.directionsUrl(origin,place.name+' '+place.place,'transit')}" target="_blank" rel="noopener noreferrer">Transit directions <b aria-hidden="true">&#8599;</b></a><a href="${core.directionsUrl(origin,place.name+' '+place.place,'car')}" target="_blank" rel="noopener noreferrer">Drive <b aria-hidden="true">&#8599;</b></a></div></article>`).join('');
 panel.innerHTML=`<div class="city-origin-heading"><p class="atlas-kicker">STARTING IN ${escapeHtml(origin.city.toUpperCase())} \u00b7 ${escapeHtml(origin.region.toUpperCase())}</p><h3>From ${escapeHtml(origin.city)},<br><em>one good day.</em></h3><p>Start at ${escapeHtml(origin.station)} and follow the stop sequence below. Use the live route links to check current connections.</p><p class="city-origin-result-count">${escapeHtml(plan.pace)}</p></div><section class="city-origin-plan" aria-labelledby="city-plan-title"><div class="city-plan-header"><div><p class="atlas-kicker">A THOUGHTFUL ORDER FOR THE DAY</p><h4 id="city-plan-title">${escapeHtml(plan.title)}</h4><p>${escapeHtml(plan.intro)}</p></div><label class="city-plan-mode" for="city-plan-mode">GETTING AROUND<select id="city-plan-mode"><option value="transit" ${routeMode==='transit'?'selected':''}>Public transport</option><option value="car" ${routeMode==='car'?'selected':''}>By car</option></select></label></div><p class="city-plan-caveat">Visit windows are suggestions, not timed admissions. Transfer times and fares change by date; check live directions and each venue's current access before setting out.</p><div class="city-plan-actions"><a href="${route}" target="_blank" rel="noopener noreferrer">Open full route in Google Maps <b aria-hidden="true">&#8599;</b></a><a href="${returnRoute}" target="_blank" rel="noopener noreferrer">Route back to ${escapeHtml(origin.station)} <b aria-hidden="true">&#8599;</b></a></div><ol class="city-plan-stops">${itinerary}</ol><p class="city-plan-source">Route inspiration: <a href="${plan.source.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(plan.source.label)} <span aria-hidden="true">&#8599;</span></a></p></section><div class="city-origin-more"><div class="city-origin-more-heading"><p class="atlas-kicker">WHEN YOU HAVE ANOTHER DAY</p><h4>More to explore in ${escapeHtml(origin.region)}</h4><p>${places.length} regional places with live directions from ${escapeHtml(origin.station)}. Longer journeys can take several hours; check the route before choosing.</p></div><div class="city-origin-grid">${nearby}</div></div>`;
if(isTokyo){allForms.forEach(element=>{if(element){element.hidden=false;tokyoTools.append(element);}});panel.append(tokyoTools);}
 panel.querySelector('#city-plan-mode').addEventListener('change',event=>{routeMode=event.target.value;render();});
}
select.addEventListener('change',()=>{const url=new URL(location.href);if(select.value==='tokyo')url.searchParams.delete('origin');else url.searchParams.set('origin',select.value);history.pushState({cityOrigin:select.value},'',url);render();});
window.addEventListener('popstate',()=>{const value=new URLSearchParams(location.search).get('origin');select.value=core.CITY_ORIGINS.some(city=>city.id===value)?value:'tokyo';render();});
render();
})();
