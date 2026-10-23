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
  if (!photo?.source) return '<p>No verified image source has been added yet.</p>';
  return `<p>Catalogue image attribution: <a href="${escapeHtml(photo.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(photo.credit || 'Image source')}</a>${photo.license ? ` · ${escapeHtml(photo.license)}` : ''}. Image provenance is inherited from the existing catalogue and has not yet been independently rechecked for this guide.</p>`;
}

function imageMarkup(place, researchedPhoto) {
  const photo = researchedPhoto?.status === 'verified' ? researchedPhoto : place.photo;
  if (!photo?.url) return '<div class="destination-photo-gap"><div><span aria-hidden="true">⌖</span><p>No credited destination photo in the current catalogue</p></div></div>';
  const alt = photo.alt || place.alt || `Catalogue image associated with ${place.name}`;
  const label = researchedPhoto?.status === 'verified' ? 'Verified destination photo' : 'Catalogue photo';
  return `<img src="${escapeHtml(photo.url)}" alt="${escapeHtml(alt)}" loading="eager" decoding="async"><figcaption>${label} · <a href="${escapeHtml(photo.source || '#')}" target="_blank" rel="noopener noreferrer">image source and attribution</a></figcaption>`;
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
  const gaps = [...new Set(completion.missing.map(item => gapText[item] || item))];
  const months = Array.isArray(raw.months) && raw.months.length
    ? `<strong>Existing atlas month suggestions:</strong> ${raw.months.map(month => new Intl.DateTimeFormat('en', { month:'long', timeZone:'UTC' }).format(new Date(Date.UTC(2020, month - 1, 1)))).join(', ')}. These are not independently verified here.`
    : 'Seasonal guidance has not been independently verified yet.';
  const sources = new Map((details.sources || []).map(source => [source.id, source]));
  const points = (details.points || []).map(point => `<li><strong>${escapeHtml(point.name)}</strong>${point.address ? ` · ${escapeHtml(point.address)}` : ''}${point.description ? `<p>${escapeHtml(point.description)}</p>` : ''}</li>`).join('') || '<li>Exact visit points are still being researched.</li>';
  const modes = ['rail','bus','air','car'].map(mode => {
    const item = details.accessModes?.[mode];
    const text = item?.status === 'known' ? item.detail : item?.status === 'not-applicable' ? (item.note || 'Not applicable') : (item?.note || 'Not yet verified');
    const refs = (item?.sourceIds || []).map(id => sources.get(id)).filter(Boolean).map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title || source.organization || id)}</a>`).join(', ');
    return `<li><strong>${mode[0].toUpperCase()+mode.slice(1)}:</strong> ${escapeHtml(text)}${refs ? ` (${refs})` : ''}</li>`;
  }).join('');
  const claims = (details.claims || []).map(claim => {
    const refs = (claim.sourceIds || []).map(id => sources.get(id)).filter(Boolean).map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.organization || source.title || source.id)}</a>`).join(', ');
    return `<li>${escapeHtml(claim.text)}${refs ? ` <span>Source: ${refs}</span>` : ''}</li>`;
  }).join('') || '<li>Research claims have not been added.</li>';
  const stay = (details.stayRecommendations || []).map(item => `${escapeHtml(item.name)}${item.area ? ` · ${escapeHtml(item.area)}` : ''}`).join('<br>') || 'No source-backed stay recommendation yet.';
  const contact = (details.contacts || []).map(item => item.phone ? `<a href="tel:${escapeHtml(item.phone)}">${escapeHtml(item.name || item.phone)}</a>` : escapeHtml(item.note || 'No verified phone contact yet.')).join('<br>') || 'No verified phone contact yet.';
  const costs = (details.costs || []).map(item => item.status === 'known' ? `${escapeHtml(item.currency)} ${escapeHtml(item.amount)}` : item.status === 'not-applicable' ? 'Not applicable' : 'Not verified').join('<br>') || 'Costs have not been verified.';
  const sourcesMarkup = (details.sources || []).map(source => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title || source.organization || source.id)}</a> · checked ${escapeHtml(source.checkedOn || 'date not recorded')}${source.evidenceNotes ? ` · ${escapeHtml(source.evidenceNotes)}` : ''}</li>`).join('');
  const sourceLedger = `<h2>Research sources</h2><ul class="destination-list">${sourcesMarkup || '<li>No guide-specific source records yet.</li>'}</ul>${sourceLinks(raw)}`;
  const base = DEFAULT_BASE;
  const absolute = `https://decniner.github.io${base}places/${record.slug}/`;
  const query = encodeURIComponent(`${record.name} ${raw.place || raw.region} Japan`);
  const tokens = {
    TITLE: escapeHtml(title), DESCRIPTION: escapeHtml(raw.description || `${record.name} in ${raw.region}, Japan.`), CANONICAL: escapeHtml(absolute),
    TITLE_TEXT: escapeHtml(record.name), REGION: escapeHtml(raw.region), TYPE: escapeHtml(record.type), PLACE: escapeHtml(raw.place || raw.region),
    DESCRIPTION: escapeHtml(raw.description || ''), TAGS: tags, IMAGE: imageMarkup(raw, details.photo), SEASON: escapeHtml(details.season || months),
    STORY: escapeHtml(details.story || raw.description || ''), VISIT_PLAN: escapeHtml(details.visitPlan || ''),
    ACCESS: escapeHtml(details.access || 'Specific arrival and local access details have not been verified.'), POINTS: points,
    ACCESS_MODES: modes, CONTACT: contact, STAY: stay, WEATHER: escapeHtml(details.weatherPlan?.alternative || 'No source-backed weather alternative yet.'),
    COSTS: costs, CLAIMS: claims, GAPS: gaps.map(gap => `<li>${escapeHtml(gap)}</li>`).join(''),
    STATUS_TITLE: completion.complete ? 'Research checked for this guide' : 'Guide research is incomplete',
    STATUS_COPY: completion.complete ? 'This guide meets the current source and field requirements. Recheck changing details before travel.' : 'This page combines the existing atlas with researched notes where available. The list below identifies what still needs checking.',
    MAP_URL: `https://www.google.com/maps/search/?api=1&query=${query}`,
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
    const duplicateImage = record.raw.photo?.url && seenImages.has(record.raw.photo.url);
    if (record.raw.photo?.url && !duplicateImage) seenImages.add(record.raw.photo.url);
    const output = path.join(siteDir, 'places', record.slug, 'index.html');
    fs.mkdirSync(path.dirname(output), { recursive:true });
    fs.writeFileSync(output, pageHtml(template, { ...record, raw: duplicateImage ? { ...record.raw, photo:null } : record.raw }, destinationDetails || {}, completion), 'utf8');
    return {
      id: record.id, slug: record.slug, name: record.name, region: record.region, type: record.type,
      pagePath: `places/${record.slug}/index.html`, url: `${basePath.replace(/\/?$/, '/') }places/${record.slug}/`,
      aliasOf: null, oldPaths: record.oldPaths || [], guideStatus: completion.complete ? 'complete' : 'incomplete',
      missing: completion.missing, sourceStatus: destinationDetails?.sources?.length ? 'sources-recorded' : 'not-researched',
      imageStatus: duplicateImage ? 'duplicate-suppressed' : record.raw.photo?.url ? 'catalogue-attribution-pending-review' : 'missing',
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
    incompleteCount:records.filter(record => record.guideStatus !== 'complete').length,
    records
  };
  fs.writeFileSync(path.join(siteDir, 'data/coverage-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  updateSitemap(siteDir, records, basePath);
  writeGuideLinks(siteDir, records, identities.records, basePath);
  return { rawCount:raw.length, canonicalCandidateCount:canonical.length, pagesWritten:records.length,
    completeCount:manifest.completeCount, incompleteCount:manifest.incompleteCount, aliasPaths, records };
}

function writeGuideLinks(siteDir, records, identities, basePath) {
  const routeGuides = readJson(path.join(siteDir, 'data/route-guide-urls.json')).records;
  const destinationIndex = Object.fromEntries(identities.map(identity => [identity.name, {
    id: identity.id, slug: identity.slug, canonicalId: identity.aliasOf || identity.id, aliasOf: identity.aliasOf || null
  }]));
  const routeIndex = Object.fromEntries(routeGuides.map(route => [route.id, { slug: route.id }]));
  const data = JSON.stringify({ destinations:destinationIndex, routes:routeIndex }).replace(/</g, '\\u003c');
  const source = `(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.GuideLinks=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';const index=${data};function base(value){return '/'+String(value||'').split('/').filter(Boolean).join('/')+'/';}function guideUrlFor(id,manifest,basePath){const rows=Array.isArray(manifest)?manifest:(manifest&&manifest.records)||[];const record=rows.find(item=>item.id===id||item.canonicalId===id);if(!record)return null;const canonical=record.canonicalId||record.id;const target=rows.find(item=>item.id===canonical)||record;return base(basePath||'${basePath}')+'places/'+(target.slug||record.slug)+'/';}function routeGuideUrlFor(id,routeGuides,basePath){const rows=Array.isArray(routeGuides)?routeGuides:(routeGuides&&routeGuides.records)||[];const route=rows.find(item=>item.id===id);return route?base(basePath||'${basePath}')+'day-trips/'+(route.slug||route.id)+'/':null;}function destinationIdForName(name){return index.destinations[name]?.id||null;}function destinationUrl(name){const identity=index.destinations[name];if(!identity)return null;const target=index.destinations[name]||identity;return base('${basePath}')+'places/'+(target.slug||target.id)+'/';}function routeUrl(id){return routeGuideUrlFor(id,Object.entries(index.routes).map(([key,value])=>({id:key,...value})),'${basePath}');}return Object.freeze({guideUrlFor,routeGuideUrlFor,destinationIdForName,destinationUrl,routeUrl,index});});\n`;
  fs.writeFileSync(path.join(siteDir, 'guide-links.js'), source, 'utf8');
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
  console.log(`Generated ${report.pagesWritten} initial destination pages from ${report.rawCount} raw records; ${report.completeCount} researched guides complete and ${report.incompleteCount} incomplete.`);
}

module.exports = { buildDestinationPages };
