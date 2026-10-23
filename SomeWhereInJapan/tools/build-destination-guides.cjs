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

function imageMarkup(place) {
  if (!place.photo?.url) return '<div class="destination-photo-gap"><div><span aria-hidden="true">⌖</span><p>No credited destination photo in the current catalogue</p></div></div>';
  const alt = place.photo.alt || place.alt || `Catalogue image associated with ${place.name}`;
  return `<img src="${escapeHtml(place.photo.url)}" alt="${escapeHtml(alt)}" loading="eager" decoding="async"><figcaption>Catalogue photo · <a href="${escapeHtml(place.photo.source || '#')}" target="_blank" rel="noopener noreferrer">image source and attribution</a></figcaption>`;
}

function pageHtml(template, record, manifestRecord) {
  const raw = record.raw;
  const title = `${record.name} · Japan field guide`;
  const tags = (raw.tags || []).map(tag => `<span class="destination-tag">${escapeHtml(tag)}</span>`).join('');
  const gaps = ['Verified address and visitor entrance','Current opening days, seasonal closures, and admission','How to arrive by rail, bus, air, and car','On-site route, exact points to explore, and time allowances','A named phone contact and nearby stay recommendations','Sources checked for the facts on this page'];
  const months = Array.isArray(raw.months) && raw.months.length
    ? `<strong>Existing atlas month suggestions:</strong> ${raw.months.map(month => new Intl.DateTimeFormat('en', { month:'long', timeZone:'UTC' }).format(new Date(Date.UTC(2020, month - 1, 1)))).join(', ')}. These are not independently verified here.`
    : 'Seasonal guidance has not been independently verified yet.';
  const base = DEFAULT_BASE;
  const absolute = `https://decniner.github.io${base}places/${record.slug}/`;
  const query = encodeURIComponent(`${record.name} ${raw.place || raw.region} Japan`);
  const tokens = {
    TITLE: escapeHtml(title), DESCRIPTION: escapeHtml(raw.description || `${record.name} in ${raw.region}, Japan.`), CANONICAL: escapeHtml(absolute),
    TITLE_TEXT: escapeHtml(record.name), REGION: escapeHtml(raw.region), TYPE: escapeHtml(record.type), PLACE: escapeHtml(raw.place || raw.region),
    DESCRIPTION: escapeHtml(raw.description || ''), TAGS: tags, IMAGE: imageMarkup(raw), SEASON: escapeHtml(months),
    GAPS: gaps.map(gap => `<li>${escapeHtml(gap)}</li>`).join(''), MAP_URL: `https://www.google.com/maps/search/?api=1&query=${query}`,
    VIDEO_URL: `https://www.youtube.com/results?search_query=${query}`, SOURCES: sourceLinks(raw), GENERATED: GENERATED_ON
  };
  return replaceTokens(template, tokens).replace('%%DESCRIPTION%%', escapeHtml(raw.description || `${record.name} in ${raw.region}, Japan.`));
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
    fs.writeFileSync(output, pageHtml(template, { ...record, raw: duplicateImage ? { ...record.raw, photo:null } : record.raw }, { completion }), 'utf8');
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
