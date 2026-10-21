  function drawCompare(){
    const box=$('#daytrip-compare'),selected=trips.filter(trip=>state.compareIds.includes(trip.id));
    box.hidden=selected.length<2;
    if(box.hidden){box.replaceChildren();return;}
    box.innerHTML=`<div class="compare-heading"><p class="atlas-kicker">COMPARE THE TRADE-OFFS</p><h3>Which day suits you?</h3></div><div class="daytrip-compare-grid">${selected.map(trip=>{
      const route=routeFor(trip),seasonal=trip.seasonFit[state.month]||'Confirm seasonal conditions with the destination before travel.';
      const planned=route?route.stops.map((stop,index)=>`<li><span>${String(index+1).padStart(2,'0')}</span>${escapeHtml(stop.name)}</li>`).join(''):'';
      return `<article><button type="button" data-remove="${escapeHtml(trip.id)}" aria-label="Remove ${escapeHtml(trip.name)} from comparison">×</button><h4>${escapeHtml(trip.name)}</h4><p><strong>${route?`${route.totalHours.min}-${route.totalHours.max} hours · ${money(route.costYen.min)}-${money(route.costYen.max)}`:'No researched route fits the selected options'}</strong></p><p><span>SEASON</span>${escapeHtml(seasonal)}</p><p><span>EFFORT</span>${escapeHtml(trip.effort)}</p><p><span>PLAN AROUND</span>${escapeHtml(trip.tradeoff)}</p>${route?`<p class="route-short-plan"><strong>SHORTER DAY</strong> ${escapeHtml(trip.guide.shortPlan.duration)} — ${escapeHtml(trip.guide.shortPlan.route)}</p><details><summary>See the shared stop sequence</summary><ol>${planned}</ol><p>${escapeHtml(route.rainPlan)}</p></details>`:''}<a href="day-trips/${encodeURIComponent(trip.slug)}/">Read the full field guide ↗</a></article>`;
    }).join('')}</div>`;
  }
