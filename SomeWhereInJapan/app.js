const grid = document.querySelector('#destination-grid');
const filters = document.querySelector('#region-filters');
const moodFilters = document.querySelector('#mood-filters');
const count = document.querySelector('#result-count');
const search = document.querySelector('#place-search');
const savedToggle = document.querySelector('#saved-toggle');
const savedCount = document.querySelector('#saved-count');
const savedNote = document.querySelector('#saved-note');
const placeDialog = document.querySelector('#place-dialog');
let activeRegion = 'All places';
let savedOnly = false;
let query = '';
let activeMood = 'All moods';
let visibleLimit = 12;
const saved = new Set(readSaved());

function readSaved() {
  try { return JSON.parse(localStorage.getItem('somewhere-japan-saved') || '[]'); }
  catch { return []; }
}

function persistSaved() {
  try { localStorage.setItem('somewhere-japan-saved', JSON.stringify([...saved])); }
  catch { /* Keep the current session usable if storage is unavailable. */ }
}

function renderFilters() {
  filters.replaceChildren(...REGIONS.map(region => {
    const button = document.createElement('button');
    button.className = 'filter-button';
    button.type = 'button';
    button.textContent = region;
    button.setAttribute('aria-pressed', String(region === activeRegion));
    button.addEventListener('click', () => {
      activeRegion = region;
      renderFilters();
      renderDestinations();
    });
    return button;
  }));
  document.querySelectorAll('[data-map-region]').forEach(link => {
    link.classList.toggle('is-current', link.dataset.mapRegion === activeRegion);
  });
  moodFilters.replaceChildren(...MOODS.map(mood => {
    const button = document.createElement('button');
    button.className = 'mood-button'; button.type = 'button'; button.textContent = mood;
    button.setAttribute('aria-pressed', String(mood === activeMood));
    button.addEventListener('click', () => { activeMood = mood; visibleLimit = 12; renderFilters(); renderDestinations(); });
    return button;
  }));
}

function toggleSavedPlace(place) {
  if (saved.has(place.name)) saved.delete(place.name); else saved.add(place.name);
  persistSaved(); updateSavedUI(); renderDestinations();
  if (placeDialog.open) updatePlaceDialogSave(place);
}

function updatePlaceDialogSave(place) {
  const button = document.querySelector('#place-dialog-save');
  const isSaved = saved.has(place.name);
  button.textContent = isSaved ? '♥ Saved to your places' : '♡ Save this place';
  button.setAttribute('aria-pressed', String(isSaved));
  button.setAttribute('aria-label', `${isSaved ? 'Remove' : 'Save'} ${place.name}`);
}

function showPlace(place, index) {
  const image = document.querySelector('#place-dialog-image');
  image.src = `https://images.unsplash.com/${place.image}?auto=format&fit=crop&w=1200&q=88`;
  image.alt = place.alt;
  document.querySelector('#place-dialog-number').textContent = String(index + 1).padStart(2, '0');
  document.querySelector('#place-dialog-region').textContent = `${place.region} / JAPAN FIELD GUIDE`;
  document.querySelector('#place-dialog-title').textContent = place.name;
  document.querySelector('#place-dialog-area').textContent = place.place;
  document.querySelector('#place-dialog-description').textContent = place.description;
  const tags = document.querySelector('#place-dialog-tags');
  tags.replaceChildren(...place.tags.map(tag => { const pill = document.createElement('span'); pill.textContent = tag; return pill; }));
  updatePlaceDialogSave(place);
  document.querySelector('#place-dialog-save').onclick = () => toggleSavedPlace(place);
  placeDialog.showModal();
}

function renderDestinations() {
  const normalized = query.trim().toLocaleLowerCase();
  const places = DESTINATIONS.filter(place => {
    const inRegion = activeRegion === 'All places' || place.region === activeRegion;
    const inSaved = !savedOnly || saved.has(place.name);
    const searchable = `${place.name} ${place.place} ${place.region} ${place.description}`.toLocaleLowerCase();
    const inMood = activeMood === 'All moods' || place.tags.includes(activeMood);
    return inRegion && inSaved && inMood && (!normalized || searchable.includes(normalized));
  });
  count.textContent = `${String(places.length).padStart(2, '0')} ${places.length === 1 ? 'PLACE' : 'PLACES'}`;
  document.querySelector('#show-more').hidden = places.length <= visibleLimit;
  if (!places.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = savedOnly && !saved.size ? 'Your shortlist is waiting. Save a place with its heart to start one.' : 'No places match that search here. Try another region or a broader word.';
    grid.replaceChildren(empty);
    return;
  }
  grid.replaceChildren(...places.slice(0, visibleLimit).map((place, index) => {
    const card = document.createElement('article');
    card.className = 'destination-card';
    const imageWrap = document.createElement('div');
    imageWrap.className = 'card-image-wrap';
    const image = document.createElement('img');
    image.className = 'card-image';
    image.src = `https://images.unsplash.com/${place.image}?auto=format&fit=crop&w=950&q=82`;
    image.alt = place.alt;
    image.loading = index < 3 ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => { image.hidden = true; imageWrap.classList.add('image-fallback'); }, {once:true});
    const photoButton = document.createElement('button');
    photoButton.className = 'card-photo'; photoButton.type = 'button';
    photoButton.setAttribute('aria-label', `View ${place.name} place details`);
    photoButton.addEventListener('click', () => showPlace(place, DESTINATIONS.indexOf(place)));
    photoButton.append(image);
    const region = document.createElement('span'); region.className = 'card-region'; region.textContent = place.region;
    const number = document.createElement('span'); number.className = 'card-index'; number.textContent = String(index + 1).padStart(2, '0');
    const saveButton = document.createElement('button');
    saveButton.className = 'card-save'; saveButton.type = 'button';
    saveButton.setAttribute('aria-label', `${saved.has(place.name) ? 'Remove' : 'Save'} ${place.name}`);
    saveButton.setAttribute('aria-pressed', String(saved.has(place.name)));
    saveButton.textContent = saved.has(place.name) ? '♥' : '♡';
    saveButton.addEventListener('click', () => toggleSavedPlace(place));
    imageWrap.append(photoButton, region, number, saveButton);
    const copy = document.createElement('div'); copy.className = 'card-copy';
    const location = document.createElement('span'); location.className = 'card-place'; location.textContent = place.region;
    const row = document.createElement('div'); row.className = 'card-title-row';
    const title = document.createElement('h3'); title.className = 'card-title'; title.textContent = place.name;
    const link = document.createElement('button'); link.className = 'card-arrow'; link.type = 'button'; link.setAttribute('aria-label', `Open ${place.name} story`); link.title = `Open ${place.name} story`; link.textContent = '↗'; link.addEventListener('click', () => showPlace(place, DESTINATIONS.indexOf(place)));
    row.append(title, link);
    const area = document.createElement('p'); area.className = 'card-area'; area.textContent = place.place;
    const description = document.createElement('p'); description.className = 'card-description'; description.textContent = place.description;
    const tags = document.createElement('div'); tags.className = 'card-tags';
    place.tags.forEach(tag => { const pill = document.createElement('span'); pill.textContent = tag; tags.append(pill); });
    const details = document.createElement('button'); details.className = 'card-details'; details.type = 'button'; details.textContent = 'View place story'; details.setAttribute('aria-label', `View ${place.name} place story`);
    details.addEventListener('click', () => showPlace(place, DESTINATIONS.indexOf(place)));
    copy.append(location, row, area, description, tags, details);
    card.append(imageWrap, copy);
    return card;
  }));
}

function updateSavedUI() {
  savedCount.textContent = String(saved.size);
  savedToggle.setAttribute('aria-pressed', String(savedOnly));
  savedToggle.classList.toggle('is-active', savedOnly);
  savedNote.hidden = !savedOnly;
}

search.addEventListener('input', () => { query = search.value; renderDestinations(); });
document.querySelector('#show-more').addEventListener('click', () => { visibleLimit += 12; renderDestinations(); });
savedToggle.addEventListener('click', () => { savedOnly = !savedOnly; updateSavedUI(); renderDestinations(); });
document.querySelector('#share-guide').addEventListener('click', async event => {
  const button = event.currentTarget;
  const url = new URL(window.location.href);
  if (activeRegion !== 'All places') url.hash = `region=${encodeURIComponent(activeRegion)}`;
  const shareData = {title: 'Somewhere in Japan', text: 'Find a place that feels like yours.', url: url.href};
  try {
    if (navigator.share) await navigator.share(shareData);
    else { await navigator.clipboard.writeText(url.href); button.innerHTML = 'Link copied <span>✓</span>'; setTimeout(() => { button.innerHTML = 'Share this guide <span>↗</span>'; }, 2200); }
  } catch (error) { if (error.name !== 'AbortError') { button.innerHTML = 'Copy the page link <span>↗</span>'; } }
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); search.focus(); }
  if (event.key === 'Escape' && document.activeElement === search) { search.value = ''; query = ''; renderDestinations(); search.blur(); }
});

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_GUIDE = [
  {summary:'Find clear winter skies in the south, snow-country quiet in the north, and a warm soak between the two.',note:'Pack for very different temperatures between Hokkaido and Okinawa.',places:[['Ginzan after dark','Lantern-lit snow-country nights'],['Otaru by lamplight','A wintry canal and old port streets'],['Kerama blue','Mild island days in the far south']]},
  {summary:'Winter is still in full color: drift ice and snow festivals up north, early blossoms and island light down south.',note:'Hokkaido is deeply wintry; Okinawa is much milder. Check local conditions before booking outdoor activities.',places:[['Shiretoko’s wild edge','Winter wilderness and drift-ice season'],['Ginzan after dark','Snowy onsen atmosphere'],['Naha, island time','Ryukyu culture in a gentler winter']]},
  {summary:'Spring begins in the south and moves north. Catch the first warmth, gardens, and the season’s early color.',note:'Blossom dates shift each year and progress northward; use the latest regional forecast if sakura is your priority.',places:[['Naha, island time','A warm-weather start to spring'],['Kyoto at first light','Shrine paths before the busy season'],['Tokyo, in layers','Parks, neighborhoods, and city spring']]},
  {summary:'A classic month for blossoms, garden walks, and long evenings outdoors, with color arriving at different times across Japan.',note:'Peak blossoms vary by region and year. Popular routes fill quickly around the spring holiday period.',places:[['Kyoto at first light','Temple lanes and spring gardens'],['Tokyo, in layers','City parks and neighborhood walks'],['Miyajima tide lines','Island scenery and a memorable shoreline']]},
  {summary:'Fresh green landscapes and comfortable days make this a lovely month to explore beyond the big-city route.',note:'Japan’s Golden Week holiday falls in late April and early May; reserve transport and stays early or travel outside the busiest dates.',places:[['Kanazawa, unhurried','Garden paths and historic lanes'],['Matsushima Bay','Island-dotted coastal views'],['Yakushima, ancient green','Mossy forest trails in the subtropical south']]},
  {summary:'A quieter, greener interlude for gardens, forest walks, and places that feel especially alive after rain.',note:'The rainy season affects much of Japan in June, though timing differs by region; Hokkaido is generally less affected.',places:[['Yakushima, ancient green','Rain-fed cedar forests'],['Kyoto at first light','Lush shrine paths and gardens'],['The blue of Biei','Hokkaido’s green interior before high summer']]},
  {summary:'High summer opens the mountains and northern flower fields. Head north or uphill for cooler air and wide horizons.',note:'Furano’s lavender is usually a July highlight; mountain weather can change quickly. Check official trail and climbing openings.',places:[['Furano in bloom','Lavender fields in their summer window'],['Daisetsuzan high country','Alpine scenery in Hokkaido'],['Fuji, from the water','Lakeside views beneath the mountain']]},
  {summary:'Festival nights, alpine escapes, and brilliant island water define the high summer mood.',note:'Expect heat and humidity in many cities; allow breaks, hydration, and flexible plans during very hot days.',places:[['Kerama blue','Clear-water island days'],['Daisetsuzan high country','Cooler trails and open mountain views'],['Miyajima tide lines','An island escape with changing tides']]},
  {summary:'Summer lingers in the south while the northern highlands begin to turn toward fall. A month for flexible plans.',note:'Heat and typhoon risk can continue; check forecasts and transport advisories close to your travel dates.',places:[['Nikko in the cedars','Forest air and mountain scenery'],['Shiretoko’s wild edge','Remote northern landscapes'],['Yakushima, ancient green','A lush island for unhurried nature trips']]},
  {summary:'Crisp walking weather arrives, with early autumn color in the north and high country and harvest flavors nationwide.',note:'Foliage appears first in colder northern and higher-altitude areas; central and southern cities usually change later.',places:[['Nikko in the cedars','Mountain forests entering autumn'],['Shiretoko’s wild edge','Northern wilderness in fall'],['Fuji, from the water','Clearer days around the Fuji Five Lakes']]},
  {summary:'Autumn color moves into gardens, temple paths, and city parks, while the air turns crisp and clear.',note:'Peak foliage moves from north to south and changes year to year. Popular Kyoto sights are busiest around peak color.',places:[['Kyoto at first light','Historic paths and autumn gardens'],['Kanazawa, unhurried','Garden and teahouse-lane season'],['Nikko in the cedars','Mountain shrines among fall color']]},
  {summary:'Choose your winter: northern snow scenes, cozy onsen towns, or a gentler island escape in the far south.',note:'The north can be snowy and cold while Okinawa stays relatively mild; plan clothing and transfers by region.',places:[['Ginzan after dark','A classic winter onsen atmosphere'],['Hakodate from above','Harbor lights on a cold clear night'],['Kerama blue','A slower, mild-weather island break']]}
];
const monthSelect = document.querySelector('#travel-month');
const tripLengthSelect = document.querySelector('#trip-length');
monthSelect.replaceChildren(...MONTHS.map((month, index) => { const option = document.createElement('option'); option.value = String(index); option.textContent = month; return option; }));
monthSelect.value = String(new Date().getMonth());
function renderMonthGuide() {
  const monthIndex = Number(monthSelect.value);
  const guide = MONTH_GUIDE[monthIndex];
  document.querySelector('#month-name-heading').textContent = MONTHS[monthIndex];
  document.querySelector('#month-summary').textContent = guide.summary;
  document.querySelector('#month-timing-note').textContent = guide.note;
  const durationNotes = {
    short:'For 3–5 days, choose one compact region and enjoy it at an unhurried pace.',
    week:'For 6–9 days, pair two nearby bases and leave room for a day trip.',
    long:'For 10–14 days, combine two or three connected regions; allow time for longer transfers.'
  };
  document.querySelector('#trip-length-guidance').textContent = durationNotes[tripLengthSelect.value];
  const cards = guide.places.map(([name, reason]) => {
    const place = DESTINATIONS.find(item => item.name === name);
    if (!place) return null;
    const card = document.createElement('button'); card.type = 'button'; card.className = 'month-pick';
    card.setAttribute('aria-label', `View ${place.name}: ${reason}`);
    const image = document.createElement('img'); image.src = `https://images.unsplash.com/${place.image}?auto=format&fit=crop&w=600&q=80`; image.alt = ''; image.loading = 'lazy';
    const copy = document.createElement('span'); copy.className = 'month-pick-copy';
    const region = document.createElement('span'); region.className = 'month-pick-region'; region.textContent = `${place.region} / ${place.region}`;
    const title = document.createElement('span'); title.className = 'month-pick-title'; title.textContent = place.name;
    const detail = document.createElement('span'); detail.className = 'month-pick-reason'; detail.textContent = reason;
    const action = document.createElement('span'); action.className = 'month-pick-action'; action.textContent = 'VIEW PLACE ↗';
    copy.append(region,title,detail,action); card.append(image,copy);
    card.addEventListener('click', () => showPlace(place, DESTINATIONS.indexOf(place)));
    return card;
  }).filter(Boolean);
  document.querySelector('#month-recommendations').replaceChildren(...cards);
}
monthSelect.addEventListener('change', renderMonthGuide);
tripLengthSelect.addEventListener('change', renderMonthGuide);
renderMonthGuide();

renderFilters();
renderDestinations();
updateSavedUI();
document.querySelectorAll('[data-map-region]').forEach(link => link.addEventListener('click', () => {
  activeRegion = link.dataset.mapRegion;
  renderFilters(); renderDestinations();
}));
const initialRegion = decodeURIComponent(window.location.hash.replace(/^#region=/, ''));
if (REGIONS.includes(initialRegion)) { activeRegion = initialRegion; renderFilters(); renderDestinations(); }
document.querySelector('#place-dialog-close').addEventListener('click', () => placeDialog.close());
placeDialog.addEventListener('click', event => { if (event.target === placeDialog) placeDialog.close(); });

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!expanded));
  menuToggle.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  mobileNav.hidden = expanded;
});
mobileNav.addEventListener('click', event => {
  if (event.target.closest('a')) {
    mobileNav.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
  }
});
