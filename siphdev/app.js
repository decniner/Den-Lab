(() => {
  'use strict';

  const places = window.DESTINATIONS || [];
  const regions = window.PHILIPPINES_REGIONS || [];
  const moods = window.PHILIPPINES_MOODS || [];
  const placeById = new Map(places.map(place => [place.id || place.slug || place.name, place]));
  const grid = document.querySelector('#destination-grid');
  const search = document.querySelector('#place-search');
  const regionFilters = document.querySelector('#region-filters');
  const moodFilters = document.querySelector('#mood-filters');
  const resultCount = document.querySelector('#result-count');
  const status = document.querySelector('#itinerary-status');
  const output = document.querySelector('#itinerary-days-output');
  const tools = document.querySelector('#itinerary-result-tools');
  const form = document.querySelector('#itinerary-form');
  const regionRoot = document.querySelector('#itinerary-regions');
  const interestRoot = document.querySelector('#itinerary-interests');
  const shortlistRoot = document.querySelector('#itinerary-shortlist');
  const dialog = document.querySelector('#place-dialog');
  const dialogImage = document.querySelector('#place-dialog-image');
  const spotlight = {
    name: document.querySelector('#region-spotlight-name'),
    count: document.querySelector('#region-spotlight-count'),
    copy: document.querySelector('#region-spotlight-copy'),
    picks: document.querySelector('#region-spotlight-picks')
  };
  const STORAGE_KEY = 'somewhere-philippines-draft-v2';
  const SAVED_KEY = 'somewhere-philippines-saved-v2';
  const INTERESTS = ['Culture', 'Nature', 'Food', 'Islands', 'Slow travel'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  let activeRegion = 'All places';
  let activeMood = 'All moods';
  let limit = 12;
  let savedIds = new Set();
  let selectedIds = [];
  let draft = null;
  let dialogPlace = null;
  let dialogTrigger = null;

  const idOf = place => String(place.id || place.slug || place.name);
  const today = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  };
  document.querySelectorAll('[data-place-count]').forEach(node => { node.textContent = String(places.length); });

  function renderCards() {
    const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const found = places.filter(place =>
      (activeRegion === 'All places' || place.region === activeRegion) &&
      (activeMood === 'All moods' || place.tags.includes(activeMood)) &&
      terms.every(term => `${place.name} ${place.place} ${place.region} ${place.description} ${place.tags.join(' ')}`.toLowerCase().includes(term))
    );
    resultCount.textContent = `${found.length} ${found.length === 1 ? 'place' : 'places'}`;
    grid.replaceChildren(...found.slice(0, limit).map((place, index) => {
      const card = document.createElement('article'); card.className = 'destination-card';
      const image = document.createElement('div'); image.className = 'card-image-wrap';
      image.style.backgroundImage = `linear-gradient(0deg,rgba(7,14,12,.3),transparent 42%),url(https://images.unsplash.com/${place.image}?auto=format&fit=crop&w=1100&q=82)`;
      image.style.backgroundSize = 'cover'; image.style.backgroundPosition = 'center';
      const badge = document.createElement('span'); badge.className = 'card-region'; badge.textContent = place.region;
      const number = document.createElement('span'); number.className = 'card-index'; number.textContent = String(index + 1).padStart(2, '0');
      image.append(badge, number);
      const copy = document.createElement('div'); copy.className = 'card-copy';
      const location = document.createElement('p'); location.className = 'card-place'; location.textContent = place.place;
      const title = document.createElement('button'); title.className = 'card-title card-title-button'; title.type = 'button'; title.textContent = place.name; title.addEventListener('click', () => openPlace(place));
      const description = document.createElement('p'); description.className = 'card-description'; description.textContent = place.description;
      const actions = document.createElement('div'); actions.className = 'card-actions';
      const read = document.createElement('button'); read.className = 'card-details'; read.type = 'button'; read.textContent = 'Read place notes'; read.addEventListener('click', () => openPlace(place));
      const add = document.createElement('button'); add.className = 'card-details'; add.type = 'button'; add.textContent = selectedIds.includes(idOf(place)) ? 'Added · remove' : 'Add to journey +';
      add.setAttribute('aria-pressed', String(selectedIds.includes(idOf(place))));
      add.addEventListener('click', () => toggleSelected(place));
      actions.append(read, add); copy.append(location, title, description, actions); card.append(image, copy); return card;
    }));
    document.querySelector('#show-more').hidden = found.length <= limit;
    document.querySelectorAll('[data-map-region]').forEach(node => node.classList.toggle('is-current', node.dataset.mapRegion === activeRegion));
  }

  function renderFilters() {
    regionFilters.replaceChildren(...regions.map(region => {
      const button = document.createElement('button'); button.className = 'filter-button'; button.type = 'button'; button.textContent = region;
      button.setAttribute('aria-pressed', String(region === activeRegion));
      button.addEventListener('click', () => updateSpotlight(region)); return button;
    }));
    moodFilters.replaceChildren(...moods.map(mood => {
      const button = document.createElement('button'); button.className = 'mood-button'; button.type = 'button'; button.textContent = mood;
      button.setAttribute('aria-pressed', String(mood === activeMood));
      button.addEventListener('click', () => { activeMood = mood; renderFilters(); renderCards(); }); return button;
    }));
  }

  function updateSpotlight(region) {
    activeRegion = region;
    const matches = region === 'All places' ? places : places.filter(place => place.region === region);
    spotlight.name.textContent = region === 'All places' ? 'Choose an island group' : region;
    spotlight.count.textContent = region === 'All places' ? 'Your starting point' : `${matches.length} places in this island group`;
    spotlight.copy.textContent = region === 'All places'
      ? 'Three broad regions, thousands of distinct islands. Pick a marker or choose a place to start.'
      : matches[0]?.description || 'Browse the places in this island group.';
    spotlight.picks.replaceChildren(...matches.slice(0, 3).map(place => {
      const button = document.createElement('button'); button.className = 'region-pick'; button.type = 'button';
      const placeName = document.createElement('span'); placeName.textContent = place.place;
      const name = document.createElement('b'); name.textContent = place.name;
      button.append(placeName, name); button.addEventListener('click', () => openPlace(place)); return button;
    }));
    renderFilters(); renderCards();
  }

  function mapUrl(place) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.place}, Philippines`)}`;
  }

  function openPlace(place) {
    dialogTrigger = document.activeElement;
    dialogPlace = place;
    const id = idOf(place);
    dialogImage.src = `https://images.unsplash.com/${place.image}?auto=format&fit=crop&w=1300&q=86`;
    dialogImage.alt = place.alt || `${place.name}, ${place.place}`;
    dialog.querySelector('#place-dialog-number').textContent = String(places.indexOf(place) + 1).padStart(2, '0');
    dialog.querySelector('#place-dialog-region').textContent = `${place.region} / PHILIPPINES FIELD GUIDE`;
    dialog.querySelector('#place-dialog-title').textContent = place.name;
    dialog.querySelector('#place-dialog-location').textContent = place.place;
    dialog.querySelector('#place-dialog-description').textContent = place.description;
    dialog.querySelector('#place-dialog-story').textContent = place.story || place.description;
    dialog.querySelector('#place-dialog-care').textContent = place.visitNote || 'Follow local guidance, respect the people and habitats that make this place home, and verify current access before travelling.';
    const season = dialog.querySelector('#place-dialog-season');
    season.textContent = Array.isArray(place.months) && place.months.length
      ? `Seasonal idea: the guide flags ${place.months.map(month => MONTHS[month - 1]).join(', ')}. Conditions vary; check local visitor information before travelling.`
      : 'No month-specific season is recorded in this preview. Check local visitor information before travelling.';
    const tags = dialog.querySelector('#place-dialog-tags');
    tags.replaceChildren(...place.tags.map(tag => { const item = document.createElement('span'); item.textContent = tag; return item; }));
    const map = dialog.querySelector('#place-dialog-map'); map.href = mapUrl(place);
    const guide = dialog.querySelector('#place-dialog-guide'); guide.href = place.official || 'https://philippines.travel/destinations/';
    const save = dialog.querySelector('#place-dialog-save'); save.textContent = savedIds.has(id) ? '♥ Saved on this device' : '♡ Save this place';
    save.setAttribute('aria-pressed', String(savedIds.has(id)));
    dialog.querySelector('#place-dialog-add-itinerary').textContent = selectedIds.includes(id) ? 'Remove from journey −' : 'Add to journey +';
    if (!dialog.open) dialog.showModal();
  }

  function closePlace() {
    if (dialog.open) dialog.close();
    if (dialogTrigger?.isConnected) dialogTrigger.focus();
  }
  dialog.querySelector('#place-dialog-close').addEventListener('click', closePlace);
  dialog.addEventListener('click', event => { if (event.target === dialog) closePlace(); });
  dialog.addEventListener('close', () => { if (dialogTrigger?.isConnected) dialogTrigger.focus(); });
  dialog.querySelector('#place-dialog-save').addEventListener('click', () => {
    if (!dialogPlace) return;
    const id = idOf(dialogPlace);
    if (savedIds.has(id)) savedIds.delete(id); else savedIds.add(id);
    dialog.querySelector('#place-dialog-save').textContent = savedIds.has(id) ? '♥ Saved on this device' : '♡ Save this place';
    dialog.querySelector('#place-dialog-save').setAttribute('aria-pressed', String(savedIds.has(id)));
    saveDraft();
  });
  dialog.querySelector('#place-dialog-add-itinerary').addEventListener('click', () => { if (dialogPlace) toggleSelected(dialogPlace); });

  function collectConfig() {
    return {
      startDate: document.querySelector('#itinerary-start-date').value,
      days: Number(document.querySelector('#itinerary-days').value),
      origin: document.querySelector('#itinerary-origin').value.trim().slice(0, 100),
      endpoint: document.querySelector('#itinerary-endpoint').value.trim().slice(0, 100),
      pace: document.querySelector('#itinerary-pace').value,
      regions: [...regionRoot.querySelectorAll('input:checked')].map(input => input.value),
      interests: [...interestRoot.querySelectorAll('input:checked')].map(input => input.value)
    };
  }

  function validConfig(config) {
    const dateParts = config && /^(\d{4})-(\d{2})-(\d{2})$/.exec(config.startDate);
    const parsed = dateParts ? new Date(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3])) : null;
    return config && parsed && parsed.getFullYear() === Number(dateParts[1]) && parsed.getMonth() === Number(dateParts[2]) - 1 && parsed.getDate() === Number(dateParts[3]) && Number.isInteger(config.days) && config.days >= 1 && config.days <= 21 &&
      ['relaxed','balanced','active'].includes(config.pace) && typeof config.origin === 'string' && config.origin.length <= 100 &&
      typeof config.endpoint === 'string' && config.endpoint.length <= 100 && Array.isArray(config.regions) && config.regions.every(value => regions.slice(1).includes(value)) &&
      Array.isArray(config.interests) && config.interests.every(value => INTERESTS.includes(value));
  }

  function validDraft(value) {
    if (!value || value.v !== 2 || !validConfig(value.config) || !Array.isArray(value.selected) || value.selected.length > places.length ||
      !value.selected.every(id => placeById.has(id)) || new Set(value.selected).size !== value.selected.length || !Array.isArray(value.stops) || (value.stops.length !== 0 && value.stops.length !== value.config.days) ||
      !value.stops.every(id => id === null || placeById.has(id))) return null;
    return { config: value.config, selected: value.selected, stops: value.stops };
  }

  function applyConfig(config) {
    document.querySelector('#itinerary-start-date').value = config.startDate;
    document.querySelector('#itinerary-days').value = String(config.days);
    document.querySelector('#itinerary-origin').value = config.origin;
    document.querySelector('#itinerary-endpoint').value = config.endpoint;
    document.querySelector('#itinerary-pace').value = config.pace;
    regionRoot.querySelectorAll('input').forEach(input => { input.checked = config.regions.includes(input.value); });
    interestRoot.querySelectorAll('input').forEach(input => { input.checked = config.interests.includes(input.value); });
  }

  function collectDraft() {
    if (!draft) return null;
    return { v: 2, config: draft.config, selected: [...selectedIds], stops: [...draft.stops] };
  }

  function saveDraft(announce = false) {
    const value = collectDraft() || { v: 2, config: collectConfig(), selected: [...selectedIds], stops: [] };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      localStorage.setItem(SAVED_KEY, JSON.stringify([...savedIds]));
    } catch { /* Storage can be unavailable; current page remains usable. */ }
    if (announce) status.textContent = 'Your trip draft and saved places are stored on this device.';
  }

  function renderShortlist() {
    shortlistRoot.hidden = selectedIds.length === 0;
    shortlistRoot.replaceChildren();
    if (!selectedIds.length) return;
    const heading = document.createElement('p'); heading.className = 'itinerary-shortlist-title'; heading.textContent = `${selectedIds.length} selected place${selectedIds.length === 1 ? '' : 's'}`;
    shortlistRoot.append(heading);
    selectedIds.forEach(id => {
      const place = placeById.get(id); if (!place) return;
      const row = document.createElement('div'); row.className = 'itinerary-shortlist-item';
      const name = document.createElement('span'); name.textContent = `${place.name} · ${place.region}`;
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', `Remove ${place.name} from the trip shortlist`);
      remove.addEventListener('click', () => toggleSelected(place)); row.append(name, remove); shortlistRoot.append(row);
    });
  }

  function toggleSelected(place) {
    const id = idOf(place);
    selectedIds = selectedIds.includes(id) ? selectedIds.filter(item => item !== id) : [...selectedIds, id];
    renderShortlist(); renderCards();
    if (dialog.open && dialogPlace) dialog.querySelector('#place-dialog-add-itinerary').textContent = selectedIds.includes(idOf(dialogPlace)) ? 'Remove from journey −' : 'Add to journey +';
    document.querySelector('#itinerary-preset-status').textContent = selectedIds.includes(id) ? `${place.name} added to your trip shortlist.` : `${place.name} removed from your trip shortlist.`;
    saveDraft();
  }

  function makeStopSelect(selectedId, dayIndex, candidates) {
    const label = document.createElement('label'); label.className = 'itinerary-day-edit'; label.textContent = 'Place for this day';
    const select = document.createElement('select'); select.setAttribute('aria-label', `Place for day ${dayIndex + 1}`);
    const blank = document.createElement('option'); blank.value = ''; blank.textContent = 'Choose a place'; select.append(blank);
    candidates.forEach(place => { const option = document.createElement('option'); option.value = idOf(place); option.textContent = `${place.name} · ${place.region}`; select.append(option); });
    select.value = selectedId || '';
    select.addEventListener('change', () => { draft.stops[dayIndex] = select.value || null; renderDraft(); saveDraft(); });
    label.append(select); return label;
  }

  function renderDraft() {
    if (!draft) { output.hidden = true; tools.hidden = true; return; }
    const candidates = draft.candidates.map(id => placeById.get(id)).filter(Boolean);
    output.hidden = false; tools.hidden = false; output.replaceChildren();
    let previousRegion = '';
    draft.stops.forEach((id, index) => {
      const place = id ? placeById.get(id) : null;
      const article = document.createElement('article'); article.className = 'itinerary-day';
      const heading = document.createElement('h3'); heading.textContent = `Day ${index + 1}`;
      const date = new Date(`${draft.config.startDate}T00:00:00`); date.setDate(date.getDate() + index);
      const dateLabel = document.createElement('p'); dateLabel.className = 'itinerary-day-date';
      dateLabel.textContent = `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      article.append(heading, dateLabel);
      if (place && previousRegion && place.region !== previousRegion) {
        const transfer = document.createElement('p'); transfer.className = 'itinerary-transfer-note';
        transfer.textContent = `Island-group change: ${previousRegion} → ${place.region}. Research current flights, ferries and local transfers before setting this day.`;
        article.append(transfer);
      }
      if (place) {
        const name = document.createElement('p'); name.className = 'itinerary-day-place'; name.textContent = place.name;
        const area = document.createElement('p'); area.textContent = place.place;
        const description = document.createElement('p'); description.textContent = place.description;
        article.append(name, area, description); previousRegion = place.region;
      } else {
        const empty = document.createElement('p'); empty.className = 'itinerary-day-empty';
        empty.textContent = candidates.length ? 'No stop selected for this day.' : 'No destinations match these choices yet. Select another island group or add a place from the field guide.';
        article.append(empty);
      }
      article.append(makeStopSelect(id, index, candidates)); output.append(article);
    });
    if (draft.config.origin || draft.config.endpoint) {
      const endpoints = document.createElement('p'); endpoints.className = 'itinerary-form-note';
      endpoints.textContent = `Start: ${draft.config.origin || 'not set'} · Finish: ${draft.config.endpoint || 'not set'}. This draft does not calculate route or transfer times.`;
      output.prepend(endpoints);
    }
  }

  function buildDraft() {
    const config = collectConfig();
    const selectedPlaces = selectedIds.map(id => placeById.get(id)).filter(Boolean);
    let candidates = selectedPlaces.length
      ? selectedPlaces
      : places.filter(place => !config.regions.length || config.regions.includes(place.region));
    if (config.interests.length) {
      const matches = candidates.filter(place => place.tags.some(tag => config.interests.includes(tag)));
      if (matches.length) candidates = matches;
    }
    candidates = [...new Map(candidates.map(place => [idOf(place), place])).values()];
    const existing = draft && draft.config.days === config.days ? draft.stops : [];
    const stops = Array.from({ length: config.days }, (_, index) => {
      const prior = existing[index];
      return prior && candidates.some(place => idOf(place) === prior) ? prior : candidates[index] ? idOf(candidates[index]) : null;
    });
    draft = { config, stops, candidates: candidates.map(idOf) };
    renderDraft(); status.textContent = `A ${config.days}-day editable draft is ready. No place is repeated.`;
    saveDraft();
  }

  function makeChoice(value, root) {
    const label = document.createElement('label'); label.className = 'itinerary-chip';
    const input = document.createElement('input'); input.type = 'checkbox'; input.value = value; input.name = root.id;
    const text = document.createElement('span'); text.textContent = value; label.append(input, text); root.append(label);
  }
  regions.slice(1).forEach(value => makeChoice(value, regionRoot));
  INTERESTS.forEach(value => makeChoice(value, interestRoot));

  document.querySelectorAll('[data-itinerary-preset]').forEach(button => button.addEventListener('click', () => {
    const preset = button.dataset.itineraryPreset;
    const region = preset === 'north' ? 'Luzon' : preset === 'islands' ? 'Visayas' : preset === 'south' ? 'Mindanao' : '';
    document.querySelector('#itinerary-days').value = String(preset === 'north' ? 5 : preset === 'south' ? 6 : preset === 'slow' ? 8 : 7);
    regionRoot.querySelectorAll('input').forEach(input => { input.checked = region ? input.value === region : false; });
    document.querySelectorAll('[data-itinerary-preset]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('#itinerary-preset-status').textContent = `${button.querySelector('strong').textContent} selected. Choose dates, interests and places, then make your draft.`;
  }));

  form.addEventListener('submit', event => { event.preventDefault(); if (form.reportValidity()) buildDraft(); });
  search.addEventListener('input', () => { limit = 12; renderCards(); });
  document.querySelector('#show-more').addEventListener('click', () => { limit += 12; renderCards(); });
  document.querySelectorAll('[data-map-region]').forEach(node => node.addEventListener('click', event => {
    if (node.tagName === 'A') event.preventDefault();
    updateSpotlight(node.dataset.mapRegion);
    document.querySelector('#destinations').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }));

  function bytesToBase64Url(bytes) {
    let binary = '';
    for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  function base64UrlToBytes(token) {
    if (!/^[A-Za-z0-9_-]+$/.test(token)) return null;
    try {
      const base64 = token.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - token.length % 4) % 4);
      return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    } catch { return null; }
  }
  function shareDraft() {
    const value = collectDraft() || validDraft({ v: 2, config: collectConfig(), selected: selectedIds, stops: [] });
    if (!value) { status.textContent = 'Build a trip draft before sharing it.'; return; }
    if (!value.stops.length) value.stops = Array.from({ length: value.config.days }, () => null);
    const token = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
    if (token.length > 6000) { status.textContent = 'This draft is too large for a share link. Remove some saved places and try again.'; return; }
    const url = new URL(location.href); url.hash = `trip=${token}`;
    const field = document.createElement('input'); field.className = 'itinerary-share-url'; field.type = 'url'; field.readOnly = true; field.value = url.href; field.setAttribute('aria-label', 'Shareable trip link');
    const prior = tools.querySelector('.itinerary-share-url'); prior?.remove(); status.after(field); field.select();
    navigator.clipboard?.writeText(url.href).then(() => { status.textContent = 'Share link copied. It contains the trip details in the link.'; }).catch(() => { status.textContent = 'Copy this share link to send your trip draft.'; });
  }
  function importSharedDraft() {
    const match = /^#trip=([^&]+)$/.exec(location.hash);
    if (!match || match[1].length > 6000) return null;
    const bytes = base64UrlToBytes(match[1]); if (!bytes) return null;
    try { return validDraft(JSON.parse(new TextDecoder().decode(bytes))); } catch { return null; }
  }

  document.querySelector('#itinerary-save').addEventListener('click', () => saveDraft(true));
  document.querySelector('#itinerary-share').addEventListener('click', shareDraft);
  document.querySelector('#itinerary-print').addEventListener('click', () => window.print());
  document.querySelector('#itinerary-clear').addEventListener('click', () => {
    draft = null; selectedIds = [];
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Ignore unavailable storage. */ }
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    renderShortlist(); renderCards(); output.replaceChildren(); output.hidden = true; tools.hidden = true;
    document.querySelector('#itinerary-preset-status').textContent = 'Trip draft cleared.';
  });

  document.querySelector('.menu-toggle').addEventListener('click', event => {
    const button = event.currentTarget; const menu = document.querySelector('#mobile-nav'); menu.hidden = !menu.hidden;
    button.setAttribute('aria-expanded', String(!menu.hidden)); button.setAttribute('aria-label', menu.hidden ? 'Open navigation' : 'Close navigation');
  });
  document.querySelector('#mobile-nav').addEventListener('click', event => {
    if (event.target.closest('a')) { document.querySelector('#mobile-nav').hidden = true; document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false'); }
  });

  document.querySelector('#itinerary-start-date').value = today();
  try {
    const storedSaved = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    if (Array.isArray(storedSaved)) savedIds = new Set(storedSaved.filter(id => placeById.has(id)));
  } catch { savedIds = new Set(); }
  const validShared = importSharedDraft();
  let initial = validShared;
  if (!initial) {
    try { initial = validDraft(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')); } catch { initial = null; }
  }
  if (initial) {
    applyConfig(initial.config); selectedIds = [...initial.selected];
    const candidates = selectedIds.length ? selectedIds : places.filter(place => !initial.config.regions.length || initial.config.regions.includes(place.region)).map(idOf);
    draft = initial.stops.length ? { config: initial.config, stops: [...initial.stops], candidates } : null;
    renderDraft();
    if (validShared) status.textContent = 'Shared trip draft loaded. Choose different places or save your own copy.';
  }
  renderShortlist(); renderFilters(); updateSpotlight('All places');
})();
