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
select.replaceChildren(...core.CITY_ORIGINS.map(city=>{const option=document.createElement('option');option.value=city.id;option.textContent=`${city.city} \u00b7 ${city.station}`;return option;}));
const urlOrigin=new URLSearchParams(location.search).get('origin');
select.value=core.CITY_ORIGINS.some(city=>city.id===urlOrigin)?urlOrigin:'tokyo';
function escapeHtml(value){const el=document.createElement('span');el.textContent=String(value);return el.innerHTML;}
function render(){
 const origin=core.CITY_ORIGINS.find(item=>item.id===select.value)||core.CITY_ORIGINS[2],isTokyo=origin.id==='tokyo';
 cityLabel.textContent=origin.station;
 if(headingKicker)headingKicker.textContent=isTokyo?'TOKYO FIELD DESK \u00b7 FIVE RESEARCHED PILOT ROUTES':`STARTING IN ${origin.city.toUpperCase()} \u00b7 LIVE LOCAL DIRECTIONS`;
 if(headingTitle)headingTitle.innerHTML=isTokyo?'One city.<br><em>Five different days.</em>':'Start close.<br><em>Go a little further.</em>';
 if(headingCopy)headingCopy.textContent=isTokyo?'Route ranges start at Tokyo Station. Choose the time, travel mode and budget; then compare the real trade-offs before you go.':`Browse the ${origin.region} field guide and open live directions from ${origin.station}. Map travel times and fares change by date.`;
 cityNote.textContent=isTokyo?'Detailed pilot estimates below depart from Tokyo Station.':'Choose a nearby place, then open live transit or driving directions from '+origin.station+'. Times and fares come from Maps and can change.';
 allForms.forEach(element=>{if(element)element.hidden=!isTokyo;});panel.hidden=isTokyo;if(isTokyo)return;
 const places=core.nearbyPlaces(window.DESTINATIONS,origin.id).slice(0,8);
 panel.innerHTML=`<div class="city-origin-heading"><p class="atlas-kicker">STARTING IN ${origin.city.toUpperCase()} \u00b7 ${origin.region.toUpperCase()}</p><h3>Find somewhere<br><em>near your station.</em></h3><p>Place-specific stories and live route links. Travel times and fares depend on your date; check the map before you set out.</p><p class="city-origin-result-count">${places.length} places in this regional guide</p></div><div class="city-origin-grid">${places.map(place=>`<article class="city-origin-card"><p>${escapeHtml(place.region)}</p><h4>${escapeHtml(place.name)}</h4><span>${escapeHtml(place.place)}</span><div><a href="${core.directionsUrl(origin,place.name+' '+place.place,'transit')}" target="_blank" rel="noopener noreferrer">Transit directions <b aria-hidden="true">&#8599;</b></a><a href="${core.directionsUrl(origin,place.name+' '+place.place,'car')}" target="_blank" rel="noopener noreferrer">Drive <b aria-hidden="true">&#8599;</b></a></div></article>`).join('')}</div>`;
}
select.addEventListener('change',()=>{const url=new URL(location.href);if(select.value==='tokyo')url.searchParams.delete('origin');else url.searchParams.set('origin',select.value);history.pushState({cityOrigin:select.value},'',url);render();});
window.addEventListener('popstate',()=>{const value=new URLSearchParams(location.search).get('origin');select.value=core.CITY_ORIGINS.some(city=>city.id===value)?value:'tokyo';render();});
render();
})();
