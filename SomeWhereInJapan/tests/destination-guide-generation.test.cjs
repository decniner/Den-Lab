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
    assert.ok(html.includes(`<title>${esc(record.name)} · Japan field guide</title>`));
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    assert.ok(canonical, record.id);
    titles.add(html.match(/<title>(.*?)<\/title>/)[1]); canonicals.add(canonical[1]);
    assert.ok(html.includes(esc(rawByName.get(record.name).description)), record.id);
    assert.match(html, /Guide research is incomplete/);
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
  assert.equal(report.completeCount, 0);
  assert.equal(report.provisionalCount, 310);
  for (const record of report.records) {
    const html = fs.readFileSync(path.join(site, record.pagePath.replaceAll('/', path.sep)), 'utf8');
    assert.match(html, /Guide research is incomplete/i);
  }
});

test('rendersResearchedNotesWithLinkedSourcesAndOpenResearchGaps', () => {
  const report = buildDestinationPages(site);
  const asakusa = report.records.find(record=>record.id==='senso-ji-and-asakusa-lanes');
  const html = fs.readFileSync(path.join(site,asakusa.pagePath.replaceAll('/',path.sep)),'utf8');
  assert.ok(html.includes('Asakusa’s appeal comes from how its temple approach'));
  assert.ok(html.includes('https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/index.html'));
  assert.match(html,/Guide research is incomplete/);
  assert.match(html,/sourced map coordinates/i);
});

