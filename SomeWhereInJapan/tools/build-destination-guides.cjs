'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { loadRawDestinations, buildInventory } = require('./destination-inventory.cjs');
const { evaluateGuideCompletion } = require('./destination-guide-schema.cjs');

const DEFAULT_BASE = '/Den-Lab/SomeWhereInJapan/';
const GENERATED_ON = '2026-10-23';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function replaceTokens(template, tokens) {
  return template.replace(/%%([A-Z_]+)%%/g, (match, key) => tokens[key] ?? '');
}

function sourceLinks(place) {
  const photo = place.photo;
  if (!photo?.source) return '';
  return `<p>Photo credit: ${escapeHtml(photo.credit || 'Image source')} ${photo.license ? `· ${escapeHtml(photo.license)} ` : ''}<a href="${escapeHtml(photo.source)}" target="_blank" rel="noopener noreferrer">Source</a></p>`;
}

function imageMarkup(place, researchedPhoto, routePhoto) {
  const photo = researchedPhoto?.status === 'verified' ? researchedPhoto : (place.photo || routePhoto);
  const illustrativeUrl = place.image ? `https://images.unsplash.com/${encodeURIComponent(place.image)}?auto=format&fit=crop&w=1400&q=85` : '';
  const imageUrl = photo?.url || illustrativeUrl;
  if (!imageUrl) return `<div class="destination-photo-gap" role="img" aria-label="Illustrated map card for ${escapeHtml(place.name)}"><span>${escapeHtml(place.region || 'Japan')}</span><strong>${escapeHtml(place.name)}</strong><small>Open the map to explore this place</small></div>`;
  const alt = photo?.alt || place.alt || `Illustrative image for ${place.name}`;
  const attribution = photo?.source
    ? `Photo: ${escapeHtml(photo.credit || 'Image source')} · <a href="${escapeHtml(photo.source)}" target="_blank" rel="noopener noreferrer">Source${photo.license ? ` · ${escapeHtml(photo.license)}` : ''}</a>`
    : `Illustrative image via <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">Unsplash</a>`;
  return `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(alt)}" loading="eager" decoding="async"><figcaption>${attribution}</figcaption>`;
}

function normalizeName(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function locationRouteFor(record, location) {
  if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) return null;
  const precision = location.precision === 'destination' ? 'named destination' : location.precision === 'area' ? 'area-level' : 'nearby-feature';
  const stop = {
    id:`${record.id}-location`, order:1, name:record.name, area:record.raw.place || record.region,
    address:location.locator || record.raw.place || record.region,
    story:record.raw.description || `Use this ${precision.replace('-', ' ')} marker to orient your visit, then confirm the exact entrance and access details on the linked map.`,
    coordinates:{latitude:location.latitude,longitude:location.longitude,precision,sourceIds:['osm-location']}
  };
  return {
    kind:'location', location,
    route:{
      id:`${record.id}-place-map`, cityId:'destination', title:`${record.name}: location map`,
      introduction:location.precision === 'destination'
        ? `One destination marker for ${record.name}. No connecting route is implied without a researched stop order.`
        : `This is an approximate ${precision.replace('-', ' ')} for ${location.locator || record.raw.place || record.region}; it may not mark the attraction entrance.`,
      researchStatus:'place-locator', locatorPrecision:location.precision, locatorLabel:precision,
      stops:[stop], legs:[],
      sources:[{url:location.sourceUrl,label:'OpenStreetMap location record',checkedOn:location.checkedOn}]
    }
  };
}

function routeFor(record, placeRoutes, cityRoutes) {
  const place = (placeRoutes.routes || []).find(route => route.placeId === record.id);
  if (place) return { kind:'place', route:place };
  const regionCities = {
    Hokkaido:['sapporo'], Tohoku:['sendai'], Kanto:['tokyo'], Chubu:['nagoya'],
    Kansai:['kyoto','osaka'], Chugoku:['hiroshima'], Shikoku:['takamatsu'],
    Kyushu:['fukuoka'], Okinawa:['naha']
  };
  const aliases = {
    'Tokyo, in layers':'Tokyo Station & Marunouchi',
    'Kiyomizu-dera above Kyoto':'Kiyomizu-dera',
    'Ritsurin Garden, Takamatsu':'Ritsurin Garden',
    'Dotonbori':'Dotonbori & Hozenji Yokocho',
    'Sapporo Beer Museum':'Sapporo Beer Museum and Beer Garden',
    'Atsuta Jingu Shrine':'Atsuta Jingu',
    'Nagoya Castle':'Nagoya Castle & Hommaru Palace',
    'Senso-ji and Asakusa lanes':'Asakusa & Senso-ji',
    'Sendai Castle Ruins':'Sendai Castle Site and Kenbunkan',
    'Hiroshima, a city of peace':'Hiroshima Peace Memorial Park'
  };
  const expectedStop = normalizeName(aliases[record.name] || record.name);
  const city = (cityRoutes.routes || []).find(route =>
    (regionCities[record.region] || []).includes(route.cityId) &&
    (route.stops || []).some(stop => normalizeName(stop.name) === expectedStop)
  );
  return city ? { kind:'city', route:city } : null;
}

function guideSequence(details) {
  const candidates = [details.walkingRoute, details.routeSections, details.highlights, details.points];
  return candidates.find(items => Array.isArray(items) && items.length) || [];
}

function pointMapUrl(point, record) {
  const coords = point.coordinates;
  if (coords && Number.isFinite(coords.latitude) && Number.isFinite(coords.longitude)) {
    return `https://www.openstreetmap.org/?mlat=${coords.latitude}&mlon=${coords.longitude}#map=17/${coords.latitude}/${coords.longitude}`;
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${point.name || record.name} ${point.address || point.area || record.region} Japan`)}`;
}

function routeStopMarkup(stops, record) {
  return stops.map((stop, index) => {
    const photo = stop.photo;
    const photoMarkup = photo?.url ? `<figure class="ng-stop-photo"><img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.alt || stop.name)}" loading="lazy"><figcaption>Photo: ${escapeHtml(photo.credit || 'Contributor')} · <a href="${escapeHtml(photo.source || '#')}" target="_blank" rel="noopener noreferrer">${escapeHtml(photo.license || 'Source')}</a></figcaption></figure>` : '';
    const duration = stop.visitDuration?.status === 'known' ? `${stop.visitDuration.minMinutes}${stop.visitDuration.maxMinutes !== stop.visitDuration.minMinutes ? `–${stop.visitDuration.maxMinutes}` : ''} min suggested visit` : '';
    return `<li class="ng-stop"><span class="ng-stop-number">${String(stop.order || index + 1).padStart(2,'0')}</span><article>${photoMarkup}<p class="ng-kicker">${escapeHtml(stop.area || record.region || 'JAPAN')}</p><h3>${escapeHtml(stop.name)}</h3>${stop.address ? `<p class="ng-stop-address">${escapeHtml(stop.address)}</p>` : ''}${stop.story ? `<p>${escapeHtml(stop.story)}</p>` : ''}${duration ? `<p class="ng-stop-time">${escapeHtml(duration)}</p>` : ''}<a class="ng-map-link" href="${pointMapUrl(stop, record)}" target="_blank" rel="noopener noreferrer">Open this stop in OpenStreetMap ↗</a></article></li>`;
  }).join('');
}

function routeLegMarkup(route) {
  const byId = new Map([[route.origin?.id, route.origin], ...(route.stops || []).map(stop => [stop.id, stop])]);
  return (route.legs || []).map(leg => {
    const from = byId.get(leg.fromId), to = byId.get(leg.toId);
    if (!from || !to) return '';
    const mode = leg.mode === 'walking' ? 'walking' : leg.mode === 'driving' ? 'driving' : 'transit';
    const action = mode === 'walking' ? 'Open walking directions in Google Maps' : mode === 'driving' ? 'Open driving directions in Google Maps' : 'Open public transport directions in Google Maps';
    const params = new URLSearchParams({api:'1', origin:from.address || from.name, destination:to.address || to.name, travelmode:mode});
    const duration = leg.duration?.status === 'known' ? ` · ${leg.duration.minMinutes}${leg.duration.maxMinutes !== leg.duration.minMinutes ? `–${leg.duration.maxMinutes}` : ''} min` : '';
    return `<li><span><strong>${escapeHtml(from.name)} → ${escapeHtml(to.name)}</strong><small>${escapeHtml(leg.mode)}${duration}</small></span><a href="https://www.google.com/maps/dir/?${params}" target="_blank" rel="noopener noreferrer">${action}</a></li>`;
  }).filter(Boolean).join('');
}

function sequenceLegMarkup(sequence, record) {
  return (sequence || []).slice(0, -1).map((from, index) => {
    const to = sequence[index + 1];
    const fromName = typeof from === 'string' ? from : from.name || from.title;
    const toName = typeof to === 'string' ? to : to.name || to.title;
    if (!fromName || !toName) return '';
    const origin = `${fromName}, ${record.region}, Japan`, destination = `${toName}, ${record.region}, Japan`;
    const params = new URLSearchParams({api:'1', origin, destination, travelmode:'walking'});
    return `<li><span><strong>${escapeHtml(fromName)} → ${escapeHtml(toName)}</strong><small>Walking directions</small></span><a href="https://www.google.com/maps/dir/?${params}" target="_blank" rel="noopener noreferrer">Open walking directions in Google Maps</a></li>`;
  }).filter(Boolean).join('');
}

function routePrimaryAction(record, routeRecord, fallbackDestination) {
  const route = routeRecord?.route;
  const stops = [...(route?.stops || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  const legs = route?.legs || [];
  const modes = [...new Set(legs.map(leg => leg.mode === 'walking' ? 'walking' : leg.mode === 'driving' ? 'driving' : 'transit'))];
  if (routeRecord && stops.length >= 2 && legs.length && modes.length === 1 && modes[0] !== 'walking' && stops.length <= 4) {
    const point = stop => `${stop.address || stop.name}, ${stop.area || record.region}, Japan`;
    const params = new URLSearchParams({api:'1', origin:point(route.origin || stops[0]), destination:point(stops[stops.length - 1]), travelmode:modes[0]});
    const intermediate = route.origin ? stops.slice(0, -1) : stops.slice(1, -1);
    if (intermediate.length) params.set('waypoints', intermediate.map(point).join('|'));
    const label = modes[0] === 'driving' ? 'Open driving route in Google Maps' : 'Open public transport route in Google Maps';
    return `<a class="ng-button" href="https://www.google.com/maps/dir/?${escapeHtml(params.toString())}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  }
  if (routeRecord && stops.length >= 2 && legs.length) return '<a class="ng-button" href="#route-map">View mapped route and leg directions</a>';
  const params = new URLSearchParams({api:'1', destination:fallbackDestination});
  return `<a class="ng-button" href="https://www.google.com/maps/dir/?${escapeHtml(params.toString())}" target="_blank" rel="noopener noreferrer">Get directions to this place in Google Maps</a>`;
}

function pageHtml(template, record, details, completion, routeRecord) {
  const raw = record.raw;
  const route = routeRecord?.route || null;
  const hasRoute = Boolean(routeRecord);
  const orderedRouteStops = route ? [...(route.stops || [])].sort((a,b) => (a.order || 0) - (b.order || 0)) : [];
  const routeHeroStop = orderedRouteStops.find(stop => normalizeName(stop.name) === normalizeName(record.name));
  const imagePhoto = routeHeroStop?.photo || null;
  const title = `${record.name} · Japan field guide`;
  const tags = (raw.tags || []).map(tag => `<span class="destination-tag">${escapeHtml(tag)}</span>`).join('');
  const months = Array.isArray(raw.months) && raw.months.length
    ? `<strong>Good months to explore:</strong> ${raw.months.map(month => new Intl.DateTimeFormat('en', { month:'long', timeZone:'UTC' }).format(new Date(Date.UTC(2020, month - 1, 1)))).join(', ')}.`
    : '';
  const sources = new Map((details.sources || []).map(source => [source.id, source]));
  const points = (details.points || []).map(point => {
    const pointQuery = encodeURIComponent(`${point.name} ${point.address || raw.region} Japan`);
    return `<li><strong>${escapeHtml(point.name)}</strong>${point.address ? ` · ${escapeHtml(point.address)}` : ''}${point.description ? `<p>${escapeHtml(point.description)}</p>` : ''}<p><a href="https://www.openstreetmap.org/search?query=${pointQuery}" target="_blank" rel="noopener noreferrer">Open this point on OpenStreetMap ↗</a></p></li>`;
  }).join('') || `<li><strong>${escapeHtml(record.name)}</strong><p>Open this destination on <a href="https://www.openstreetmap.org/search?query=${encodeURIComponent(`${String(raw.place || record.name).split(/[·,]/)[0].trim()} ${raw.region} Japan`)}" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> and choose nearby stops that match your time and interests.</p></li>`;
  const modes = ['rail','bus','air','car'].map(mode => {
    const item = details.accessModes?.[mode];
    if (!item || item.status === 'unknown') return '';
    const text = item.status === 'known' ? item.detail : (item.note || 'Not applicable');
    const refs = (item?.sourceIds || []).map(id => sources.get(id)).filter(Boolean).map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title || source.organization || id)}</a>`).join(', ');
    return `<li><strong>${mode[0].toUpperCase()+mode.slice(1)}:</strong> ${escapeHtml(text)}${refs ? ` (${refs})` : ''}</li>`;
  }).filter(Boolean).join('');
  const claims = (details.claims || []).map(claim => {
    const refs = (claim.sourceIds || []).map(id => sources.get(id)).filter(Boolean).map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.organization || source.title || source.id)}</a>`).join(', ');
    return `<li>${escapeHtml(claim.text)}${refs ? ` <span>Source: ${refs}</span>` : ''}</li>`;
  }).join('') || `<li><a href="https://www.google.com/search?q=${encodeURIComponent(`${record.name} ${raw.region} Japan official visitor information`)}" target="_blank" rel="noopener noreferrer">Find official visitor information for ${escapeHtml(record.name)} ↗</a></li>`;
  const stay = (details.stayRecommendations || []).map(item => `${escapeHtml(item.name)}${item.area ? ` · ${escapeHtml(item.area)}` : ''}`).join('<br>');
  const contact = (details.contacts || []).filter(item => item.phone).map(item => `<a href="tel:${escapeHtml(item.phone)}">${escapeHtml(item.name || item.phone)}</a>`).join('<br>');
  const costs = (details.costs || []).filter(item => item.status === 'known' || item.status === 'not-applicable').map(item => item.status === 'known' ? `${escapeHtml(item.currency)} ${escapeHtml(item.amount)}` : 'No admission fee').join('<br>');
  const sourcesMarkup = (details.sources || []).map(source => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title || source.organization || source.id)}</a> · checked ${escapeHtml(source.checkedOn || 'date not recorded')}${source.evidenceNotes ? ` · ${escapeHtml(source.evidenceNotes)}` : ''}</li>`).join('');
  const sourceLedger = `${sourcesMarkup ? `<h2>Research sources</h2><ul class="destination-list">${sourcesMarkup}</ul>` : ''}${sourceLinks(raw)}`;
  const base = DEFAULT_BASE;
  const absolute = `https://decniner.github.io${base}places/${record.slug}/`;
  const queryText = `${record.name} ${raw.place || raw.region} Japan`;
  const query = encodeURIComponent(queryText);
  const mapPlace = String(raw.place || '').split(/[·,]/)[0].trim() || record.name;
  const mapQuery = encodeURIComponent(`${record.name} ${raw.place || raw.region} Japan`);
  const directionDestination = mapQuery;
  const mapUrl = `https://www.openstreetmap.org/search?query=${mapQuery}`;
  const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const primaryRouteAction = routePrimaryAction(record, routeRecord, queryText);
  const stayMarkup = stay || `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`hotels near ${mapPlace} ${raw.region} Japan`)}" target="_blank" rel="noopener noreferrer">Browse places to stay nearby</a>`;
  const contactMarkup = contact || `<a href="https://www.google.com/search?q=${encodeURIComponent(`${queryText} official contact phone`)}" target="_blank" rel="noopener noreferrer">Find the official visitor contact</a>`;
  const accessFallback = details.access || `Use the destination map and follow official visitor information for the current way to reach ${record.name}.`;
  const routeStopItems = orderedRouteStops.length ? orderedRouteStops : guideSequence(details).map((item, index) => typeof item === 'string' ? {name:item, order:index + 1} : {...item, order:index + 1});
  const routeStopsMarkup = orderedRouteStops.length
    ? routeStopMarkup(orderedRouteStops, record)
    : routeStopItems.length
      ? routeStopMarkup(routeStopItems, record)
      : `<li class="ng-stop"><span class="ng-stop-number">01</span><article><p class="ng-kicker">${escapeHtml(raw.region)} · JAPAN</p><h3>${escapeHtml(record.name)}</h3><p>${escapeHtml(raw.description || '')}</p><a class="ng-map-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer">Open this place in OpenStreetMap ↗</a></article></li>`;
  const routeDataAttrs = routeRecord?.kind === 'city'
    ? `data-route-kind="city" data-route-id="${escapeHtml(route.id)}" data-route-city="${escapeHtml(route.cityId)}"`
    : routeRecord?.kind === 'location'
      ? `data-route-kind="location" data-route-id="${escapeHtml(route.id)}" data-route-city="destination" data-route-name="${escapeHtml(record.name)}" data-route-locator="${escapeHtml(route.stops[0].address)}" data-route-precision="${escapeHtml(routeRecord.location.precision)}" data-route-lat="${route.stops[0].coordinates.latitude}" data-route-lon="${route.stops[0].coordinates.longitude}" data-route-source="${escapeHtml(routeRecord.location.sourceUrl)}"`
    : routeRecord ? `data-route-kind="place" data-route-id="${escapeHtml(route.id)}"` : '';
  const routeMapMarkup = routeRecord
    ? `<div id="route-map" data-place-route-guide ${routeDataAttrs} aria-label="Interactive ${escapeHtml(record.name)} route map with ordered stops"></div>`
    : `<div class="ng-route-map-cta"><a class="ng-button" href="${mapUrl}" target="_blank" rel="noopener noreferrer">Open ${escapeHtml(record.name)} in OpenStreetMap ↗</a><a class="ng-button ng-button-quiet" href="${googleMapUrl}" target="_blank" rel="noopener noreferrer">Get directions ↗</a></div>`;
  const sequence = guideSequence(details);
  const legsMarkup = routeRecord?.kind === 'location'
    ? `<li><span><strong>Start at ${escapeHtml(record.name)}</strong><small>One-place locator</small></span><a href="${mapUrl}" target="_blank" rel="noopener noreferrer">Open in OpenStreetMap</a></li>`
    : route ? routeLegMarkup(route) : sequenceLegMarkup(sequence, record);
  const routeTitle = route?.title || `${record.name}: places to explore`;
  const routeIntroduction = route?.introduction || details.visitPlan || `Make ${record.name} the anchor of your visit. Start at the mapped destination, explore the named highlights below, then use live directions to connect the stops that suit your time.`;
  const routeNote = routeRecord?.kind === 'location'
    ? routeRecord.location.precision === 'destination'
      ? 'Stop 01 is a named OpenStreetMap destination. This one-place map has no connecting route.'
      : `Stop 01 is an approximate ${routeRecord.location.precision === 'area' ? 'area' : 'nearby-feature'} locator for ${routeRecord.location.locator || raw.place || raw.region}; it may not mark the attraction entrance.`
    : route ? 'Select a numbered stop to highlight it on the map. Use the linked leg directions for current navigation.' : sequence.length ? 'The numbered sequence follows the destination guide. Use the linked leg directions to plan current travel between points.' : 'Use the map to orient yourself, then open live directions from your chosen starting point.';
  const routeSources = (route?.sources || []).map(source => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>${source.checkedOn ? ` · checked ${escapeHtml(source.checkedOn)}` : ''}</li>`).join('');
  const routeCount = orderedRouteStops.length || routeStopItems.length || 1;
  const sectionTitle = route ? route.title : sequence.length ? record.name + ": a suggested exploration sequence" : record.name + ": plan your visit";
  const tokens = {
    TITLE: escapeHtml(title), DESCRIPTION: escapeHtml(raw.description || `${record.name} in ${raw.region}, Japan.`), CANONICAL: escapeHtml(absolute),
    TITLE_TEXT: escapeHtml(record.name), REGION: escapeHtml(raw.region), TYPE: escapeHtml(record.type), PLACE: escapeHtml(raw.place || raw.region),
    DESCRIPTION: escapeHtml(raw.description || ''), TAGS: tags, IMAGE: imageMarkup(raw, details.photo, imagePhoto), SEASON: details.season ? escapeHtml(details.season) : months,
    STORY: escapeHtml(details.story || raw.description || ''), VISIT_PLAN: escapeHtml(routeIntroduction),
    ACCESS: escapeHtml(accessFallback), POINTS: points,
    ACCESS_MODES: modes || '<li>Open the map for current public transport and driving options from your starting point.</li>', CONTACT: contactMarkup, STAY: stayMarkup, WEATHER: escapeHtml(details.weatherPlan?.alternative || 'Check the attraction or local visitor site before setting out in poor weather.'),
    COSTS: costs || 'Check current admission and transport costs with the linked official visitor information.', CLAIMS: claims,
    ROUTE_COUNT: `${routeCount} ${routeCount === 1 ? 'STOP' : 'STOPS'}`, ROUTE_TITLE: escapeHtml(sectionTitle), ROUTE_INTRO: escapeHtml(routeIntroduction), ROUTE_NOTE: escapeHtml(routeNote), ROUTE_STOPS: routeStopsMarkup, ROUTE_MAP: routeMapMarkup, ROUTE_LEGS: legsMarkup || '<li><span><strong>Continue from your starting point</strong><small>Live directions</small></span><a href="' + googleMapUrl + '" target="_blank" rel="noopener noreferrer">Open directions ↗</a></li>', ROUTE_SOURCES: routeSources,
    STATUS_TITLE: '', STATUS_COPY: '',
    MAP_URL: mapUrl,
    GOOGLE_MAP_URL: googleMapUrl,
    ROUTE_PRIMARY_ACTION: primaryRouteAction,
    OFFICIAL_URL: `https://www.google.com/search?q=${encodeURIComponent(`${queryText} official visitor guide`)}`,
    RAIL_URL: `https://www.google.com/maps/dir/?api=1&destination=${directionDestination}&travelmode=transit`,
    BUS_URL: `https://www.google.com/maps/dir/?api=1&destination=${directionDestination}&travelmode=transit`,
    CAR_URL: `https://www.google.com/maps/dir/?api=1&destination=${directionDestination}&travelmode=driving`,
    AIR_URL: `https://www.google.com/search?q=${encodeURIComponent(`${mapPlace} ${raw.region} Japan nearest airport`)}`,
    ROUTE_MARKUP: hasRoute ? '<section class="destination-section"><p class="destination-kicker">THE VISIT ROUTE</p><h2>A mapped route through the place</h2><p>Follow the numbered stops in visit order. Open individual directions from the map for current travel options.</p><div class="destination-actions"><a class="destination-button" href="#route-map">Open route map</a></div><div id="route-map" data-place-route-guide aria-label="Interactive Nikko route map with ordered stops and directions"></div></section>' : `<section class="destination-section"><p class="destination-kicker">THE VISIT ROUTE</p><h2>Build your route around ${escapeHtml(record.name)}</h2><p>OpenStreetMap shows the destination and nearby places. For current door-to-door directions, set your starting point and choose walking, public transport, or driving in the map app.</p></section>`,
    MAP_CREDIT: 'OpenStreetMap search opens the destination in its full interactive map. Map data © OpenStreetMap contributors.',
    VIDEO_URL: `https://www.youtube.com/results?search_query=${query}`, SOURCES: sourceLedger, GENERATED: GENERATED_ON
  };
  return replaceTokens(template, tokens);
}

function buildDestinationPages(siteDir, options = {}) {
  const basePath = options.basePath || DEFAULT_BASE;
  const raw = loadRawDestinations(siteDir);
  const identities = readJson(path.join(siteDir, 'data/destination-identities.json'));
  const details = readJson(path.join(siteDir, 'data/destination-guide-details.json')).records || {};
  const placeRoutes = readJson(path.join(siteDir, 'data/place-routes.json'));
  const cityRoutes = readJson(path.join(siteDir, 'data/city-routes.json'));
  const mapLocations = readJson(path.join(siteDir, 'data/destination-map-locations.json')).records || {};
  const inventory = buildInventory(raw, identities.records, basePath);
  const template = fs.readFileSync(path.join(siteDir, 'tools/templates/destination-guide.html'), 'utf8');
  const canonical = inventory.records.filter(record => !record.aliasOf);
  const seenImages = new Set();
  const records = canonical.map(record => {
    const destinationDetails = details[record.id];
    const destinationRoute = routeFor(record, placeRoutes, cityRoutes) || locationRouteFor(record, mapLocations[record.id]);
    const completion = destinationDetails ? evaluateGuideCompletion({ id: record.id, type: record.type, ...destinationDetails }) : { complete:false, missing:['researched guide details'] };
    const imageKey = record.raw.photo?.url || record.raw.image || null;
    const duplicateImage = imageKey && seenImages.has(imageKey);
    if (imageKey && !duplicateImage) seenImages.add(imageKey);
    const output = path.join(siteDir, 'places', record.slug, 'index.html');
    fs.mkdirSync(path.dirname(output), { recursive:true });
    const existing = fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : '';
    if (!existing.includes('data-authored-guide="true"')) {
      fs.writeFileSync(output, pageHtml(template, { ...record, raw: duplicateImage ? { ...record.raw, photo:null, image:null } : record.raw }, destinationDetails || {}, completion, destinationRoute), 'utf8');
    }
    return {
      id: record.id, slug: record.slug, name: record.name, region: record.region, type: record.type,
      pagePath: `places/${record.slug}/index.html`, url: `${basePath.replace(/\/?$/, '/') }places/${record.slug}/`,
      aliasOf: null, oldPaths: record.oldPaths || [], guideStatus: completion.complete ? 'complete' : 'provisional',
      guide_status: completion.complete ? 'complete' : 'provisional',
      missing: completion.missing, sourceStatus: destinationDetails?.sources?.length ? 'sources-recorded' : 'not-researched',
      imageStatus: duplicateImage ? 'duplicate-suppressed' : record.raw.photo?.url ? 'catalogue-attribution-pending-review' : record.raw.image ? 'illustrative-unsplash-image' : 'missing',
      mapStatus: mapLocations[record.id]?.precision ? `osm-${mapLocations[record.id].precision}-locator` : record.raw.coordinates ? 'coordinates-present-pending-review' : 'no-coordinates'
    };
  });
  const aliasPaths = [];
  for (const alias of inventory.records.filter(record => record.aliasOf)) {
    for (const oldPath of alias.oldPaths || []) aliasPaths.push(oldPath);
  }
  const manifest = {
    schemaVersion:1, generatedOn:GENERATED_ON, rawCount:raw.length,
    canonicalCandidateCount:canonical.length,
    identityReviewPendingCount:inventory.identityReviewPendingCount,
    confirmedAliasCount:inventory.confirmedAliasCount,
    completeCount:records.filter(record => record.guideStatus === 'complete').length,
    provisionalCount:records.filter(record => record.guideStatus === 'provisional').length,
    records
  };
  fs.writeFileSync(path.join(siteDir, 'data/coverage-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  writeGuideStatuses(siteDir, records);
  updateSitemap(siteDir, records, basePath);
  writeGuideLinks(siteDir, records, identities.records, basePath);
  return { rawCount:raw.length, canonicalCandidateCount:canonical.length, pagesWritten:records.length,
    completeCount:manifest.completeCount, provisionalCount:manifest.provisionalCount, aliasPaths, records };
}

function writeGuideLinks(siteDir, records, identities, basePath) {
  const routeGuides = readJson(path.join(siteDir, 'data/route-guide-urls.json')).records;
  const statuses = Object.fromEntries(records.map(record => [record.id, record.guideStatus]));
  const destinationIndex = Object.fromEntries(identities.map(identity => [identity.name, {
    id: identity.id, slug: identity.slug, canonicalId: identity.aliasOf || identity.id, aliasOf: identity.aliasOf || null,
    guideStatus: statuses[identity.aliasOf || identity.id] || 'provisional'
  }]));
  const routeIndex = Object.fromEntries(routeGuides.map(route => [route.id, { slug: route.id }]));
  const data = JSON.stringify({ destinations:destinationIndex, routes:routeIndex }).replace(/</g, '\\u003c');
  const source = `(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.GuideLinks=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';const index=${data};function base(value){return '/'+String(value||'').split('/').filter(Boolean).join('/')+'/';}function guideUrlFor(id,manifest,basePath){const rows=Array.isArray(manifest)?manifest:(manifest&&manifest.records)||[];const record=rows.find(item=>item.id===id||item.canonicalId===id);if(!record)return null;const canonical=record.canonicalId||record.id;const target=rows.find(item=>item.id===canonical)||record;return base(basePath||'${basePath}')+'places/'+(target.slug||record.slug)+'/';}function routeGuideUrlFor(id,routeGuides,basePath){const rows=Array.isArray(routeGuides)?routeGuides:(routeGuides&&routeGuides.records)||[];const route=rows.find(item=>item.id===id);return route?base(basePath||'${basePath}')+'day-trips/'+(route.slug||route.id)+'/':null;}function destinationIdForName(name){return index.destinations[name]?.id||null;}function destinationUrl(name){const identity=index.destinations[name];if(!identity)return null;const target=index.destinations[name]||identity;return base('${basePath}')+'places/'+(target.slug||target.id)+'/';}function guideStatusFor(name){return index.destinations[name]?.guideStatus||'provisional';}function routeUrl(id){return routeGuideUrlFor(id,Object.entries(index.routes).map(([key,value])=>({id:key,...value})),'${basePath}');}return Object.freeze({guideUrlFor,routeGuideUrlFor,destinationIdForName,destinationUrl,guideStatusFor,routeUrl,index});});\n`;
  fs.writeFileSync(path.join(siteDir, 'guide-links.js'), source, 'utf8');
}

function writeGuideStatuses(siteDir, records) {
  const statuses = Object.fromEntries(records.map(record => [record.name, record.guide_status]));
  const source = `(function(root){'use strict';const statuses=${JSON.stringify(statuses)};for(const place of root.DESTINATIONS||[])place.guide_status=statuses[place.name]||'provisional';})(typeof window!=='undefined'?window:globalThis);\n`;
  fs.writeFileSync(path.join(siteDir, 'destination-guide-status.js'), source, 'utf8');
}

function updateSitemap(siteDir, records, basePath) {
  const sitemapPath = path.join(siteDir, 'sitemap.xml');
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const existing = new Set([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]));
  const links = records.map(record => `https://decniner.github.io${basePath.replace(/\/?$/, '/') }places/${record.slug}/`);
  const additions = links.filter(link => !existing.has(link)).map(link => `  <url><loc>${link}</loc></url>`);
  if (additions.length) fs.writeFileSync(sitemapPath, xml.replace('</urlset>', `${additions.join('\n')}\n</urlset>`), 'utf8');
}

if (require.main === module) {
  const report = buildDestinationPages(path.resolve(__dirname, '..'));
  console.log(`Generated ${report.pagesWritten} destination pages from ${report.rawCount} raw records; ${report.completeCount} complete and ${report.provisionalCount} provisional.`);
}

module.exports = { buildDestinationPages };
