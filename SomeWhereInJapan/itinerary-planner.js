(function () {
  'use strict';
  const core = window.JapanItineraryCore;
  const form = document.querySelector('#itinerary-form');
  if (!core || !form) return;

  const STORAGE_KEY = 'somewhere-japan-itinerary-v1';
  const output = document.querySelector('#itinerary-days-output');
  const tools = document.querySelector('#itinerary-result-tools');
  const status = document.querySelector('#itinerary-status');
  const regionRoot = document.querySelector('#itinerary-regions');
  const interestRoot = document.querySelector('#itinerary-interests');
  const places = typeof DESTINATIONS !== 'undefined' && Array.isArray(DESTINATIONS) ? DESTINATIONS : [];
  let mapLocationsPromise = null;
  function destinationsWithMapLocations() {
    if (!mapLocationsPromise) {
      mapLocationsPromise = fetch('data/destination-map-locations.json?v=20261025-1')
        .then(response => { if (!response.ok) throw new Error('Map locations unavailable'); return response.json(); })
        .then(data => {
          const records = data?.records || {};
          return places.map(place => {
            const id = window.GuideLinks?.destinationIdForName?.(place.name) || place.id || place.slug;
            return { ...place, mapLocation: id ? records[id] || null : null };
          });
        });
    }
    return mapLocationsPromise;
  }
  const regions = ['Hokkaido','Tohoku','Kanto','Chubu','Kansai','Chugoku','Shikoku','Kyushu','Okinawa'];
  const interests = ['Culture','Nature','Food','Islands','Slow travel'];
  let currentPlan = null;
  let currentConfig = null;

  function makeChoice(value, name, groupName) {
    const label = document.createElement('label');
    label.className = 'itinerary-chip';
    const input = document.createElement('input');
    input.type = 'checkbox'; input.value = value; input.name = groupName;
    const text = document.createElement('span'); text.textContent = name;
    label.append(input, text);
    return label;
  }
  regionRoot.replaceChildren(...regions.map(region => makeChoice(region, region, 'regions')));
  interestRoot.replaceChildren(...interests.map(interest => makeChoice(interest, interest, 'interests')));

  function localDateValue(date) {
    const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return `${local.getFullYear()}-${String(local.getMonth()+1).padStart(2,'0')}-${String(local.getDate()).padStart(2,'0')}`;
  }
  const dateField = document.querySelector('#itinerary-start-date');
  dateField.value = localDateValue(new Date());

  function readSavedPlaces() {
    try {
      const saved = JSON.parse(localStorage.getItem('somewhere-japan-saved') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch { return []; }
  }
  function selectedValues(root) {
    return [...root.querySelectorAll('input:checked')].map(input => input.value);
  }
  function getConfig() {
    const data = new FormData(form);
    return {
      startDate: String(data.get('startDate') || ''),
      days: Math.max(1, Math.min(21, Number(data.get('days')) || 7)),
      origin: String(data.get('origin') || '').trim(),
      endpoint: String(data.get('endpoint') || '').trim(),
      pace: String(data.get('pace') || 'balanced'),
      regions: selectedValues(regionRoot),
      interests: selectedValues(interestRoot)
    };
  }
  function placeLocation(place) {
    return String(place.mapLocation?.locator || place.place || `${place.region}, Japan`).trim();
  }
  function directionsLocation(place) {
    const mapLocation = place.mapLocation;
    const latitude = Number(mapLocation?.latitude);
    const longitude = Number(mapLocation?.longitude);
    if (mapLocation?.precision === 'destination' && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return `${latitude},${longitude}`;
    }
    const area = mapLocation?.locator || place.place || place.region || 'Japan';
    return `${place.name}, ${area}, Japan`;
  }
  function directionsBetweenUrl(origin, destination) {
    const params = new URLSearchParams({ api: '1', destination, travelmode: 'transit' });
    if (origin) params.set('origin', origin);
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }
  function directionsUrl(origin, place) {
    return directionsBetweenUrl(origin, directionsLocation(place));
  }
  function placeMapUrl(place) {
    const params = new URLSearchParams({ api: '1', query: directionsLocation(place) });
    return `https://www.google.com/maps/search/?${params.toString()}`;
  }
  function appendLink(parent, label, href) {
    if (!href) return;
    const link = document.createElement('a');
    link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = label;
    parent.append(link);
  }
  function createStop(place, dayIndex, stopIndex) {
    const card = document.createElement('article');
    card.className = 'itinerary-stop';
    const number = document.createElement('span'); number.className = 'itinerary-stop-number'; number.textContent = String(stopIndex + 1).padStart(2, '0');
    const body = document.createElement('div'); body.className = 'itinerary-stop-body';
    const heading = document.createElement('h4'); heading.textContent = place.name;
    const location = document.createElement('p'); location.className = 'itinerary-stop-location'; location.textContent = placeLocation(place);
    const description = document.createElement('p'); description.className = 'itinerary-stop-description'; description.textContent = place.description || 'Explore the place guide for visitor information.';
    const actions = document.createElement('div'); actions.className = 'itinerary-stop-actions';
    const guide = window.GuideLinks?.destinationUrl?.(place.name);
    if (guide) appendLink(actions, 'Place guide ↗', guide);
    const dayDate = currentPlan.days[dayIndex].date;
    const eventWindows = place.eventDates || place.eventWindows;
    const eventWindow = Array.isArray(eventWindows) ? eventWindows.find(window => window?.start <= dayDate && dayDate <= window?.end) : null;
    if (eventWindow?.source) appendLink(actions, 'Verified event dates ↗', eventWindow.source);
    const controls = document.createElement('div'); controls.className = 'itinerary-stop-controls';
    const up = document.createElement('button'); up.type = 'button'; up.textContent = 'Move up'; up.disabled = stopIndex === 0; up.setAttribute('aria-label', `Move ${place.name} earlier`);
    up.addEventListener('click', () => { currentPlan = core.moveStop(currentPlan, core.placeKey(place), dayIndex, dayIndex, stopIndex - 1); renderPlan(); });
    const down = document.createElement('button'); down.type = 'button'; down.textContent = 'Move down'; down.disabled = stopIndex === currentPlan.days[dayIndex].places.length - 1; down.setAttribute('aria-label', `Move ${place.name} later`);
    down.addEventListener('click', () => { currentPlan = core.moveStop(currentPlan, core.placeKey(place), dayIndex, dayIndex, stopIndex + 1); renderPlan(); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', `Remove ${place.name} from Day ${dayIndex + 1}`);
    remove.addEventListener('click', () => { currentPlan = core.removeStop(currentPlan, dayIndex, core.placeKey(place)); renderPlan(); });
    controls.append(up, down, remove);
      const month = Number(currentPlan.days[dayIndex].date.slice(5,7));
    const seasonal = place.monthReasons?.[month] || (Array.isArray(place.months) && place.months.includes(month) ? place.seasonReason : '');
    if (seasonal) { const note = document.createElement('p'); note.className = 'itinerary-season-note'; note.textContent = `Seasonal note: ${seasonal}`; body.append(note); }
    body.prepend(heading, location, description); body.append(actions, controls); card.append(number, body);
    return card;
  }
  function makeAddControl(day, dayIndex) {
    const wrapper = document.createElement('div'); wrapper.className = 'itinerary-add-stop';
    const label = document.createElement('label'); label.textContent = 'ADD A PLACE FROM THE GUIDE';
    const select = document.createElement('select'); select.setAttribute('aria-label', `Choose a place to add to Day ${dayIndex + 1}`);
    const empty = document.createElement('option'); empty.value = ''; empty.textContent = 'Choose a place'; select.append(empty);
    const used = new Set(currentPlan.days.flatMap(item => item.places.map(core.placeKey)));
    const candidates = places.filter(place => !used.has(core.placeKey(place)) && (!day.region || place.region === day.region));
    candidates.sort((a,b)=>String(a.name).localeCompare(String(b.name))).forEach(place => {
      const option = document.createElement('option'); option.value = core.placeKey(place); option.textContent = place.name; select.append(option);
    });
    const add = document.createElement('button'); add.type = 'button'; add.textContent = 'Add place'; add.disabled = !candidates.length;
    add.addEventListener('click', () => {
      const place = candidates.find(item => core.placeKey(item) === select.value);
      if (!place) return;
      day.places.push(place); if (!day.region) day.region = place.region; renderPlan();
    });
    label.append(select); wrapper.append(label, add);
    if (!candidates.length) { const note = document.createElement('small'); note.textContent = 'No unused places remain in this day’s region. Adjust the region choices above and rebuild to add places from another area.'; wrapper.append(note); }
    return wrapper;
  }
  function createDayDirections(day, dayIndex) {
    if (!day.places.length) return null;
    if (typeof day.navigationStart !== 'string') day.navigationStart = dayIndex === 0 ? (currentConfig.origin || '') : '';
    const section = document.createElement('section');
    section.className = 'itinerary-day-route';
    section.setAttribute('aria-label', 'Route steps for Day ' + (dayIndex + 1));
    const heading = document.createElement('h4');
    heading.textContent = 'Day route';
    const note = document.createElement('p');
    note.className = 'itinerary-day-route-note';
    note.textContent = 'Follow the numbered steps. Google Maps gives live directions for each leg; the stop order stays as shown.';
    const startLabel = document.createElement('label');
    startLabel.className = 'itinerary-day-start';
    const startCaption = document.createElement('span');
    startCaption.textContent = 'START THIS DAY FROM';
    const startInput = document.createElement('input');
    startInput.type = 'text';
    startInput.maxLength = 100;
    startInput.placeholder = 'Hotel, station, or address';
    startInput.setAttribute('aria-label', 'Starting point for Day ' + (dayIndex + 1));
    startInput.value = day.navigationStart;
    startLabel.append(startCaption, startInput);
    const list = document.createElement('ol');
    list.className = 'itinerary-route-steps';
    const first = day.places[0];
    const firstStep = document.createElement('li');
    firstStep.className = 'itinerary-route-step';
    const firstNumber = document.createElement('span');
    firstNumber.className = 'itinerary-route-step-number';
    firstNumber.textContent = '01';
    const firstBody = document.createElement('div');
    firstBody.className = 'itinerary-route-step-body';
    const firstTitle = document.createElement('strong');
    const firstHint = document.createElement('span');
    firstHint.className = 'itinerary-route-step-hint';
    const firstLink = document.createElement('a');
    firstLink.className = 'itinerary-route-button';
    firstLink.target = '_blank';
    firstLink.rel = 'noopener noreferrer';
    firstBody.append(firstTitle, firstHint, firstLink);
    firstStep.append(firstNumber, firstBody);
    list.append(firstStep);
    function refreshFirstStep() {
      const origin = day.navigationStart.trim();
      firstTitle.textContent = origin ? origin + ' → ' + first.name : 'Get to ' + first.name;
      firstHint.textContent = origin ? 'Live public transport directions' : 'Add a hotel, station, or address above for directions to this stop.';
      firstLink.href = origin ? directionsUrl(origin, first) : placeMapUrl(first);
      firstLink.textContent = origin ? 'Get directions in Google Maps ↗' : 'View this stop on the map ↗';
      firstLink.setAttribute('aria-label', origin ? 'Get public transport directions from ' + origin + ' to ' + first.name + ' in Google Maps' : 'View ' + first.name + ' on the map');
    }
    startInput.addEventListener('input', () => {
      day.navigationStart = startInput.value;
      refreshFirstStep();
    });
    refreshFirstStep();
    day.places.slice(1).forEach((place, index) => {
      const previous = day.places[index];
      const stepNumber = index + 2;
      const step = document.createElement('li');
      step.className = 'itinerary-route-step';
      const number = document.createElement('span');
      number.className = 'itinerary-route-step-number';
      number.textContent = String(stepNumber).padStart(2, '0');
      const body = document.createElement('div');
      body.className = 'itinerary-route-step-body';
      const title = document.createElement('strong');
      title.textContent = previous.name + ' → ' + place.name;
      const hint = document.createElement('span');
      hint.className = 'itinerary-route-step-hint';
      hint.textContent = 'Continue from stop ' + (stepNumber - 1);
      const link = document.createElement('a');
      link.className = 'itinerary-route-button';
      link.href = directionsUrl(directionsLocation(previous), place);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Get directions in Google Maps ↗';
      link.setAttribute('aria-label', 'Get public transport directions from ' + previous.name + ' to ' + place.name + ' in Google Maps');
      body.append(title, hint, link);
      step.append(number, body);
      list.append(step);
    });
    if (currentConfig.endpoint && dayIndex === currentPlan.days.length - 1) {
      const last = day.places.at(-1);
      const stepNumber = day.places.length + 1;
      const step = document.createElement('li');
      step.className = 'itinerary-route-step';
      const number = document.createElement('span');
      number.className = 'itinerary-route-step-number';
      number.textContent = String(stepNumber).padStart(2, '0');
      const body = document.createElement('div');
      body.className = 'itinerary-route-step-body';
      const title = document.createElement('strong');
      title.textContent = last.name + ' → ' + currentConfig.endpoint;
      const hint = document.createElement('span');
      hint.className = 'itinerary-route-step-hint';
      hint.textContent = 'Finish your day';
      const link = document.createElement('a');
      link.className = 'itinerary-route-button';
      link.href = directionsBetweenUrl(directionsLocation(last), currentConfig.endpoint);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Get directions in Google Maps ↗';
      link.setAttribute('aria-label', 'Get directions from ' + last.name + ' to ' + currentConfig.endpoint + ' in Google Maps');
      body.append(title, hint, link);
      step.append(number, body);
      list.append(step);
    }
    section.append(heading, note, startLabel, list);
    return section;
  }
  function renderPlan() {
    output.replaceChildren();
    if (!currentPlan || !Array.isArray(currentPlan.days) || !currentPlan.days.length) { output.hidden = true; tools.hidden = true; return; }
    output.hidden = false; tools.hidden = false;
    const placesCount = currentPlan.days.reduce((total, day) => total + day.places.length, 0);
    status.textContent = `${currentPlan.days.length} days · ${placesCount} suggested places · edit the order to suit your trip.`;
    currentPlan.notes.forEach(text => { const note = document.createElement('p'); note.className = 'itinerary-caveat'; note.textContent = text; output.append(note); });
    currentPlan.days.forEach((day,index) => {
      const card = document.createElement('article'); card.className = 'itinerary-day';
      const header = document.createElement('header');
      const title = document.createElement('h3'); title.textContent = `Day ${index + 1}`;
      const date = document.createElement('time'); date.dateTime = day.date;
      const parsed = new Date(`${day.date}T12:00:00`);
      date.textContent = parsed.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});
      const region = document.createElement('span'); region.className = 'itinerary-day-region'; region.textContent = day.region || 'All Japan';
      header.append(title,date,region); card.append(header);
      const priorRegion = currentPlan.days[index - 1]?.region;
      if (priorRegion && day.region && priorRegion !== day.region && !day.note?.startsWith('Travel day:')) { const transition = document.createElement('p'); transition.className = 'itinerary-transition'; transition.textContent = `Region change from ${priorRegion} to ${day.region}. Plan this inter-city connection separately; this draft has no transfer time or fare.`; card.append(transition); }
      if (day.transitionNote) { const transition = document.createElement('p'); transition.className = 'itinerary-transition'; transition.textContent = day.transitionNote; card.append(transition); }
      if (day.note) { const empty = document.createElement('p'); empty.className = 'itinerary-empty-day'; empty.textContent = day.note; card.append(empty); }
      const dayDirections = createDayDirections(day, index);
      if (dayDirections) card.append(dayDirections);
      day.places.forEach((place,stopIndex)=>card.append(createStop(place,index,stopIndex)));
      card.append(makeAddControl(day,index)); output.append(card);
    });
    const last = document.createElement('div'); last.className = 'itinerary-endpoint-note';
    const finalStops = currentPlan.days.flatMap(day => day.places);
    if (currentConfig.endpoint) {
      const finish = document.createElement('p'); finish.textContent = `Finish: ${currentConfig.endpoint}. Check this final connection with live directions.`; last.append(finish);
    } else {
      const reminder = document.createElement('p'); reminder.textContent = 'Add an end point above if you want a reminder for your final transfer.'; last.append(reminder);
    }
    output.append(last);
  }
  function persistPlan() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ config: currentConfig, plan: currentPlan }));
      status.textContent = 'Itinerary saved on this device.';
    } catch { status.textContent = 'Could not save in this browser. Your current draft remains available until you close or reload this page.'; }
  }
  function formatPlanText() {
    return currentPlan.days.map((day,index)=>`${day.date} · ${day.region || 'Japan'}\n${day.places.map((place,i)=>`${i+1}. ${place.name} — ${placeLocation(place)}`).join('\n') || 'No places selected'}`).join('\n\n') + '\n\nCheck current transport, access and opening information before travelling.';
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    currentConfig = getConfig();
    status.textContent = 'Grouping nearby places…';
    try {
      const mappedPlaces = await destinationsWithMapLocations();
      currentPlan = core.buildItinerary({ destinations: mappedPlaces, ...currentConfig, savedIds: readSavedPlaces() });
    } catch {
      currentPlan = core.buildItinerary({ destinations: places, ...currentConfig, savedIds: readSavedPlaces() });
      currentPlan.notes.unshift('Map locations could not be loaded, so stops are grouped by area name only. Reconnect and rebuild for geographic clustering.');
    }
    renderPlan();
    if (!currentPlan.days.length) status.textContent = currentPlan.notes[0] || 'No itinerary could be created.';
    output.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  document.querySelector('#itinerary-save').addEventListener('click', persistPlan);
  document.querySelector('#itinerary-print').addEventListener('click', () => window.print());
  document.querySelector('#itinerary-share').addEventListener('click', async () => {
    const text = formatPlanText();
    try {
      if (navigator.share) await navigator.share({ title: 'My Japan itinerary', text });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); status.textContent = 'Itinerary copied to clipboard.'; }
      else status.textContent = 'Sharing is not supported in this browser. Use Print to save a copy.';
    } catch (error) { if (error?.name !== 'AbortError') status.textContent = 'Could not share from this browser. Use Print to save a copy.'; }
  });
  document.querySelector('#itinerary-clear').addEventListener('click', () => {
    currentPlan = null; currentConfig = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Current session can still be cleared. */ }
    output.replaceChildren(); output.hidden = true; tools.hidden = true;
    status.textContent = 'Draft cleared.';
  });

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (stored?.plan?.days?.length && stored.config) {
      currentPlan = stored.plan; currentConfig = stored.config;
      for (const [name,value] of Object.entries({startDate:currentConfig.startDate,days:currentConfig.days,origin:currentConfig.origin,endpoint:currentConfig.endpoint,pace:currentConfig.pace})) {
        const control = form.elements.namedItem(name); if (control && value != null) control.value = value;
      }
      currentConfig.regions?.forEach(value=>{const input=regionRoot.querySelector(`input[value="${CSS.escape(value)}"]`);if(input)input.checked=true;});
      currentConfig.interests?.forEach(value=>{const input=interestRoot.querySelector(`input[value="${CSS.escape(value)}"]`);if(input)input.checked=true;});
      renderPlan(); status.textContent = 'Your saved itinerary was restored from this device.';
    }
  } catch { /* Corrupt or unavailable storage should not block a new draft. */ }
})();
