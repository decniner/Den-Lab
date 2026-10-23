'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { loadRawDestinations } = require('./destination-inventory.cjs');

const site = path.resolve(__dirname, '..');
const generatedScript = path.join(site, 'destination-photo-audit.js');
const auditJson = path.join(site, 'data/photo-audit.json');
const auditMarkdown = path.join(site, 'PHOTO_AUDIT.md');
const PAGE_SIZE = 40;
const DESCRIPTIVE_SUFFIX = /\s+(?:in bloom|by lamplight|from above|after dark|in blossom|in the cedars|temple to tide|steam and springs|from the water|unhurried|under steep roofs|beneath the alps|the mountain valley|at first light|after hours|between trees|after dusk|the old paths|a city of peace|land of old stories|art and sea|by bicycle|by river|steam rising|ancient green|harbor of many worlds|under mount yufu|island time|ryukyu memory|by foot and bicycle|snow and neon|mirror of the sky|a mountain of steps|in every season|the little edo|a temple town morning|the long way round|sea and sky|above kyoto|at blue hour|at sunset|a sacred approach|in layers|the golden pavilion)$/i;

function clean(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0*39;/g, "'").replace(/&#x27;/gi, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}
function normalize(value) {
  return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'").toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function nameCore(name) {
  return clean(name).replace(DESCRIPTIVE_SUFFIX, '').replace(/^(?:the|a|an)\s+/i, '').replace(/\s+[’']s$/i, '').replace(/[’']s\b/gi, '').trim();
}
function photoFileName(photo) {
  try {
    const match = new URL(photo.source).pathname.match(/\/wiki\/File:(.+)$/i);
    return match ? decodeURIComponent(match[1]).replace(/_/g, ' ') : null;
  } catch { return null; }
}
function sourceMetadata(page) {
  const info = page?.imageinfo?.[0];
  const meta = info?.extmetadata || {};
  return {
    title: page?.title?.replace(/^File:/i, '') || '',
    objectName: clean(meta.ObjectName?.value),
    description: clean(meta.ImageDescription?.value),
    categories: clean(meta.Categories?.value),
    photographer: clean(meta.Artist?.value || meta.Credit?.value),
    license: clean(meta.LicenseShortName?.value || meta.UsageTerms?.value),
    licenseUrl: clean(meta.LicenseUrl?.value),
    sourceUrl: info?.descriptionurl || ''
  };
}
function relevant(place, metadata) {
  const core = normalize(nameCore(place.name));
  const tokens = core.split(' ').filter(token => token && !['of','and','the','a','an','in','by','to','at','from','under','over','around','through','on'].includes(token));
  const evidence = normalize([metadata.title, metadata.objectName, metadata.description, metadata.categories].join(' '));
  if (!tokens.length) return false;
  if (evidence.includes(core)) return true;
  return tokens.every(token => new RegExp(`(?:^| )${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: |$)`).test(evidence));
}
function missingRow(place) {
  return {
    place: place.name,
    currentImageUrl: place.photo?.url || (place.image ? `https://images.unsplash.com/${place.image}?auto=format&fit=crop&w=950&q=82` : ''),
    sourcePage: place.photo?.source || '', photographer: place.photo?.credit || '',
    altText: place.photo?.alt || place.alt || '', license: place.photo?.license || '',
    verdict: 'UNVERIFIABLE', evidence: place.photo ? 'No retrievable source page metadata' : 'No source-backed destination photo in catalogue',
    action: 'Keep the existing image and identify it as illustrative; location not verified'
  };
}
async function fetchBatch(places) {
  const titles = places.map(place => photoFileName(place.photo)).filter(Boolean);
  if (!titles.length) return new Map();
  const params = new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|extmetadata', titles: titles.map(title => `File:${title}`).join('|') });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': 'SomewhereInJapan content audit (https://decniner.github.io/Den-Lab/SomeWhereInJapan/)' } });
  if (!response.ok) throw new Error(`Wikimedia Commons returned HTTP ${response.status}`);
  const data = await response.json();
  return new Map(Object.values(data.query?.pages || {}).map(page => [normalize(page.title.replace(/^File:/i, '')), sourceMetadata(page)]));
}
function renderMarkdown(rows) {
  const cell = value => String(value || '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ').trim() || '—';
  const lines = [
    '# Photo audit: all 310 catalogue records', '',
    `Audited ${rows.length} catalogue records against their linked image source pages on ${new Date().toISOString().slice(0, 10)}. CORRECT means the Commons source page title, caption, or category metadata identifies the named place. This is a source-page verification, not a visual inspection of every image. UNVERIFIABLE images remain visible as illustrative images with that status disclosed; their existing source and credit metadata are preserved. No image is labelled WRONG unless its source page positively identifies a different place.`, '',
    '| Place | Current image URL | Source page | Credited photographer | Alt text | Verdict | Evidence / action |',
    '|---|---|---|---|---|---|---|'
  ];
  for (const row of rows) lines.push(`| ${cell(row.place)} | ${cell(row.currentImageUrl)} | ${cell(row.sourcePage)} | ${cell(row.photographer)} | ${cell(row.altText)} | ${row.verdict} | ${cell(`${row.evidence}; ${row.action}`)} |`);
  const counts = Object.fromEntries(['CORRECT','WRONG','UNVERIFIABLE'].map(verdict => [verdict, rows.filter(row => row.verdict === verdict).length]));
  lines.push('', `**Verdict totals:** ${counts.CORRECT} CORRECT, ${counts.WRONG} WRONG, ${counts.UNVERIFIABLE} UNVERIFIABLE.`, '');
  return lines.join('\n');
}
function renderVerificationScript(rows) {
  const byPlace = Object.fromEntries(rows.map(row => [row.place, row]));
  return `(function(root){'use strict';const rows=${JSON.stringify(byPlace)};for(const place of root.DESTINATIONS||[]){const row=rows[place.name];if(!row)continue;place.photoAudit={verdict:row.verdict,evidence:row.evidence};if(row.verdict!=='CORRECT')continue;place.image='';place.alt=row.altText;place.photo={url:row.currentImageUrl,source:row.sourcePage,credit:row.photographer,license:row.license,licenseUrl:row.licenseUrl,alt:row.altText};}})(typeof window!=='undefined'?window:globalThis);\n`;
}
async function run() {
  const places = loadRawDestinations(site, { includePhotoAudit: false, includeGuideStatus: false });
  const rows = new Map(places.map(place => [place.name, missingRow(place)]));
  const candidates = places.filter(place => place.photo?.source?.includes('commons.wikimedia.org/wiki/File:'));
  for (let start = 0; start < candidates.length; start += PAGE_SIZE) {
    const batch = candidates.slice(start, start + PAGE_SIZE);
    const metadata = await fetchBatch(batch);
    for (const place of batch) {
      const fileName = photoFileName(place.photo);
      const page = metadata.get(normalize(fileName));
      if (!page?.sourceUrl || !page.license || !page.licenseUrl) continue;
      const match = relevant(place, page);
      const previous = rows.get(place.name);
      if (!match) {
        rows.set(place.name, { ...previous, sourcePage: page.sourceUrl, photographer: page.photographer, license: page.license, evidence: `Commons title: ${page.title}; categories: ${page.categories || 'none'}; place match not established`, action: 'Keep the existing image and identify it as illustrative; location not verified' });
        continue;
      }
      const altText = page.objectName || page.description || `View of ${place.name}`;
      rows.set(place.name, { place: place.name, currentImageUrl: place.photo.url, sourcePage: page.sourceUrl,
        photographer: page.photographer, altText, license: page.license, licenseUrl: page.licenseUrl,
        verdict: 'CORRECT', evidence: `Commons file page identifies the place in its title, caption, or categories: ${page.title}`, action: 'Keep with source-page photographer and license attribution' });
    }
    console.log(`Checked ${Math.min(start + batch.length, candidates.length)} of ${candidates.length} Commons image pages`);
  }
  const result = places.map(place => rows.get(place.name));
  fs.writeFileSync(auditJson, `${JSON.stringify({ generatedOn: new Date().toISOString().slice(0,10), count: result.length, rows: result }, null, 2)}\n`, 'utf8');
  fs.writeFileSync(auditMarkdown, renderMarkdown(result), 'utf8');
  fs.writeFileSync(generatedScript, renderVerificationScript(result), 'utf8');
  console.log(`Wrote photo audit for ${result.length} catalogue records: ${result.filter(row=>row.verdict==='CORRECT').length} CORRECT, ${result.filter(row=>row.verdict==='UNVERIFIABLE').length} UNVERIFIABLE.`);
}

if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { nameCore, relevant, sourceMetadata, renderMarkdown };
