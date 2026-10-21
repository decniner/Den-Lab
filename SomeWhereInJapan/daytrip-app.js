(function () {
  'use strict';
  const core = window.TokyoDayTripCore;
  const trips = window.TokyoDayTrips && window.TokyoDayTrips.DAY_TRIPS || [];
  if (!core || !trips.length) return;
  const $ = (selector) => document.querySelector(selector);
  const form = $('#daytrip-form'), results = $('#daytrip-results'), status = $('#daytrip-status');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const ids = trips.map((trip) => trip.id);
  const coordinates = {
    kawagoe: {lat:35.9251,lon:139.4858}, sawara: {lat:35.897,lon:140.497},
    mitake: {lat:35.801,lon:139.183}, narita: {lat:35.7765,lon:140.3188},
    odawara: {lat:35.255,lon:139.159}
  };
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
  const money=value=>'¥'+Number(value).toLocaleString('en-US');
  function routeFor(trip){return trip&&trip.modes[state.transport]&&(trip.modes[state.transport].profiles?.[state.time]||trip.modes[state.transport])||null;}
  function pointFor(trip) {
    const point=coordinates[trip.id]||{lat:35.7,lon:139.8};
    return {x:Math.round(70+(point.lon-139)*282),y:Math.round(26+(36.15-point.lat)*250)};
  }
  function drawMap(trip) {
    const path=$('#tokyo-route-path'),marker=$('#tokyo-map-destination'),description=$('#tokyo-route-map-desc');
    if(!trip){path.setAttribute('visibility','hidden');marker.setAttribute('visibility','hidden');description.textContent='A schematic locator showing Tokyo Station. Choose a matching route to see its relative direction. It does not show rail or road alignment.';return;}
    const point=pointFor(trip),origin={x:310,y:184};
    path.setAttribute('visibility','visible');
    path.setAttribute('d',`M${origin.x} ${origin.y} L${point.x} ${point.y}`);
    marker.setAttribute('visibility','visible');
    marker.querySelectorAll('circle').forEach(circle=>{circle.setAttribute('cx',point.x);circle.setAttribute('cy',point.y);});
    const label=marker.querySelector('text');
    label.setAttribute('x',Math.min(585,point.x+16));label.setAttribute('y',Math.max(44,point.y-10));label.textContent=trip.name.toUpperCase();
    description.textContent=`Schematic locator: ${trip.name} is shown relative to Tokyo Station. The dotted line indicates direction only and is not a verified railway or road alignment.`;
  }
  function renderRoute(trip) {
    const target=$('#daytrip-selected-content');
    if(!trip){target.innerHTML='<p class="route-empty">No outing matches all of these limits. Adjust the month, time, transport or budget, or open one of the five field notes below.</p>';drawMap(null);return;}
    const route=routeFor(trip),seasonal=trip.seasonFit[state.month]||'Season-specific guidance is limited; confirm local conditions before travelling.';
    const stats=[['TOTAL DAY',`${route.totalHours.min}–${route.totalHours.max} h`],['ESTIMATED SPEND',`${money(route.costYen.min)}–${money(route.costYen.max)}`],['TRAVEL TIME',`${route.roundTripHours.min}–${route.roundTripHours.max} h`]];
    const stops=route.stops.map((stop,index)=>`<li><span>${String(index+1).padStart(2,'0')}</span><strong>${escapeHtml(stop)}</strong></li>`).join('');
    target.innerHTML=`<div class="route-detail-heading"><p class="atlas-kicker">${escapeHtml(trip.region)} · ${escapeHtml(months[state.month-1])}</p><h3>${escapeHtml(trip.name)}</h3><p>${escapeHtml(trip.subtitle)}</p></div><dl class="route-detail-stats">${stats.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><div class="route-detail-why"><section><span>WHY THIS DAY</span><p>${escapeHtml(trip.subtitle)} ${escapeHtml(seasonal)}</p></section><section><span>THINK TWICE IF</span><p>${escapeHtml(trip.tradeoff)}</p></section></div><div class="route-itinerary"><div class="route-itinerary-heading"><div><p class="atlas-kicker">THE ORDER OF THE DAY</p><h4>${route.stops.length} planned stops</h4></div><span>Visit time varies by pace</span></div><ol>${stops}</ol><p class="route-arrival"><strong>First arrival:</strong> ${escapeHtml(route.arrival)}</p><p class="route-cost-note">Estimate includes transport ${money(route.costBreakdown.transport.min)}–${money(route.costBreakdown.transport.max)}, admissions ${money(route.costBreakdown.admissions.min)}–${money(route.costBreakdown.admissions.max)}, and a ${money(route.costBreakdown.meal.min)}–${money(route.costBreakdown.meal.max)} meal allowance. It is not a live fare quote.</p></div><a class="daytrip-guide-link" href="day-trips/${encodeURIComponent(trip.slug)}/">Open the full field note <span aria-hidden="true">↗</span></a>`;
    drawMap(trip);
  }
  function drawCompare() {
    const box=$('#daytrip-compare'),selected=trips.filter(trip=>state.compareIds.includes(trip.id));
    box.hidden=selected.length<2;
    if(box.hidden){box.replaceChildren();return;}
    box.innerHTML=`<div class="compare-heading"><p class="atlas-kicker">COMPARE THE TRADE-OFFS</p><h3>Which day suits you?</h3></div><div class="daytrip-compare-grid">${selected.map(trip=>{
      const route=routeFor(trip);
      return `<article><button type="button" data-remove="${escapeHtml(trip.id)}" aria-label="Remove ${escapeHtml(trip.name)} from comparison">×</button><h4>${escapeHtml(trip.name)}</h4><p><strong>${route?`${route.totalHours.min}–${route.totalHours.max} hours · ${money(route.costYen.min)}–${money(route.costYen.max)}`:'No researched route fits the selected options'}</strong></p><p>${escapeHtml(trip.effort)}</p><p><span>THE TRADE-OFF</span>${escapeHtml(trip.tradeoff)}</p><a href="day-trips/${encodeURIComponent(trip.slug)}/">Read its field note ↗</a></article>`;
    }).join('')}</div>`;
  }
  function draw() {
    Object.assign(state,currentState());
    const matches=core.filterTrips(trips,state);
    const chosen=matches.find(trip=>trip.id===state.selectedId)||matches[0]||null;
    state.selectedId=chosen?chosen.id:null;
    status.textContent=matches.length?`${matches.length} day${matches.length===1?'':'s'} fit your choices. Select one to see its stops and relative direction.`:core.createNoMatchMessage(trips,state);
    results.innerHTML=matches.map((trip,index)=>{
      const route=routeFor(trip),selected=trip.id===state.selectedId,compared=state.compareIds.includes(trip.id);
      return `<article class="route-choice"><button class="route-choice-main" type="button" data-trip="${escapeHtml(trip.id)}" aria-pressed="${selected}" aria-label="Select ${escapeHtml(trip.name)}, estimated ${route.totalHours.min} to ${route.totalHours.max} hours and ${money(route.costYen.min)} to ${money(route.costYen.max)}"><span class="route-choice-number">0${index+1}</span><span class="route-choice-copy"><strong>${escapeHtml(trip.name)}</strong><small>${escapeHtml(trip.region)} · ${route.totalHours.min}–${route.totalHours.max} h · ${money(route.costYen.min)}–${money(route.costYen.max)}</small></span><span class="route-choice-actions"><span>${selected?'SELECTED':'VIEW ROUTE'}</span></span></button><button class="route-compare-toggle" type="button" data-compare="${escapeHtml(trip.id)}" aria-pressed="${compared}" aria-label="${compared?'Remove':'Add'} ${escapeHtml(trip.name)} ${compared?'from':'to'} comparison">${compared?'✓':'+'}</button></article>`;
    }).join('');
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

