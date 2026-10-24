const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('mojibake repair handles common single-byte UTF-8 decoding corruption', () => {
  const { decodeMojibake } = require('../tools/mojibake.cjs');
  assert.equal(decodeMojibake('ChÅ«son-ji â€™cedarsâ€™'), 'Chūson-ji ’cedars’');
});

test('text-run repairs work inside multilingual HTML', () => {
  const { decodeMojibake } = require('../tools/mojibake.cjs');
  assert.equal(decodeMojibake('<p>valid 日本語 and \u00c2\u00b7 separator</p>'), '<p>valid 日本語 and \u00b7 separator</p>');
  assert.equal(decodeMojibake('Search complete \u00e2\u20ac\u201d scroll \u00e2\u2020\u2019'), 'Search complete \u2014 scroll \u2192');
});

test('runtime labels use a real remove icon and Kawagoe has no question-mark route label', () => {
  const daytripUi = fs.readFileSync(path.join(root, 'daytrip-app.js'), 'utf8');
  const routes = fs.readFileSync(path.join(root, 'data/place-routes.json'), 'utf8');
  assert.match(daytripUi, /compared\?'×':'\+'/);
  assert.doesNotMatch(daytripUi, /compared\?'\?'/);
  assert.doesNotMatch(routes, /Kawagoe Station \? west exit/i);
});

test('every rendered destination page has no unverified-photo label and only verified image credits', () => {
  const pages = fs.readdirSync(path.join(root, 'places'))
    .map(id => path.join(root, 'places', id, 'index.html'))
    .filter(file => fs.existsSync(file));
  assert.equal(pages.length, 310, 'audit every generated place guide');
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /Illustrative|UNVERIFIED|location not verified|has not been confirmed/i, path.basename(path.dirname(file)));
    for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
      assert.match(image[0], /data-photo-verified="true"/i, file);
      assert.match(image[0], /data-photo-source="https?:/i, file);
      assert.match(image[0], /data-photo-credit="[^"]+"/i, file);
      assert.match(image[0], /data-photo-license="[^"]+"/i, file);
    }
  }
});

test('strict text scan covers every rendered HTML surface and cross-contamination labels', () => {
  const files = [];
  const walk = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(file);
  } };
  walk(root);
  let guideCount = 0;
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /Illustrative|UNVERIFIED|location not verified|has not been confirmed/i, file);
    assert.doesNotMatch(html, /\u00c3\u0192|\u00e2\u20ac|\u00e2\u2020|\u00c2\u00b7/, file);
    assert.doesNotMatch(html, /Search YouTube for [^"']+ in Furano/i, file);
    assert.doesNotMatch(html, /(?:>|aria-label=["'])\s*\?\s*(?:<|["'])/i, `stray question-mark label: ${file}`);
    if (file.includes(`${path.sep}places${path.sep}`)) guideCount++;
  }
  assert.equal(guideCount, 310);
  assert.ok(files.length >= 318, 'app, city/day-trip pages and all 310 place guides are included');
  for (const file of ['app.js', 'city-route-ui.js', 'city-origin-ui.js']) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, file), 'utf8'), /\u00c3\u0192|\u00e2\u20ac|\u00e2\u2020|\u00c2\u00b7/, file);
  }
});

test('generated place guides do not use filename-style image alt text', () => {
  const pages = fs.readdirSync(path.join(root, 'places'))
    .map(id => path.join(root, 'places', id, 'index.html'))
    .filter(file => fs.existsSync(file));
  const filenameAlt = /alt="[^"]*(?:\b\w+[_ ]\d{2,}\b|\.(?:jpe?g|png|webp))[^\"]*"/i;
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    for (const image of html.matchAll(/<img\b[^>]*>/gi)) assert.doesNotMatch(image[0], filenameAlt, file);
  }
});

test('walking route helper keeps the researched Nikko stop order and uses the Maps URL API', () => {
  const { buildWalkingRouteUrl } = require('../google-maps-routes.js');
  const route = JSON.parse(fs.readFileSync(path.join(root, 'data/place-routes.json'), 'utf8')).routes
    .find(item => item.placeId === 'nikko-in-the-cedars');
  assert.equal(route.walkingRouteVerified, true, 'Nikko walking loop is explicitly recorded');
  const url = new URL(buildWalkingRouteUrl(route));
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.pathname, '/maps/dir/');
  assert.equal(url.searchParams.get('travelmode'), 'walking');
  assert.equal(url.searchParams.get('origin'), 'Tobu-Nikko Station, Matsubara-cho, Nikko, Tochigi, Japan');
  const waypoints = url.searchParams.get('waypoints').split('|');
  assert.deepEqual(waypoints.map(point => point.split(',')[0]), [
    'Shinkyo Bridge', 'Nikkosan Rinnoji Temple', 'Nikko Toshogu Shrine',
    'Nikko Futarasan-jinja Shrine', 'Taiyuin Mausoleum'
  ]);
  assert.equal(url.searchParams.get('destination'), 'Tobu-Nikko Station, Matsubara-cho, Nikko, Tochigi, Japan');
});

test('Nikko route guide renders transparent time estimates and sourced visitor facts', () => {
  const route = JSON.parse(fs.readFileSync(path.join(root, 'data/place-routes.json'), 'utf8')).routes.find(item => item.placeId === 'nikko-in-the-cedars');
  assert.doesNotMatch(route.stops.map(stop => stop.visitorInfo || '').join(' '), /\?\s*\d{2,}/, 'currency amounts must not render as question marks');
  assert.match(route.stops.map(stop => stop.visitorInfo || '').join(' '), /¥(?:300|400|500|550)/);
  const cityUi = fs.readFileSync(path.join(root, 'city-route-ui.js'), 'utf8');
  const placeUi = fs.readFileSync(path.join(root, 'place-route-ui.js'), 'utf8');
  assert.equal(route.timeEstimate.label, 'About 5.5-6.5 hours for the five-stop visit');
  assert.ok(route.stops.every(stop => stop.visitorInfo && stop.visitorInfoUrl && stop.visitDuration.status === 'estimated'));
  assert.match(cityUi, /Planning estimate/);
  assert.match(cityUi, /city-route-visitor-info/);
  assert.match(placeUi, /addGuideNotes/);
  assert.match(placeUi, /place-route-time-estimate/);
  assert.doesNotMatch(route.stops.map(stop => stop.photoStatus).join(' '), /not-included/);
});

test('walking route actions are wired to destination dialogs and city route map previews', () => {
  const app = fs.readFileSync(path.join(root, 'place-route-ui.js'), 'utf8');
  const city = fs.readFileSync(path.join(root, 'city-route-ui.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(app, /Walking route on Google Maps/);
  assert.match(app, /buildWalkingRouteUrl/);
  assert.match(app, /buildStationToPlaceUrl/);
  assert.match(app, /target\s*=\s*'_blank'/);
  assert.match(app, /rel\s*=\s*'noopener'/);
  assert.match(city, /Walking route on Google Maps/);
  assert.match(city, /buildWalkingRouteUrl/);
  assert.match(css, /walking-google-route[\s\S]{0,180}min-height:\s*44px/);
});

test('static guide walking links exactly follow the shared verified route helper', () => {
  const { buildWalkingRouteUrl, buildStationToPlaceUrl } = require('../google-maps-routes.js');
  const routes = JSON.parse(fs.readFileSync(path.join(root, 'data/place-routes.json'), 'utf8')).routes;
  const pages = fs.readdirSync(path.join(root, 'places')).map(id => ({ id, file: path.join(root, 'places', id, 'index.html') })).filter(row => fs.existsSync(row.file));
  let renderedLinks = 0;
  for (const { id, file } of pages) {
    const route = routes.find(item => item.placeId === id);
    const expected = route && (buildWalkingRouteUrl(route) || (route.origin && route.stops?.[0]
      ? buildStationToPlaceUrl(route.origin, route.stops[0], { firstLegMode: route.legs?.[0]?.mode }) : null));
    const html = fs.readFileSync(file, 'utf8');
    const links = [...html.matchAll(/<a\b(?=[^>]*\bclass="[^"]*\bwalking-google-route\b")[^>]*>/gi)];
    assert.equal(links.length, expected ? 1 : 0, `${id} static guide CTA agrees with verified route data`);
    if (expected) { assert.match(links[0][0], /href="https:\/\/www\.google\.com\/maps\/dir\//); renderedLinks++; }
  }
  assert.equal(pages.length, 310);
  assert.equal(renderedLinks, 12);
});

test('card and dialog guide actions contain semantic spacing and mobile wrapping styles', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(app, /cardActions\.append\(details,document\.createTextNode\(' '\),fieldGuide\)/);
  assert.match(html, /place-dialog-field-guide-label[^<]*<\/span> <span id="place-dialog-guide-badge"/);
  assert.match(css, /\.card-actions\{display:flex;flex-wrap:wrap/);
  assert.match(css, /#place-dialog-field-guide\{display:inline-flex[^}]*flex-wrap:wrap/);
});

test('station-to-place walking links require a recorded station and distinct destination', () => {
  const { buildStationToPlaceUrl } = require('../google-maps-routes.js');
  const station = { name: 'Kamakura Station', address: 'Kamakura Station, Japan' };
  const place = { name: 'Tsurugaoka Hachimangu', address: 'Tsurugaoka Hachimangu, Kamakura, Japan' };
  const url = new URL(buildStationToPlaceUrl(station, place));
  assert.equal(url.searchParams.get('origin'), station.address);
  assert.equal(url.searchParams.get('destination'), place.address);
  assert.equal(url.searchParams.get('travelmode'), 'walking');
  assert.equal(require('../google-maps-routes.js').addressOf({ address: 'Nikko, Tochigi · Kanto, Japan' }), 'Nikko, Tochigi, Kanto, Japan');
  assert.equal(buildStationToPlaceUrl({ name: 'Kamakura Gate', address: 'Same' }, place), null);
  assert.equal(buildStationToPlaceUrl(station, { ...station }), null);
});

test('mixed-mode routes do not receive a walking route link without explicit walking verification', () => {
  const { buildWalkingRouteUrl } = require('../google-maps-routes.js');
  const base = { origin: { name: 'Station', returnPoint: true }, stops: [{ order: 1, name: 'Place', address: 'Place, Japan' }], legs: [{ mode: 'driving' }] };
  assert.equal(buildWalkingRouteUrl(base), null);
  assert.ok(buildWalkingRouteUrl({ ...base, walkingRouteVerified: true }));
});

test('every city day map can resolve the authored stop list in visit order', () => {
  const plans = require('../city-origins.js').CITY_DAY_PLANS;
  const routes = JSON.parse(fs.readFileSync(path.join(root, 'data/city-routes.json'), 'utf8')).routes;
  const aliases = {
    'Sapporo TV Tower & Odori Park': ['Sapporo TV Tower'],
    'Tanukikoji Shopping Street': ['Tanuki Koji Shopping Street'],
    'Sapporo Beer Museum': ['Sapporo Beer Museum and Beer Garden'],
    'Sendai Castle Ruins · Aoba Castle': ['Sendai Castle Site and Kenbunkan'],
    'Sendai Asaichi Market': ['Sendai Asaichi (Morning Market)']
  };
  const coverage = {};
  for (const [city, plan] of Object.entries(plans)) {
    const route = routes.find(item => item.cityId === city);
    assert.ok(route, `${city} city map exists`);
    const mapped = plan.stops.map(stop => route.stops.find(item => (aliases[stop.name] || [stop.name]).includes(item.name)));
    assert.equal(mapped.filter(Boolean).length, plan.stops.length, `${city} plan count equals mapped stop count`);
    coverage[city] = mapped.map(stop => stop.order);
  }
  assert.deepEqual(coverage.sapporo, [1, 2, 3, 6, 7]);
  assert.deepEqual(coverage.sendai, [2, 4, 5, 1]);
});

