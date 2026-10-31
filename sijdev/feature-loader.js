(function (root, doc) {
  'use strict';

  if (!root || !doc) return;
  const assetRoot = new URL('.', doc.currentScript?.src || doc.baseURI);
  const loadedScripts = new Set();
  const loadedStyles = new Set();
  const pendingScripts = new Map();
  const pendingStyles = new Map();
  let cityPromise = null;
  let placeMapPromise = null;

  const mapStyles = [
    'https://decniner.github.io/Den-Lab/SomeWhereInJapan/vendor/maplibre-gl/maplibre-gl.css?v=20261023-3'
  ];
  const cityStyles = [
    'https://decniner.github.io/Den-Lab/SomeWhereInJapan/vendor/leaflet/leaflet.css'
  ];
  const placeMapScripts = [
    'https://decniner.github.io/Den-Lab/SomeWhereInJapan/vendor/leaflet/leaflet.js',
    'https://decniner.github.io/Den-Lab/SomeWhereInJapan/vendor/maplibre-gl/maplibre-gl.js?v=20261023-3',
    'city-route-map.js?v=20261023-10',
    'google-maps-routes.js?v=20261024-4',
    'city-route-ui.js?v=planner-fixes-20261101-1',
    'place-route-ui.js?v=20261024-16'
  ];
  const cityScripts = [
    'https://decniner.github.io/Den-Lab/SomeWhereInJapan/vendor/leaflet/leaflet.js',
    'https://decniner.github.io/Den-Lab/SomeWhereInJapan/vendor/maplibre-gl/maplibre-gl.js?v=20261023-3',
    'city-route-map.js?v=20261023-10',
    'google-maps-routes.js?v=20261024-4',
    'city-route-ui.js?v=planner-fixes-20261101-1',
    'place-route-ui.js?v=20261024-16',
    'city-route-model.js?v=20261023-5',
    'city-origins.js?v=20261023-3',
    'city-stop-photos.js?v=20261024-1',
    'city-field-guides.js?v=20261024-2',
    'city-origin-ui.js?v=planner-fixes-20261101-2',
    'daytrip-core.js?v=20261024-1',
    'daytrips.js?v=20261022-8',
    'daytrip-app.js?v=20261024-12'
  ];

  function absoluteUrl(path) {
    return path.startsWith('http') ? path : new URL(path, assetRoot).href;
  }

  function loadStyle(href) {
    const url = absoluteUrl(href);
    if (loadedStyles.has(url)) return Promise.resolve();
    if (pendingStyles.has(url)) return pendingStyles.get(url);
    const existing = [...doc.querySelectorAll('link[rel="stylesheet"]')].find(link => link.href === url);
    if (existing) { loadedStyles.add(url); return Promise.resolve(); }
    let resolveLoad, rejectLoad;
    const pending = new Promise((resolve, reject) => { resolveLoad = resolve; rejectLoad = reject; });
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.addEventListener('load', () => { loadedStyles.add(url); pendingStyles.delete(url); resolveLoad(); }, { once: true });
    link.addEventListener('error', () => { link.remove(); pendingStyles.delete(url); rejectLoad(new Error(`Could not load ${url}`)); }, { once: true });
    pendingStyles.set(url, pending);
    doc.head.appendChild(link);
    return pending;
  }

  function loadScript(path) {
    const url = absoluteUrl(path);
    if (loadedScripts.has(url)) return Promise.resolve();
    if (pendingScripts.has(url)) return pendingScripts.get(url);
    const existing = [...doc.querySelectorAll('script[src]')].find(script => script.src === url);
    if (existing) { loadedScripts.add(url); return Promise.resolve(); }
    let resolveLoad, rejectLoad;
    const pending = new Promise((resolve, reject) => { resolveLoad = resolve; rejectLoad = reject; });
    const script = doc.createElement('script');
    script.async = false;
    script.src = url;
    script.addEventListener('load', () => { loadedScripts.add(url); pendingScripts.delete(url); resolveLoad(); }, { once: true });
    script.addEventListener('error', () => { script.remove(); pendingScripts.delete(url); rejectLoad(new Error(`Could not load ${url}`)); }, { once: true });
    pendingScripts.set(url, pending);
    doc.head.appendChild(script);
    return pending;
  }

  function loadSequentially(items, loader) {
    return items.reduce((promise, item) => promise.then(() => loader(item)), Promise.resolve());
  }

  function loadPlaceMap() {
    if (!placeMapPromise) {
      placeMapPromise = loadSequentially([...mapStyles, ...cityStyles], loadStyle)
        .then(() => loadSequentially(placeMapScripts, loadScript))
        .catch(error => { placeMapPromise = null; throw error; });
    }
    return placeMapPromise;
  }

  function loadCityPlanner() {
    if (!cityPromise) {
      cityPromise = loadSequentially([...mapStyles, ...cityStyles], loadStyle)
        .then(() => loadSequentially(cityScripts, loadScript))
        .catch(error => { cityPromise = null; throw error; });
    }
    return cityPromise;
  }

  root.SIJFeatureLoader = Object.freeze({ loadCityPlanner, loadPlaceMap });
})(typeof window !== 'undefined' ? window : globalThis, typeof document !== 'undefined' ? document : null);
