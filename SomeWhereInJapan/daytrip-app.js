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
  const heroMonth = $('#hero-month');
  const month = $('#daytrip-month');
  months.forEach((name, index) => { const option = document.createElement('option'); option.value = String(index + 1); option.textContent = name; month.append(option); });
  function setForm(value) {
    $('#daytrip-month').value = String(value.month); $('#daytrip-time').value = value.time;
    $('#daytrip-transport').value = value.transport; $('#daytrip-budget').value = String(value.budget);
    $('#daytrip-interest').value = value.interest;
  }
  setForm(state);
  if (heroMonth) heroMonth.value = String(state.month);
  $('#hero-month-form').addEventListener('submit', (event) => {
    event.preventDefault(); month.value = heroMonth.value; draw();
    $('#daytrips')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    $('#daytrip-time').focus({ preventScroll: true });
  });
  function currentState() {
    return { month: Number(month.value), time: $('#daytrip-time').value, transport: $('#daytrip-transport').value,
      budget: Number($('#daytrip-budget').value), interest: $('#daytrip-interest').value,
      compareIds: state.compareIds.filter((id) => ids.includes(id)) };
  }
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money = (value) => '¥' + Number(value).toLocaleString('en-US');
  function draw() {
    Object.assign(state, currentState());
    const matches = core.filterTrips(trips, state);
    status.textContent = matches.length ? `${matches.length} route${matches.length === 1 ? '' : 's'} fit your choices · sorted by fit` : core.createNoMatchMessage(trips, state);
    results.innerHTML = matches.map((trip) => {
      const route = trip.modes[state.transport].profiles[state.time];
      const seasonal = trip.seasonFit[state.month] || 'Season-specific guidance is limited; confirm local conditions.';
      const compared = state.compareIds.includes(trip.id);
      return `<article class="daytrip-card"><div class="daytrip-card-top"><span>${esc(trip.region)} · ${esc(months[state.month-1])}</span><button type="button" data-compare="${esc(trip.id)}" aria-pressed="${compared}">${compared ? 'Added to compare ✓' : '＋ Compare'}</button></div><h3>${esc(trip.name)}</h3><p class="daytrip-subtitle">${esc(trip.subtitle)}</p><p class="daytrip-fit">${esc(seasonal)}</p><div class="daytrip-stats"><div><b>${route.totalHours.min}–${route.totalHours.max} h</b><span>door to door</span></div><div><b>${money(route.costYen.min)}–${money(route.costYen.max)}</b><span>estimated total</span></div><div><b>${route.roundTripHours.min}–${route.roundTripHours.max} h</b><span>round-trip travel</span></div></div><p class="daytrip-route"><strong>Estimate includes:</strong> transport ${money(route.costBreakdown.transport.min)}–${money(route.costBreakdown.transport.max)} · admissions ${money(route.costBreakdown.admissions.min)}–${money(route.costBreakdown.admissions.max)} · meal allowance ${money(route.costBreakdown.meal.min)}–${money(route.costBreakdown.meal.max)}.</p><p class="daytrip-route"><strong>Arrive:</strong> ${esc(route.arrival)}</p><p class="daytrip-route"><strong>Route:</strong> ${route.stops.map(esc).join(' <span aria-hidden="true">→</span> ')}</p><p class="daytrip-tradeoff"><strong>Know before you go:</strong> ${esc(trip.tradeoff)} ${esc(trip.effort)}</p><a class="daytrip-guide-link" href="day-trips/${encodeURIComponent(trip.slug)}/">Open the full field note <span>→</span></a></article>`;
    }).join('');
    drawCompare();
  }
  function drawCompare() {
    const box = $('#daytrip-compare'), selected = trips.filter((trip) => state.compareIds.includes(trip.id));
    box.hidden = selected.length < 2;
    if (box.hidden) { box.innerHTML = ''; return; }
    box.innerHTML = `<h3>Side by side <span>${selected.length} routes</span></h3><div class="daytrip-compare-grid">${selected.map((trip) => {
      const route = trip.modes[state.transport] && trip.modes[state.transport].profiles[state.time];
      return `<article><button type="button" data-remove="${esc(trip.id)}" aria-label="Remove ${esc(trip.name)} from comparison">×</button><h4>${esc(trip.name)}</h4><p>${route ? `${route.totalHours.min}–${route.totalHours.max} hours · ${money(route.costYen.min)}–${money(route.costYen.max)}` : 'No researched route for these settings'}</p><p>${esc(trip.effort)}</p><p>${esc(trip.tradeoff)}</p></article>`;
    }).join('')}</div>`;
  }
  form.addEventListener('input', draw); form.addEventListener('change', draw);
  form.addEventListener('submit', (event) => { event.preventDefault(); draw(); results.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'}); });
  results.addEventListener('click', (event) => {
    const button = event.target.closest('[data-compare]'); if (!button) return;
    const id = button.dataset.compare;
    state.compareIds = state.compareIds.includes(id) ? state.compareIds.filter((item) => item !== id) : [...state.compareIds, id].slice(-3);
    draw();
  });
  $('#daytrip-compare').addEventListener('click', (event) => { const button = event.target.closest('[data-remove]'); if (!button) return; state.compareIds = state.compareIds.filter((id) => id !== button.dataset.remove); draw(); });
  $('#daytrip-save').addEventListener('click', () => { let ok = false; try { ok = core.savePlan(window.localStorage, currentState()); } catch (_error) { ok = false; } status.textContent = ok ? 'Plan saved on this device.' : 'This browser did not allow local saving; the finder is still ready to use.'; });
  $('#daytrip-share').addEventListener('click', async () => {
    const url = core.buildShareUrl(location.href.split('?')[0], currentState());
    try { await navigator.clipboard.writeText(url); status.textContent = 'Share link copied. It includes your choices and comparison list.'; }
    catch (_error) { prompt('Copy this share link:', url); }
  });
  $('#daytrip-print').addEventListener('click', () => window.print());
  let saved = null; try { saved = core.loadPlan(window.localStorage, ids); } catch (_error) { saved = null; }
  if (!location.search && saved) { setForm(saved); Object.assign(state, saved); }
  draw();
})();
