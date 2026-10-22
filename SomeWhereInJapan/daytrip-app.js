(function () {
  'use strict';
  const core = window.TokyoDayTripCore;
  const trips = window.TokyoDayTrips && window.TokyoDayTrips.DAY_TRIPS || [];
  if (!core || !trips.length) return;
  const $ = (selector) => document.querySelector(selector);
  const form = $('#daytrip-form'), results = $('#daytrip-results'), status = $('#daytrip-status');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const ids = trips.map((trip) => trip.id);
  const state = core.readSharedPlan(location.search, trips);
  const month = $('#daytrip-month');
  months.forEach((name,index)=>{const option=document.createElement('option');option.value=String(index+1);option.textContent=name;month.append(option);});
  function setForm(value) {
    month.value=String(value.month);$('#daytrip-time').value=value.time;
    $('#daytrip-transport').value=value.transport;$('#daytrip-budget').value=String(value.budget);
    $('#daytrip-interest').value=value.interest;
  }
  setForm(state);
  function currentState() {
    return {month:Number(month.value),time:$('#daytrip-time').value,transport:$('#daytrip-transport').value,
      budget:Number($('#daytrip-budget').value),interest:$('#daytrip-interest').value,
      compareIds:state.compareIds.filter(id=>ids.includes(id)),selectedId:state.selectedId};
  }
  function writeHistory(push) {
    const url=core.buildShareUrl(location.href,currentState());
    if(push)history.pushState({},'',url);else history.replaceState({},'',url);
  }
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money=value=>'\u00a5'+Number(value).toLocaleString('en-US');
  function routeFor(trip){return trip&&trip.modes[state.transport]&&(trip.modes[state.transport].profiles?.[state.time]||trip.modes[state.transport])||null;}
  let visibleTrip=null;
  let selectedStopIndex=0;
  function routeFor(trip){return trip&&trip.modes[state.transport]&&(trip.modes[state.transport].profiles?.[state.time]||trip.modes[state.transport])||null;}
  function drawMap(trip) {
    const map=$('#tokyo-route-map');
    const heading=map.parentElement.querySelector('.route-map-heading');
    if(heading)heading.innerHTML='<span class="atlas-kicker">ROUTE STOP PLOT</span><span class="route-map-caveat">APPROXIMATE CONNECTORS · NOT WALKING DIRECTIONS</span>';
    let note=map.parentElement.querySelector('.route-map-selection');
    if(!note){note=document.createElement('p');note.className='route-map-selection';note.setAttribute('role','status');note.setAttribute('aria-live','polite');map.insertAdjacentElement('afterend',note);}
    visibleTrip=trip;
    if(!trip){map.setAttribute('viewBox','0 0 620 340');map.setAttribute('role','img');map.setAttribute('aria-label','Choose a trip to plot its stops.');map.innerHTML='<title>Route stop plot</title><desc>Choose a day trip to see its approximate geographic stop points.</desc><rect width="620" height="340" fill="#172421"/><text x="310" y="170" text-anchor="middle" fill="#efe4d2" font-size="16">Choose a route to plot its stops</text>';note.textContent='Select a trip to see stop locations and the order of the day.';return;}
    const stops=routeFor(trip).stops;
    const minLat=Math.min(...stops.map(stop=>stop.lat)),maxLat=Math.max(...stops.map(stop=>stop.lat));
    const minLon=Math.min(...stops.map(stop=>stop.lon)),maxLon=Math.max(...stops.map(stop=>stop.lon));
    const point=stop=>({x:Math.round(maxLon===minLon?310:52+((stop.lon-minLon)/(maxLon-minLon))*510),y:Math.round(maxLat===minLat?170:42+((maxLat-stop.lat)/(maxLat-minLat))*250)});
    const points=stops.map(point);
    const line=points.map(value=>`${value.x},${value.y}`).join(' ');
    const pins=stops.map((stop,index)=>{const p=points[index];return `<g class="tokyo-map-route-stop${index===selectedStopIndex?' is-selected':''}" role="button" tabindex="0" data-stop-select="${index}" aria-pressed="${index===selectedStopIndex}" aria-label="Select stop ${index+1}: ${escapeHtml(stop.name)}"><circle class="tokyo-map-route-hit" cx="${p.x}" cy="${p.y}" r="28"/><circle class="tokyo-map-route-halo" cx="${p.x}" cy="${p.y}" r="19"/><circle class="tokyo-map-route-dot" cx="${p.x}" cy="${p.y}" r="12"/><text class="tokyo-map-route-number" x="${p.x}" y="${p.y+4}" text-anchor="middle">${String(index+1).padStart(2,'0')}</text></g>`;}).join('');
    map.setAttribute('viewBox','0 0 620 340');map.setAttribute('role','group');map.setAttribute('aria-label',`${trip.name} stop plot. Select a numbered pin to highlight its itinerary entry.`);
    map.innerHTML=`<title>${escapeHtml(trip.name)} route stop plot</title><desc>Approximate geographic stop points in visit order. Dashed connections are schematic and are not walking directions. Select a numbered point to highlight its itinerary entry.</desc><defs><pattern id="route-stop-grid" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0H0V34" fill="none" stroke="#47605a" stroke-opacity=".28" stroke-width="1"/></pattern></defs><rect width="620" height="340" fill="#172421"/><rect width="620" height="340" fill="url(#route-stop-grid)"/><polyline class="tokyo-map-route-line" points="${line}"/>${pins}<text class="tokyo-map-route-disclaimer" x="18" y="321">APPROXIMATE STOP PLOT · DASHED CONNECTORS ARE NOT WALKING ROUTES</text>`;
    note.textContent=`Selected stop 01: ${stops[0].name}`;
  }
  function selectRouteStop(index) {
    const route=routeFor(visibleTrip),selected=Number(index);
    if(!route||!Number.isInteger(selected)||selected<0||selected>=route.stops.length)return;
    selectedStopIndex=selected;
    document.querySelectorAll('#tokyo-route-map [data-stop-select],#daytrip-selected-content [data-stop-select]').forEach(control=>control.setAttribute('aria-pressed',String(Number(control.dataset.stopSelect)===selected)));
    document.querySelectorAll('[data-route-stop-row]').forEach(row=>{const active=Number(row.dataset.routeStopRow)===selected;row.classList.toggle('is-selected',active);if(active)row.setAttribute('aria-current','step');else row.removeAttribute('aria-current');});
    document.querySelectorAll('#tokyo-route-map [data-stop-select]').forEach(pin=>pin.classList.toggle('is-selected',Number(pin.dataset.stopSelect)===selected));
    const note=$('#tokyo-route-map').parentElement.querySelector('.route-map-selection');
    if(note)note.textContent=`Selected stop ${String(selected+1).padStart(2,'0')}: ${route.stops[selected].name}`;
  }
  $('#daytrip-selected-route').addEventListener('click',event=>{const control=event.target.closest('[data-stop-select]');if(control)selectRouteStop(control.dataset.stopSelect);});
  $('#daytrip-selected-route').addEventListener('keydown',event=>{const pin=event.target.closest('#tokyo-route-map [role="button"][data-stop-select]');if(pin&&(event.key==='Enter'||event.key===' ')){event.preventDefault();selectRouteStop(pin.dataset.stopSelect);}});
  function renderRoute(trip) {
    const target=$('#daytrip-selected-content');
    if(!trip){target.innerHTML='<p class="route-empty">No outing matches all of these limits. Adjust the month, time, transport or budget, or open one of the five field guides below.</p>';drawMap(null);return;}
    const route=routeFor(trip),seasonal=trip.seasonFit[state.month]||'Season-specific guidance is limited; confirm local conditions before travelling.';
    selectedStopIndex=0;
    const stats=[['TOTAL DAY',`${route.totalHours.min}-${route.totalHours.max} h`],['ESTIMATED SPEND',route.costYen?`${money(route.costYen.min)}-${money(route.costYen.max)}`:'Incomplete · see required cost gaps'],['TRAVEL TIME',`${route.roundTripHours.min}-${route.roundTripHours.max} h`]];
    const stops=route.stops.map((stop,index)=>`<li data-route-stop-row="${index}" class="${index===0?'is-selected':''}" ${index===0?'aria-current="step"':''}><button type="button" class="route-itinerary-stop" data-stop-select="${index}" aria-pressed="${index===0}"><span>${String(index+1).padStart(2,'0')}</span><strong>${escapeHtml(stop.name)}</strong><small>${escapeHtml(stop.address)} · ${escapeHtml(stop.walk)} · ${escapeHtml(stop.duration)}</small><span>${escapeHtml(stop.story)}</span></button><div class="route-itinerary-stop-links"><a href="${escapeHtml(stop.maps)}" target="_blank" rel="noopener noreferrer">Open map ↗</a><a href="${escapeHtml(stop.walkMap)}" target="_blank" rel="noopener noreferrer">Walking directions ↗</a></div></li>`).join('');
    target.innerHTML=`<div class="route-detail-heading"><p class="atlas-kicker">${escapeHtml(trip.region)} · ${escapeHtml(months[state.month-1])}</p><h3>${escapeHtml(trip.name)}</h3><p>${escapeHtml(trip.subtitle)}</p></div><dl class="route-detail-stats">${stats.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><div class="route-detail-why"><section><span>WHY THIS DAY</span><p>${escapeHtml(route.stops[1]?.story||trip.subtitle)} ${escapeHtml(seasonal)}</p></section><section><span>PLAN AROUND</span><p>${escapeHtml(trip.tradeoff)}</p></section></div><div class="route-itinerary"><div class="route-itinerary-heading"><div><p class="atlas-kicker">THE ORDER OF THE DAY</p><h4>${route.stops.length} suggested stops</h4></div><span>Select a stop to highlight its map point</span></div><ol class="route-itinerary-list">${stops}</ol><p class="route-arrival"><strong>First arrival:</strong> ${escapeHtml(route.arrival)}</p><p class="route-rain-plan"><strong>IF WEATHER CHANGES</strong> ${escapeHtml(route.rainPlan)}</p><aside class="route-short-plan"><strong>LESS TIME?</strong> ${escapeHtml(trip.guide.shortPlan.duration)} — ${escapeHtml(trip.guide.shortPlan.route)} Leave out: ${escapeHtml(trip.guide.shortPlan.omitted)}</aside><p class="route-cost-note">${route.costBreakdown?`Estimate includes transport ${money(route.costBreakdown.transport.min)}-${money(route.costBreakdown.transport.max)}, admissions ${money(route.costBreakdown.admissions.min)}-${money(route.costBreakdown.admissions.max)}, and a ${money(route.costBreakdown.meal.min)}-${money(route.costBreakdown.meal.max)} meal allowance.`:escapeHtml(route.estimateNote||'Cost total incomplete; not eligible for budget matching.')} Estimates are not live fare quotes.</p></div><a class="daytrip-guide-link" href="day-trips/${encodeURIComponent(trip.slug)}/">Open the full field guide <span aria-hidden="true">↗</span></a>`;
    drawMap(trip);
  }
  function drawCompare(){
    const box=$('#daytrip-compare'),selected=trips.filter(trip=>state.compareIds.includes(trip.id));
    box.hidden=selected.length<2;
    if(box.hidden){box.replaceChildren();return;}
    box.innerHTML=`<div class="compare-heading"><p class="atlas-kicker">COMPARE THE TRADE-OFFS</p><h3>Which day suits you?</h3></div><div class="daytrip-compare-grid">${selected.map(trip=>{
      const route=routeFor(trip),seasonal=trip.seasonFit[state.month]||'Confirm seasonal conditions with the destination before travel.';
      const planned=route?route.stops.map((stop,index)=>`<li><span>${String(index+1).padStart(2,'0')}</span>${escapeHtml(stop.name)}</li>`).join(''):'';
      return `<article><button type="button" data-remove="${escapeHtml(trip.id)}" aria-label="Remove ${escapeHtml(trip.name)} from comparison">×</button><h4>${escapeHtml(trip.name)}</h4><p><strong>${route?`${route.totalHours.min}-${route.totalHours.max} hours · ${route.costYen?`${money(route.costYen.min)}-${money(route.costYen.max)}`:'budget incomplete'}`:'No researched route fits the selected options'}</strong></p><p><span>SEASON</span>${escapeHtml(seasonal)}</p><p><span>EFFORT</span>${escapeHtml(trip.effort)}</p><p><span>PLAN AROUND</span>${escapeHtml(trip.tradeoff)}</p>${route?`<p class="route-short-plan"><strong>SHORTER DAY</strong> ${escapeHtml(trip.guide.shortPlan.duration)} — ${escapeHtml(trip.guide.shortPlan.route)}</p><details><summary>See the suggested stop sequence</summary><ol>${planned}</ol><p>${escapeHtml(route.rainPlan)}</p></details>`:''}<a href="day-trips/${encodeURIComponent(trip.slug)}/">Read the full field guide ↗</a></article>`;
    }).join('')}</div>`;
  }
  function draw() {
    Object.assign(state,currentState());
    const matches=core.filterTrips(trips,state);
    const unbudgeted=core.findUnbudgetedTrips(trips,state);
    const available=[...matches,...unbudgeted];
    const chosen=available.find(trip=>trip.id===state.selectedId)||matches[0]||unbudgeted[0]||null;
    state.selectedId=chosen?chosen.id:null;
    status.textContent=matches.length?`${matches.length} researched day${matches.length===1?'':'s'} fit your time and budget. ${unbudgeted.length?`${unbudgeted.length} additional guide ideas have incomplete time and cost details; they are listed separately and are not verified matches.`:''}`:unbudgeted.length?`No verified time and budget match. ${unbudgeted.length} guide ideas have incomplete time and cost details; review them as starting points only.`:core.createNoMatchMessage(trips,state);
    const choiceMarkup=(trip,index,isUnbudgeted)=>{
      const route=routeFor(trip),selected=trip.id===state.selectedId,compared=state.compareIds.includes(trip.id);
      const spend=route.costYen?`${money(route.costYen.min)}-${money(route.costYen.max)}`:'COST INCOMPLETE';
      const description=`${trip.name}, ${route.totalHours.min} to ${route.totalHours.max} hours, ${route.costYen?spend:'cost estimate incomplete'}`;
      return `<article class="route-choice${isUnbudgeted?' route-choice-unbudgeted':''}"><button class="route-choice-main" type="button" data-trip="${escapeHtml(trip.id)}" data-budget-match="${!isUnbudgeted}" aria-pressed="${selected}" aria-label="Select ${escapeHtml(description)}"><span class="route-choice-number">0${index+1}</span><span class="route-choice-copy"><strong>${escapeHtml(trip.name)}</strong><small>${escapeHtml(trip.region)} | ${route.totalHours.min}-${route.totalHours.max} h | ${spend}${isUnbudgeted?' | NOT A BUDGET MATCH':''}</small></span><span class="route-choice-actions"><span>${selected?'SELECTED':'VIEW GUIDE'}</span></span></button><button class="route-compare-toggle" type="button" data-compare="${escapeHtml(trip.id)}" aria-pressed="${compared}" aria-label="${compared?'Remove':'Add'} ${escapeHtml(trip.name)} ${compared?'from':'to'} comparison">${compared?'?':'+'}</button></article>`;
    };
    results.innerHTML=`${matches.length?`<h4 class="route-result-group-title">BUDGET AND TIME MATCHES</h4>${matches.map((trip,index)=>choiceMarkup(trip,index,false)).join('')}`:''}${unbudgeted.length?`<h4 class="route-result-group-title route-incomplete-heading">GUIDES WITH INCOMPLETE ESTIMATES</h4><p class="route-result-group-note">These are not verified time or budget matches. Check transport legs, visit windows, costs and activity time before relying on the guide's ranges.</p>${unbudgeted.map((trip,index)=>choiceMarkup(trip,index,true)).join('')}`:''}`;
    renderRoute(chosen);drawCompare();
  }
  function refreshFromLocation() {
    const next=core.readSharedPlan(location.search,trips);
    Object.assign(state,next);setForm(next);draw();
  }
  form.addEventListener('input',()=>{draw();writeHistory(false);});
  form.addEventListener('change',()=>{draw();writeHistory(false);});
  form.addEventListener('submit',event=>{event.preventDefault();draw();writeHistory(true);$('#daytrip-selected-route').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});});
  results.addEventListener('click',event=>{
    const compare=event.target.closest('[data-compare]');
    if(compare){event.preventDefault();event.stopPropagation();const id=compare.dataset.compare;state.compareIds=state.compareIds.includes(id)?state.compareIds.filter(item=>item!==id):[...state.compareIds,id].slice(-3);draw();writeHistory(true);return;}
    const choice=event.target.closest('[data-trip]');if(!choice)return;
    state.selectedId=choice.dataset.trip;draw();writeHistory(true);
  });
  results.addEventListener('keydown',event=>{const toggle=event.target.closest('[data-compare]');if(toggle&&(event.key==='Enter'||event.key===' ')){event.preventDefault();toggle.click();}});
  $('#daytrip-compare').addEventListener('click',event=>{const remove=event.target.closest('[data-remove]');if(!remove)return;state.compareIds=state.compareIds.filter(id=>id!==remove.dataset.remove);draw();writeHistory(true);});
  $('#daytrip-save').addEventListener('click',()=>{let ok=false;try{ok=core.savePlan(window.localStorage,currentState());}catch(_error){ok=false;}status.textContent=ok?'Your selected day and comparison list are saved on this device.':'This browser did not allow local saving; your plan is still available in the page.';});
  $('#daytrip-share').addEventListener('click',async()=>{
    const url=core.buildShareUrl(location.href,currentState());
    try{await navigator.clipboard.writeText(url);status.textContent='Share link copied with your selected day, filters and comparisons.';}
    catch(_error){window.prompt('Copy this share link:',url);}
  });
  $('#daytrip-print').addEventListener('click',()=>window.print());
  let saved=null;try{saved=core.loadPlan(window.localStorage,ids);}catch(_error){saved=null;}
  if(!location.search&&saved){Object.assign(state,saved);setForm(saved);}
  window.addEventListener('popstate',refreshFromLocation);
  draw();
})();

