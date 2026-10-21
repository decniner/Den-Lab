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
    const stats=[['TOTAL DAY',`${route.totalHours.min}-${route.totalHours.max} h`],['ESTIMATED SPEND',`${money(route.costYen.min)}-${money(route.costYen.max)}`],['TRAVEL TIME',`${route.roundTripHours.min}-${route.roundTripHours.max} h`]];
    const stops=route.stops.map((stop,index)=>`<li data-route-stop-row="${index}" class="${index===0?'is-selected':''}" ${index===0?'aria-current="step"':''}><button type="button" class="route-itinerary-stop" data-stop-select="${index}" aria-pressed="${index===0}"><span>${String(index+1).padStart(2,'0')}</span><strong>${escapeHtml(stop.name)}</strong><small>${escapeHtml(stop.address)} · ${escapeHtml(stop.walk)} · ${escapeHtml(stop.duration)}</small><span>${escapeHtml(stop.story)}</span></button><div class="route-itinerary-stop-links"><a href="${escapeHtml(stop.maps)}" target="_blank" rel="noopener noreferrer">Open map ↗</a><a href="${escapeHtml(stop.walkMap)}" target="_blank" rel="noopener noreferrer">Walking directions ↗</a></div></li>`).join('');
    target.innerHTML=`<div class="route-detail-heading"><p class="atlas-kicker">${escapeHtml(trip.region)} · ${escapeHtml(months[state.month-1])}</p><h3>${escapeHtml(trip.name)}</h3><p>${escapeHtml(trip.subtitle)}</p></div><dl class="route-detail-stats">${stats.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><div class="route-detail-why"><section><span>WHY THIS DAY</span><p>${escapeHtml(route.stops[1]?.story||trip.subtitle)} ${escapeHtml(seasonal)}</p></section><section><span>PLAN AROUND</span><p>${escapeHtml(trip.tradeoff)}</p></section></div><div class="route-itinerary"><div class="route-itinerary-heading"><div><p class="atlas-kicker">THE ORDER OF THE DAY</p><h4>${route.stops.length} planned stops</h4></div><span>Select a stop to highlight its map point</span></div><ol class="route-itinerary-list">${stops}</ol><p class="route-arrival"><strong>First arrival:</strong> ${escapeHtml(route.arrival)}</p><p class="route-rain-plan"><strong>IF WEATHER CHANGES</strong> ${escapeHtml(route.rainPlan)}</p><aside class="route-short-plan"><strong>LESS TIME?</strong> ${escapeHtml(trip.guide.shortPlan.duration)} — ${escapeHtml(trip.guide.shortPlan.route)} Leave out: ${escapeHtml(trip.guide.shortPlan.omitted)}</aside><p class="route-cost-note">Estimate includes transport ${money(route.costBreakdown.transport.min)}-${money(route.costBreakdown.transport.max)}, admissions ${money(route.costBreakdown.admissions.min)}-${money(route.costBreakdown.admissions.max)}, and a ${money(route.costBreakdown.meal.min)}-${money(route.costBreakdown.meal.max)} meal allowance. Estimates are not live fare quotes.</p></div><a class="daytrip-guide-link" href="day-trips/${encodeURIComponent(trip.slug)}/">Open the full field guide <span aria-hidden="true">↗</span></a>`;
    drawMap(trip);
  }
