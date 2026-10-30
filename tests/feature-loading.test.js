import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const siteDirectory = existsSync(path.join(testDirectory, '../sijdev/index.html')) ? '../sijdev/' : '../dist/';
const root = new URL(siteDirectory, import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');

test('city and map resources are not requested by the initial document', () => {
  assert.match(html, /feature-loader\.js/);
  assert.doesNotMatch(html, /<script[^>]+(?:city-route-|city-origin-|city-origins|city-stop-photos|city-field-guides|daytrip-core|daytrips\.js|daytrip-app|vendor\/(?:leaflet|maplibre-gl)\/)/i);
  assert.doesNotMatch(html, /<link[^>]+(?:leaflet|maplibre-gl)\.css/i);
});

test('itinerary share links do not trigger city-planner loading', async () => {
  const atlas = await readFile(new URL('atlas-ui.js', root), 'utf8');
  assert.match(atlas, /url\.hash === '#daytrips' \|\| shared\.has\('origin'\) \|\| shared\.has\('selected'\)/);
  assert.doesNotMatch(atlas, /shared\.has\('trip'\)/);
});

test('feature loader exposes ordered city loading and coalesces concurrent requests', async () => {
  const source = await readFile(new URL('feature-loader.js', root), 'utf8');
  const appended = [];
  const document = {
    currentScript: { src: 'https://example.test/Den-Lab/sijdev/feature-loader.js' },
    baseURI: 'https://example.test/Den-Lab/sijdev/',
    createElement: () => ({ addEventListener(name, callback) { this[name] = callback; } }),
    head: { appendChild(script) { appended.push(script); queueMicrotask(() => script.load()); } },
    querySelectorAll: selector => selector.startsWith('link') ? [
      { href: 'https://decniner.github.io/Den-Lab/SomeWhereInJapan/vendor/maplibre-gl/maplibre-gl.css?v=20261023-3' },
      { href: 'https://decniner.github.io/Den-Lab/SomeWhereInJapan/vendor/leaflet/leaflet.css' }
    ] : []
  };
  const window = {};
  vm.runInNewContext(source, { window, document, URL, Promise, Set, Error });
  const first = window.SIJFeatureLoader.loadCityPlanner();
  const second = window.SIJFeatureLoader.loadCityPlanner();
  assert.equal(first, second, 'concurrent calls should share one promise');
  await first;
  const scripts = appended.map(script => script.src).filter(Boolean);
  assert.deepEqual(scripts.slice(0, 3), [
    'https://decniner.github.io/Den-Lab/SomeWhereInJapan/vendor/leaflet/leaflet.js',
    'https://decniner.github.io/Den-Lab/SomeWhereInJapan/vendor/maplibre-gl/maplibre-gl.js?v=20261023-3',
    'https://example.test/Den-Lab/sijdev/city-route-map.js?v=20261023-10'
  ]);
  assert.equal(new Set(scripts).size, scripts.length, 'the loader must inject each script once');
});

test('loader retries after a failed request without reloading completed scripts', async () => {
  const source = await readFile(new URL('feature-loader.js', root), 'utf8');
  const appended = [];
  let blockedOnce = false;
  const document = {
    currentScript: { src: 'https://example.test/sijdev/feature-loader.js' },
    baseURI: 'https://example.test/sijdev/',
    createElement: tag => ({ tagName: tag, addEventListener(name, callback) { this[name] = callback; }, remove() { this.removed = true; } }),
    head: { appendChild(script) {
      appended.push(script);
      queueMicrotask(() => {
        if (script.src?.includes('maplibre-gl.js') && !blockedOnce) { blockedOnce = true; script.error(new Error('blocked')); }
        else script.load();
      });
    } },
    querySelectorAll: () => []
  };
  const window = {};
  vm.runInNewContext(source, { window, document, URL, Promise, Set, Error });
  const pending = window.SIJFeatureLoader.loadCityPlanner();
  await assert.rejects(pending, /Could not load/);
  const retry = window.SIJFeatureLoader.loadCityPlanner();
  await retry;
  const loadedLeaflet = appended.filter(script => script.src?.endsWith('/leaflet.js'));
  const maplibre = appended.filter(script => script.src?.includes('maplibre-gl.js'));
  assert.equal(loadedLeaflet.length, 1, 'retry should skip the completed Leaflet script');
  assert.equal(maplibre.length, 2, 'the failed MapLibre script should be retried once');
  assert.equal(appended.at(-1).src, 'https://example.test/sijdev/daytrip-app.js?v=20261024-12');
});
