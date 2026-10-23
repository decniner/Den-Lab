'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadRawDestinations } = require('../tools/destination-inventory.cjs');

const site = path.resolve(__dirname, '..');
const photoData = photo => photo?.verification;
const isComplete = photo => Boolean(photoData(photo)?.verified === true &&
  photoData(photo)?.source_page?.trim() && photoData(photo)?.credit?.trim() &&
  photoData(photo)?.license?.trim() && photoData(photo)?.alt?.trim());

test('every catalogue image has a complete verified source record and unique place URL', () => {
  const places = loadRawDestinations(site);
  const used = new Map();
  for (const place of places) {
    assert.equal(place.image || '', '', `${place.name} still has an unverified fallback image`);
    if (!place.photo?.url) continue;
    assert.ok(isComplete(place.photo), `${place.name} image lacks its verification record`);
    const prior = used.get(place.photo.url);
    assert.ok(!prior || prior === place.name, `${place.photo.url} is shared by ${prior} and ${place.name}`);
    used.set(place.photo.url, place.name);
  }
});

test('confirmed photo-purge offenders have the required verified or photo-less outcome', () => {
  const rows = require('../data/photo-audit.json').rows;
  const outcome = name => rows.find(row => row.place.toLowerCase() === name.toLowerCase());
  for (const name of ['Shiretoko’s wild edge','Furano in bloom','Kawagoe, the little Edo','Otaru by lamplight','Hiraizumi’s quiet temples','Lake Toya, volcanic calm','The blue of Biei']) {
    const row = outcome(name);
    assert.ok(row && row.verdict === 'CORRECT' && row.previousUrl && row.currentImageUrl, `${name} must use a verified replacement`);
  }
  for (const name of ['Kamakura, temple to tide','Edo-Tokyo Open Air Architectural Museum','Shuri, Ryukyu memory','Tottori’s shifting dunes','Yamadera, a mountain of steps','Kiso Valley post towns','Hakodate from above','Hirosaki in blossom','Tottori Sand Dunes at sunset']) {
    const row = outcome(name);
    assert.ok(row && row.verdict === 'REMOVED' && !row.currentImageUrl, `${name} must have no unverified rendered photo`);
  }
  const buddha = outcome('Great Buddha of Kamakura');
  assert.ok(buddha?.verdict === 'CORRECT' && !buddha.previousUrl && buddha.currentImageUrl, 'the correct Daibutsu photo remains with verified attribution');
});

test('every city-route photo has source, credit, license, alt, and verification data', () => {
  const photos = require('../city-stop-photos.js');
  const used = new Map();
  for (const [place, photo] of Object.entries(photos)) {
    assert.ok(photo.url && photo.source && photo.credit && photo.license && photo.alt,
      `${place} is missing photo provenance`);
    assert.ok(isComplete(photo), `${place} photo is not verified`);
    const prior = used.get(photo.url);
    assert.ok(!prior || prior === place, `${photo.url} is shared by city stops ${prior} and ${place}`);
    used.set(photo.url, place);
  }
  assert.equal(Object.keys(photos).length, 44, 'all 44 current city-route photo records are covered');
});

test('every rendered destination-page photo is verified and credited', () => {
  const placeRoot = path.join(site, 'places');
  let pageCount=0,photoCount=0;
  for (const entry of fs.readdirSync(placeRoot, { withFileTypes: true }).filter(item => item.isDirectory())) {
    const page = path.join(placeRoot, entry.name, 'index.html');
    if (!fs.existsSync(page)) continue;
    pageCount+=1;
    const html = fs.readFileSync(page, 'utf8');
    assert.doesNotMatch(html, /<figure\b[^>]*>\s*<\/figure>/i, `${entry.name} has an empty photo frame`);
    for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
      photoCount+=1;
      assert.match(image[0], /data-photo-verified="true"/, `${entry.name} has an unverified rendered image`);
      for (const field of ['source', 'credit', 'license', 'alt']) {
        assert.match(image[0], new RegExp(`data-photo-${field}="[^"]+"`), `${entry.name} photo lacks ${field}`);
      }
    }
  }
  assert.equal(pageCount,310,'all 310 static destination guides are checked');
  assert.equal(photoCount,163,'only the 163 verified destination photos remain in guide headers');
});

test('day-trip guide photos are either verified and credited or absent', () => {
  const pages = ['kawagoe', 'sawara', 'mitake', 'narita', 'odawara'];
  for (const slug of pages) {
    const html = fs.readFileSync(path.join(site, 'day-trips', slug, 'index.html'), 'utf8');
    const images = [...html.matchAll(/<img\b[^>]*>/gi)];
    assert.ok(images.length <= 1, `${slug} has unexpected additional images`);
    for (const image of images) {
      assert.match(image[0], /data-photo-verified="true"/);
      for (const field of ['source', 'credit', 'license', 'alt']) assert.match(image[0], new RegExp(`data-photo-${field}="[^"]+"`));
    }
    assert.doesNotMatch(html, /<figure\b[^>]*>\s*<\/figure>/i, `${slug} has an empty photo frame`);
  }
});

test('place imagery has no illustrative or unverified treatment or dynamic unverified search gallery', () => {
  const productionFiles = ['app.js', 'city-origin-ui.js', 'city-field-guides.js', 'city-route-ui.js', 'index.html', 'tools/build-destination-guides.cjs'];
  for (const relative of productionFiles) {
    const content = fs.readFileSync(path.join(site, relative), 'utf8');
    assert.doesNotMatch(content, /ILLUSTRATIVE IMAGE|Illustrative image|IMAGE\s*\/\s*UNVERIFIED|location unverified|findCommonsPhotos|Photo temporarily unavailable|Unsplash|see linked source|images\.unsplash\.com/i, relative);
  }
});

