const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.resolve(__dirname, '..');
const api = require('../guide-links.js');
const manifest = JSON.parse(fs.readFileSync(path.join(site,'data/coverage-manifest.json'),'utf8'));
const routeGuides = JSON.parse(fs.readFileSync(path.join(site,'data/route-guide-urls.json'),'utf8'));

test('allDestinationCardsAndSearchResultsLinkToGuide', () => {
  const index = fs.readFileSync(path.join(site,'index.html'),'utf8');
  const app = fs.readFileSync(path.join(site,'app.js'),'utf8');
  assert.match(index,/guide-links\.js/);
  assert.match(app,/GuideLinks\?\.destinationUrl\(place\.name\)/);
  for (const record of manifest.records) assert.equal(api.destinationUrl(record.name),record.url,record.name);
});

test('destination result images navigate directly to each place guide', () => {
  const app = fs.readFileSync(path.join(site,'app.js'),'utf8');
  assert.match(app,/const guideUrl\s*=\s*window\.GuideLinks\?\.destinationUrl\(place\.name\)/);
  assert.match(app,/const photoLink\s*=\s*document\.createElement\('a'\)/);
  assert.match(app,/photoLink\.href\s*=\s*guideUrl/);
  assert.match(app,/imageWrap\.append\(photoLink/);
  assert.doesNotMatch(app,/photoButton\.addEventListener\('click',\(\)\s*=>\s*showPlace\(place/);
  for (const record of manifest.records) assert.ok(api.destinationUrl(record.name),record.name);
});

test('routeStopsResolveByCanonicalId', () => {
  const cityUi = fs.readFileSync(path.join(site,'city-origin-ui.js'),'utf8');
  assert.match(cityUi,/GuideLinks\?\.destinationUrl\(stop\.name\)/);
  assert.equal(api.routeGuideUrlFor('kawagoe',routeGuides,'/Den-Lab/SomeWhereInJapan/'),'/Den-Lab/SomeWhereInJapan/day-trips/kawagoe/');
  assert.equal(api.destinationUrl('Kawagoe, the little Edo'),'/Den-Lab/SomeWhereInJapan/places/kawagoe-the-little-edo/');
});

test('basePathIsPreserved', () => {
  assert.equal(api.guideUrlFor(manifest.records[0].id,manifest,'/Den-Lab/SomeWhereInJapan/'),`/Den-Lab/SomeWhereInJapan/places/${manifest.records[0].slug}/`);
  assert.equal(api.guideUrlFor(manifest.records[0].id,manifest,'/preview/site/'),`/preview/site/places/${manifest.records[0].slug}/`);
});

test('sitemapContainsAllCanonicalAndLegacyGuidePaths', () => {
  const sitemap = fs.readFileSync(path.join(site,'sitemap.xml'),'utf8');
  for (const record of manifest.records) assert.ok(sitemap.includes(`https://decniner.github.io${record.url}`),record.id);
  for (const record of routeGuides.records) assert.ok(sitemap.includes(`https://decniner.github.io${record.url}`),record.id);
});
