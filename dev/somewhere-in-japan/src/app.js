import { buildItinerary, validateData } from './planner.js';

const form = document.querySelector('#trip-form');
const routeSelect = document.querySelector('#route');
const baseOptions = document.querySelector('#base-options');
const mustSeeOptions = document.querySelector('#must-see-options');
const resultSection = document.querySelector('#itinerary');
const dataRoot = './data/';
const [places, localities, routes, events] = await Promise.all(['places.json', 'localities.json', 'routes.json', 'events.json'].map(async (file) => {
  const response = await fetch(`${dataRoot}${file}`);
  if (!response.ok) throw new Error(`Could not load ${file}`);
  return response.json();
}));
const data = { places, localities, routes, events };
const dataValidation = validateData(data);
const currentRoute = () => routes.find((route) => route.id === routeSelect.value);

function renderChoices() {
  const route = currentRoute();
  baseOptions.replaceChildren();
  mustSeeOptions.replaceChildren();
  for (const localityId of route.localityIds) {
    const locality = localities.find((item) => item.id === localityId);
    if (!locality) continue;
    const baseLabel = document.createElement('label');
    baseLabel.className = 'choice-item';
    baseLabel.innerHTML = `<input type="checkbox" value="${locality.id}" name="preferredBases"><span>${locality.base || locality.name}</span>`;
    baseOptions.append(baseLabel);
    const placeItems = places.filter((place) => place.localityId === localityId);
    for (const place of placeItems) {
      const label = document.createElement('label');
      label.className = 'choice-item';
      label.innerHTML = `<input type="checkbox" value="${place.id}" name="mustSee"><span>${place.name}</span>`;
      mustSeeOptions.append(label);
    }
  }
}

function collectInput() {
  const formData = new FormData(form);
  return {
    startDate: formData.get('startDate'), endDate: formData.get('endDate'), origin: formData.get('origin'),
    arrivalTime: formData.get('arrivalTime'), departureTime: formData.get('departureTime'), routeId: formData.get('routeId'),
    selectedRegions: [currentRoute().regionId], preferredBases: formData.getAll('preferredBases'),
    mustSee: formData.getAll('mustSee'), pace: formData.get('pace')
  };
}

function formatDate(isoDate) {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${isoDate}T00:00:00Z`));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function statusLabel(record) {
  if (record.status === 'verified' && record.checkedAt) {
    const ageDays = (Date.now() - new Date(`${record.checkedAt}T00:00:00Z`).getTime()) / 86400000;
    return ageDays > 90 ? { label: 'Source may be stale', kind: 'stale' } : { label: `Source checked ${record.checkedAt}`, kind: 'verified' };
  }
  return record.status === 'sample' ? { label: 'Sample planning data', kind: 'sample' } : { label: 'Unverified', kind: 'unknown' };
}

function renderPlan(input, plan) {
  document.querySelector('#form-errors').replaceChildren();
  const warningBox = document.querySelector('#plan-warnings');
  warningBox.innerHTML = plan.warnings.map((warning) => `<p class="warning-item ${escapeHtml(warning.severity)}"><span aria-hidden="true">${warning.severity === 'error' ? '!' : 'i'}</span>${escapeHtml(warning.message)}</p>`).join('');
  document.querySelector('#itinerary-date-range').textContent = `${input.startDate} — ${input.endDate}`;
  const route = currentRoute();
  document.querySelector('#route-summary').innerHTML = `<div><span class="eyebrow">PROPOSED ROUTE</span><strong>${escapeHtml(route.name)}</strong></div><div><span class="eyebrow">OVERNIGHT BASES</span><strong>${plan.days.filter((day, index) => day.base && (index === 0 || plan.days[index - 1].base !== day.base)).map((day) => escapeHtml(day.base)).join(' → ') || 'No bases available'}</strong></div><small>${escapeHtml(route.notes)} Route sequence: ${escapeHtml(route.status)} sample data.</small>`;
  document.querySelector('#itinerary-days').innerHTML = plan.days.map((day, index) => {
    const locality = localities.find((item) => item.id === day.localityId);
    const typeText = day.type === 'transfer' ? 'TRANSFER DAY' : day.type === 'partial' ? 'LIMITED DAY' : day.stops.length ? 'SIGHTSEEING' : 'OPEN BUFFER';
    return `<article class="day-card ${day.type}"><div class="day-index"><span>DAY</span><b>${String(index + 1).padStart(2, '0')}</b></div><div class="day-main"><div class="day-heading"><div><span class="day-type ${day.type}">${typeText}</span><h3>${escapeHtml(locality?.name || 'Unassigned day')}${day.base && day.base !== locality?.name ? ` <small>· ${escapeHtml(day.base)}</small>` : ''}</h3></div><time datetime="${escapeHtml(day.date)}">${formatDate(day.date)}</time></div>${day.transferNotes.map((note) => `<p class="transfer-note">${escapeHtml(note)}</p>`).join('')}${day.stops.length ? `<ul class="stop-list">${day.stops.map((stop) => { const status = statusLabel(stop); return `<li><div class="stop-copy"><strong>${escapeHtml(stop.name)}</strong>${stop.event ? `<span class="event-tag">DATE-BOUND EVENT</span>` : ''}<span class="source-status ${status.kind}">${escapeHtml(status.label)}${stop.checkedAt ? ` · ${escapeHtml(stop.checkedAt)}` : ''}</span></div><a href="${escapeHtml(stop.sourceUrl || '#')}" target="_blank" rel="noreferrer">${stop.status === 'verified' ? 'Official date source' : 'Reference source'} <span aria-hidden="true">↗</span></a></li>`; }).join('')}</ul>` : !day.transferNotes.length ? '<p class="open-day">No stops added. Keep this day open or choose a different route.</p>' : ''}</div></article>`;
  }).join('');
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

routeSelect.addEventListener('change', renderChoices);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = collectInput();
  const plan = buildItinerary(input, data);
  const errorBox = document.querySelector('#form-errors');
  const errors = plan.warnings.filter((item) => item.severity === 'error').map((item) => item.message);
  if (errors.length) {
    errorBox.innerHTML = errors.map((message) => `<p>${escapeHtml(message)}</p>`).join('');
    resultSection.hidden = true;
    return;
  }
  if (!dataValidation.valid) plan.warnings.push({ severity: 'error', message: `Sample data needs attention: ${dataValidation.errors.join(' ')}` });
  renderPlan(input, plan);
});

document.querySelector('#regenerate').addEventListener('click', () => {
  resultSection.hidden = true;
  document.querySelector('#planner').scrollIntoView({ behavior: 'smooth' });
});
document.querySelector('#print-plan').addEventListener('click', () => window.print());
renderChoices();
