'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/destination-guide-details.json'), 'utf8'))
  .records['nikko-in-the-cedars'];
const file = path.join(root, 'places/nikko-in-the-cedars/index.html');
let html = fs.readFileSync(file, 'utf8');
const escapeHtml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ledeStart = '<p class="jg-lede">';
const ledeAt = html.indexOf(ledeStart);
const ledeEnd = html.indexOf('</p>', ledeAt);
if (ledeAt < 0 || ledeEnd < 0) throw new Error('Nikko story element not found');
const paragraphs = data.story.split('\n\n').map(escapeHtml);
html = `${html.slice(0, ledeAt)}${ledeStart}${paragraphs.join('<br><br>')}</p>${html.slice(ledeEnd + 4)}`;
const seasonStart = '<div class="jg-fact"><strong>SEASON & CONDITIONS</strong>';
const seasonAt = html.indexOf(seasonStart);
const seasonEnd = html.indexOf('</div>', seasonAt);
if (seasonAt < 0 || seasonEnd < 0) throw new Error('Nikko season fact element not found');
html = `${html.slice(0, seasonAt)}${seasonStart}${escapeHtml(data.seasonality)}</div>${html.slice(seasonEnd + 6)}`;
const arrivalAt = html.indexOf('<section class="jg-section jg-grid" id="arrival">');
const linksStart = html.indexOf('<ul>', arrivalAt);
const linksEnd = html.indexOf('</ul>', linksStart);
if (arrivalAt >= 0 && linksStart >= 0 && linksEnd >= 0 && !html.includes('https://visitnikko.jp/en/plan-your-trip/faqs/')) {
  const seasonalSource = '<li><a href="https://visitnikko.jp/en/plan-your-trip/faqs/" target="_blank" rel="noopener noreferrer">Nikko Official Guide: seasonal timing and fall foliage ↗</a></li>';
  html = `${html.slice(0, linksEnd)}${seasonalSource}${html.slice(linksEnd)}`;
}
fs.writeFileSync(file, html, 'utf8');
console.log('Updated Nikko story and source-backed season notes.');
