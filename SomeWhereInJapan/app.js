const grid = document.querySelector('#destination-grid');
const filters = document.querySelector('#region-filters');
const count = document.querySelector('#result-count');
const search = document.querySelector('#place-search');
const savedToggle = document.querySelector('#saved-toggle');
const savedCount = document.querySelector('#saved-count');
const savedNote = document.querySelector('#saved-note');
let activeRegion = 'All places';
let savedOnly = false;
let query = '';
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
}

function destinationLink(place) {
  const query = encodeURIComponent(`${place.name} ${place.place} Japan tourism`);
  return `https://www.japan.travel/en/search/?q=${query}`;
}

function renderDestinations() {
  const normalized = query.trim().toLocaleLowerCase();
  const places = DESTINATIONS.filter(place => {
    const inRegion = activeRegion === 'All places' || place.region === activeRegion;
    const inSaved = !savedOnly || saved.has(place.name);
    const searchable = `${place.name} ${place.place} ${place.region} ${place.description}`.toLocaleLowerCase();
    return inRegion && inSaved && (!normalized || searchable.includes(normalized));
  });
  count.textContent = `${String(places.length).padStart(2, '0')} ${places.length === 1 ? 'PLACE' : 'PLACES'}`;
  if (!places.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = savedOnly && !saved.size ? 'Your shortlist is waiting. Save a place with its heart to start one.' : 'No places match that search here. Try another region or a broader word.';
    grid.replaceChildren(empty);
    return;
  }
  grid.replaceChildren(...places.map((place, index) => {
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
    const region = document.createElement('span'); region.className = 'card-region'; region.textContent = place.region;
    const number = document.createElement('span'); number.className = 'card-index'; number.textContent = String(index + 1).padStart(2, '0');
    const saveButton = document.createElement('button');
    saveButton.className = 'card-save'; saveButton.type = 'button';
    saveButton.setAttribute('aria-label', `${saved.has(place.name) ? 'Remove' : 'Save'} ${place.name}`);
    saveButton.setAttribute('aria-pressed', String(saved.has(place.name)));
    saveButton.textContent = saved.has(place.name) ? '♥' : '♡';
    saveButton.addEventListener('click', () => {
      if (saved.has(place.name)) saved.delete(place.name); else saved.add(place.name);
      persistSaved(); updateSavedUI(); renderDestinations();
    });
    imageWrap.append(image, region, number, saveButton);
    const copy = document.createElement('div'); copy.className = 'card-copy';
    const location = document.createElement('span'); location.className = 'card-place'; location.textContent = place.region;
    const row = document.createElement('div'); row.className = 'card-title-row';
    const title = document.createElement('h3'); title.className = 'card-title'; title.textContent = place.name;
    const link = document.createElement('a'); link.className = 'card-arrow'; link.href = destinationLink(place); link.target = '_blank'; link.rel = 'noopener noreferrer'; link.setAttribute('aria-label', `Explore ${place.name} on the Japan National Tourism Organization site`); link.textContent = '↗';
    row.append(title, link);
    const area = document.createElement('p'); area.className = 'card-area'; area.textContent = place.place;
    const description = document.createElement('p'); description.className = 'card-description'; description.textContent = place.description;
    copy.append(location, row, area, description);
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

renderFilters();
renderDestinations();
updateSavedUI();
document.querySelectorAll('[data-map-region]').forEach(link => link.addEventListener('click', () => {
  activeRegion = link.dataset.mapRegion;
  renderFilters(); renderDestinations();
}));
const initialRegion = decodeURIComponent(window.location.hash.replace(/^#region=/, ''));
if (REGIONS.includes(initialRegion)) { activeRegion = initialRegion; renderFilters(); renderDestinations(); }

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
