const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildDestinationPages } = require('../tools/build-destination-guides.cjs');
const { loadRawDestinations } = require('../tools/destination-inventory.cjs');
const site = path.resolve(__dirname, '..');
const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

test('generatesOneDirectPageForEveryRawRecord', () => {
  const report = buildDestinationPages(site);
  assert.equal(report.rawCount, 310);
  assert.equal(report.pagesWritten, report.canonicalCandidateCount);
  for (const record of report.records) assert.ok(fs.existsSync(path.join(site, record.pagePath.replaceAll('/', path.sep))), record.id);
});

test('pagesUseUniqueMetadataAndInitialContent', () => {
  const report = buildDestinationPages(site);
  const rawByName = new Map(loadRawDestinations(site).map(place => [place.name, place]));
  const titles = new Set(); const canonicals = new Set();
  for (const record of report.records) {
    const html = fs.readFileSync(path.join(site, record.pagePath.replaceAll('/', path.sep)), 'utf8');
    assert.match(html, /<title>[^<]+<\/title>/i, record.id);
    assert.match(html, /<h1\b[^>]*>(?:[^<]|<[^>]+>)+<\/h1>/i, record.id);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    assert.ok(canonical, record.id);
    titles.add(html.match(/<title>(.*?)<\/title>/)[1]); canonicals.add(canonical[1]);
    assert.match(html, /<meta\s+name="description"\s+content="[^"]+"/i, record.id);
    const renderedHeading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    const identityWord = record.name.split(/[ ,.:—–-]+/)[0].toLowerCase();
    assert.ok(renderedHeading && identityWord.length > 2 && renderedHeading.includes(identityWord), record.id);
  }
  assert.equal(titles.size, 310); assert.equal(canonicals.size, 310);
});

test('aliasesRetainOldPaths', () => {
  const report = buildDestinationPages(site);
  for (const record of report.records.filter(item => item.aliasOf)) {
    assert.ok(record.oldPaths.length && record.oldPaths.every(url => report.aliasPaths.includes(url)));
  }
});

test('existingRouteGuidesKeepTheirURLs', () => {
  for (const id of ['kawagoe','sawara','mitake','narita','odawara']) assert.ok(fs.existsSync(path.join(site,'day-trips',id,'index.html')));
});

test('incompleteGuidesAreNotPresentedAsComplete', () => {
  const report = buildDestinationPages(site);
  assert.equal(report.completeCount, 1);
  assert.equal(report.provisionalCount, 309);
  for (const record of report.records) {
    assert.equal(record.guideStatus, record.id === 'nikko-in-the-cedars' ? 'complete' : 'provisional', record.id);
    assert.equal(record.guide_status, record.guideStatus, `${record.id} status aliases agree`);
  }
});

test('rendersResearchedNotesWithLinkedSourcesAndOpenResearchGaps', () => {
  const report = buildDestinationPages(site);
  const asakusa = report.records.find(record=>record.id==='senso-ji-and-asakusa-lanes');
  const html = fs.readFileSync(path.join(site,asakusa.pagePath.replaceAll('/',path.sep)),'utf8');
  const details = JSON.parse(fs.readFileSync(path.join(site, 'data/destination-guide-details.json'), 'utf8')).records[asakusa.id];
  assert.ok(details.story.includes('Asakusa’s appeal comes from how its temple approach'));
  assert.ok(html.includes('https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/index.html'));
  assert.ok(details.sources.some(source => source.url === 'https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/index.html'));
  assert.match(html, /data-place-route-guide/);
});

test('destinationGuidesDoNotForceLongMixedRoutesIntoWalkingMode', () => {
  const report = buildDestinationPages(site);
  const kiyomizu = report.records.find(record => record.id === 'kiyomizu-dera-above-kyoto');
  const html = fs.readFileSync(path.join(site, kiyomizu.pagePath.replaceAll('/', path.sep)), 'utf8');
  assert.match(html, /data-place-route-guide/);
  assert.match(html, /place-route-ui\.js/);
  assert.match(html, /city-route-ui\.js/);
  assert.match(fs.readFileSync(path.join(site, 'city-route-ui.js'), 'utf8'), /city-route-shared/);
});

test('singleDestinationDirectionsDoNotForceWalkingMode', () => {
  const report = buildDestinationPages(site);
  const glover = report.records.find(record => record.id === 'glover-garden');
  const html = fs.readFileSync(path.join(site, glover.pagePath.replaceAll('/', path.sep)), 'utf8');
  assert.match(html, /data-place-route-guide[^>]+data-route-kind="location"/);
  assert.match(html, /google-maps-routes\.js/);
  assert.doesNotMatch(html, /travelmode=walking/);
});

test('shortSingleModeRoutesOpenAsOrderedGoogleMapsTransitRoutes', () => {
  const report = buildDestinationPages(site);
  const tokyo = report.records.find(record => record.id === 'tokyo-in-layers');
  const html = fs.readFileSync(path.join(site, tokyo.pagePath.replaceAll('/', path.sep)), 'utf8');
  assert.match(html, /data-place-route-guide[^>]+data-route-kind="location"/);
  assert.match(html, /google-maps-routes\.js/);
  assert.doesNotMatch(html, /travelmode=walking/);
});

test('mixedModeRoutesOfferModeSpecificDirectionsForEachLeg', () => {
  const report = buildDestinationPages(site);
  const sapporo = report.records.find(record => record.id === 'sapporo-beer-museum');
  const html = fs.readFileSync(path.join(site, sapporo.pagePath.replaceAll('/', path.sep)), 'utf8');
  assert.match(html, /data-place-route-guide[^>]+data-route-kind="location"/);
  assert.match(html, /google-maps-routes\.js/);
  assert.doesNotMatch(html, /travelmode=walking/);
});

test('NikkoKeepsItsMixedRouteLegsSeparateInsteadOfOpeningOneWalkingItinerary', () => {
  const html = fs.readFileSync(path.join(site, 'places', 'nikko-in-the-cedars', 'index.html'), 'utf8');
  assert.match(html, /Walking route on Google Maps/);
  assert.match(html, /Taiyuin\/Futarasan stop/);
  assert.match(html, /travelmode=walking/);
  assert.match(html, /World Heritage Sightseeing Bus/);
  assert.match(html, /travelmode=transit/);
  assert.match(html, /data-place-route-guide/);
  assert.match(fs.readFileSync(path.join(site, 'city-route-ui.js'), 'utf8'), /city-route-shared/);
});

