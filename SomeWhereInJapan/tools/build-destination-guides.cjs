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

function imageMarkup(place, researchedPhoto) {
  const photo = researchedPhoto?.status === 'verified' ? researchedPhoto : place.photo;
  const illustrativeUrl = place.image ? `https://images.unsplash.com/${encodeURIComponent(place.image)}?auto=format&fit=crop&w=1400&q=85` : '';
  const imageUrl = photo?.url || illustrativeUrl;
  if (!imageUrl) return `<div class="destination-photo-gap" role="img" aria-label="Illustrated map card for ${escapeHtml(place.name)}"><span>${escapeHtml(place.region || 'Japan')}</span><strong>${escapeHtml(place.name)}</strong><small>Open the map to explore this place</small></div>`;
  const alt = photo?.alt || place.alt || `Illustrative image for ${place.name}`;
  const attribution = photo?.source
    ? `Photo: ${escapeHtml(photo.credit || 'Image source')} · <a href="${escapeHtml(photo.source)}" target="_blank" rel="noopener noreferrer">Source${photo.license ? ` · ${escapeHtml(photo.license)}` : ''}</a>`
    : `Illustrative image via <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">Unsplash</a>`;
  return `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(alt)}" loading="eager" decoding="async"><figcaption>${attribution}</figcaption>`;
}

function pageHtml(template, record, details, completion) {
  const raw = record.raw;
  const title = `${record.name} · Japan field guide`;
  const tags = (raw.tags || []).map(tag => `<span class="destination-tag">${escapeHtml(tag)}</span>`).join('');
  const gapText = {
    'stable id':'Stable destination identity','supported destination type':'Destination type review',
    story:'Destination story and context',visitPlan:'A visit plan',access:'Arrival and local access details',
    sources:'Source records', 'sourced material claims':'Source links for material claims',
    'claim source links':'Claim source links','valid source checkedOn date':'Valid source check dates',
    'missing-access-mode':'Rail, bus, air, and car access status','invalid-access-evidence':'Sourced access details',
    'missing-access-note':'Explanation of unknown access options','missing-visit-points':'Exact points to explore',
    'invalid-visit-point':'Visitor address and sourced map coordinates','missing-contact-evidence':'A verified visitor phone contact',
    'missing-stay-recommendations':'A sourced accommodation recommendation','photo-not-verified':'A unique, verified photo with license',
    'map-location-not-verified':'A verified map location','weather-plan-not-verified':'A source-backed weather alternative',
    'areas':'Specific areas or bases','walkingRoute':'An ordered neighborhood walk','highlights':'Attraction highlights',
    'arrivalOptions':'Island arrival options','routeSections':'Route sections','terrain':'Terrain and effort details'
  };
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
  const mapQuery = encodeURIComponent(`${mapPlace} ${raw.region} Japan`);
  const directionDestination = mapQuery;
  const hasRoute = record.id === 'nikko-in-the-cedars';
  const stayMarkup = stay || `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`hotels near ${mapPlace} ${raw.region} Japan`)}" target="_blank" rel="noopener noreferrer">Browse places to stay nearby</a>`;
  const contactMarkup = contact || `<a href="https://www.google.com/search?q=${encodeURIComponent(`${queryText} official contact phone`)}" target="_blank" rel="noopener noreferrer">Find the official visitor contact</a>`;
  const accessFallback = details.access || `Use the destination map and follow official visitor information for the current way to reach ${record.name}.`;
  const tokens = {
    TITLE: escapeHtml(title), DESCRIPTION: escapeHtml(raw.description || `${record.name} in ${raw.region}, Japan.`), CANONICAL: escapeHtml(absolute),
    TITLE_TEXT: escapeHtml(record.name), REGION: escapeHtml(raw.region), TYPE: escapeHtml(record.type), PLACE: escapeHtml(raw.place || raw.region),
    DESCRIPTION: escapeHtml(raw.description || ''), TAGS: tags, IMAGE: imageMarkup(raw, details.photo), SEASON: escapeHtml(details.season || months),
    STORY: escapeHtml(details.story || raw.description || ''), VISIT_PLAN: escapeHtml(details.visitPlan || `Start with ${record.name}, then use the map to choose nearby stops that match your pace and interests.`),
    ACCESS: escapeHtml(accessFallback), POINTS: points,
    ACCESS_MODES: modes || '<li>Open the map for current public transport and driving options from your starting point.</li>', CONTACT: contactMarkup, STAY: stayMarkup, WEATHER: escapeHtml(details.weatherPlan?.alternative || 'Check the attraction or local visitor site before setting out in poor weather.'),
    COSTS: costs || 'Check current admission and transport costs with the linked official visitor information.', CLAIMS: claims,
    STATUS_TITLE: '', STATUS_COPY: '',
    MAP_URL: `https://www.openstreetmap.org/search?query=${mapQuery}`,
    GOOGLE_MAP_URL: `https://www.google.com/maps/search/?api=1&query=${mapQuery}`,
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
  const inventory = buildInventory(raw, identities.records, basePath);
  const template = fs.readFileSync(path.join(siteDir, 'tools/templates/destination-guide.html'), 'utf8');
  const canonical = inventory.records.filter(record => !record.aliasOf);
  const seenImages = new Set();
  const records = canonical.map(record => {
    const destinationDetails = details[record.id];
    const completion = destinationDetails ? evaluateGuideCompletion({ id: record.id, type: record.type, ...destinationDetails }) : { complete:false, missing:['researched guide details'] };
    const imageKey = record.raw.photo?.url || record.raw.image || null;
    const duplicateImage = imageKey && seenImages.has(imageKey);
    if (imageKey && !duplicateImage) seenImages.add(imageKey);
    const output = path.join(siteDir, 'places', record.slug, 'index.html');
    fs.mkdirSync(path.dirname(output), { recursive:true });
    const existing = fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : '';
    if (!existing.includes('data-authored-guide="true"')) {
      fs.writeFileSync(output, pageHtml(template, { ...record, raw: duplicateImage ? { ...record.raw, photo:null, image:null } : record.raw }, destinationDetails || {}, completion), 'utf8');
    }
    return {
      id: record.id, slug: record.slug, name: record.name, region: record.region, type: record.type,
      pagePath: `places/${record.slug}/index.html`, url: `${basePath.replace(/\/?$/, '/') }places/${record.slug}/`,
      aliasOf: null, oldPaths: record.oldPaths || [], guideStatus: completion.complete ? 'complete' : 'provisional',
      guide_status: completion.complete ? 'complete' : 'provisional',
      missing: completion.missing, sourceStatus: destinationDetails?.sources?.length ? 'sources-recorded' : 'not-researched',
      imageStatus: duplicateImage ? 'duplicate-suppressed' : record.raw.photo?.url ? 'catalogue-attribution-pending-review' : record.raw.image ? 'illustrative-unsplash-image' : 'missing',
      mapStatus: record.raw.coordinates ? 'coordinates-present-pending-review' : 'no-coordinates'
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
