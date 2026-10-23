'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const audit = JSON.parse(fs.readFileSync(path.join(root, 'data/photo-audit.json'), 'utf8'));
const destination = audit.rows;
const cities = Object.entries(require(path.join(root, 'city-stop-photos.js'))).map(([place, photo]) => ({
  place, url: photo.url, source: photo.verification?.source_page, credit: photo.verification?.credit,
  license: photo.verification?.license, alt: photo.verification?.alt,
  verdict: photo.verification?.verified === true && photo.url && photo.verification.source_page && photo.verification.credit && photo.verification.license && photo.verification.alt ? 'KEPT' : 'REMOVED',
  surface: 'City route stop photo', action: 'Rendered only when the complete verification record passes the runtime gate'
}));
const trips = [
  { place: 'Kawagoe day trip', file: 'Kurazukuri Street in Little Edo.jpg', source: 'https://commons.wikimedia.org/wiki/File:Kurazukuri_Street_in_Little_Edo.jpg', credit: 'Dandy1022', license: 'CC BY-SA 4.0', alt: 'The Kurazukuri merchant street in Kawagoe, Saitama' },
  { place: 'Sawara day trip' }, { place: 'Mitake day trip' }, { place: 'Narita day trip' },
  { place: 'Odawara day trip', file: 'Odawara Castle.jpg', source: 'https://commons.wikimedia.org/wiki/File:Odawara_Castle.jpg', credit: 'ZAC', license: 'CC BY 2.0', alt: 'Odawara Castle in Kanagawa, Japan' }
].map(row => ({ ...row, url: row.file ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(row.file)}?width=1600` : '', verdict: row.file ? 'KEPT' : 'REMOVED', surface: 'Day-trip guide hero', action: row.file ? 'Destination-specific Commons file page retained' : 'Removed: no destination-specific source-backed photograph was retained' }));
const cell = value => String(value || '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ').trim() || '—';
const placements = [...destination.map(row => ({ ...row, verdict: row.verdict === 'CORRECT' ? row.previousUrl && row.previousUrl !== row.currentImageUrl ? 'REPLACED' : 'KEPT' : 'REMOVED', surface: 'Catalogue destination photo' })), ...cities, ...trips];
const counts = Object.fromEntries(['KEPT', 'REPLACED', 'REMOVED'].map(key => [key, placements.filter(row => row.verdict === key).length]));
const page = [
  '# Photo audit: all destination image surfaces', '',
  `**Headline:** ${placements.length} photo placements audited; ${counts.KEPT} kept, ${counts.REPLACED} replaced, ${counts.REMOVED} removed.`, '',
  `Coverage includes ${destination.length} catalogue destinations across cards/search, place dialog, seasonal/monthly results, and field-guide headers; ${cities.length} city-route stop photos; and ${trips.length} day-trip guide heroes. Catalog photos require destination-specific source evidence, credit, license, and alt text. Every uncertain photo is removed.`, '',
  '| Place | Surface | Previous image URL | Image URL | Source page | Credit | License | Verdict | New alt text | Evidence / action |',
  '|---|---|---|---|---|---|---|---|---|---|'
];
for (const row of destination) {
  const verdict = row.verdict === 'CORRECT' ? row.previousUrl && row.previousUrl !== row.currentImageUrl ? 'REPLACED' : 'KEPT' : 'REMOVED';
  for (const surface of ['Place cards and search results', 'Place detail dialog', 'Seasonal and monthly results', 'Place field guide header']) page.push(`| ${cell(row.place)} | ${surface} | ${cell(row.previousUrl)} | ${cell(row.currentImageUrl)} | ${cell(row.sourcePage)} | ${cell(row.photographer)} | ${cell(row.license)} | ${verdict} | ${cell(row.altText)} | ${cell(row.evidence || row.action)} |`);
}
for (const row of [...cities, ...trips]) page.push(`| ${cell(row.place)} | ${row.surface} |  | ${cell(row.url)} | ${cell(row.source)} | ${cell(row.credit)} | ${cell(row.license)} | ${row.verdict} | ${cell(row.alt)} | ${cell(row.action)} |`);
page.push('', `**Verdict totals:** ${counts.KEPT} KEPT, ${counts.REPLACED} REPLACED, ${counts.REMOVED} REMOVED.`, '');
fs.writeFileSync(path.join(root, 'PHOTO_AUDIT.md'), page.join('\n'), 'utf8');
console.log(`Audited ${placements.length} photo placements: ${counts.KEPT} kept, ${counts.REPLACED} replaced, ${counts.REMOVED} removed.`);
