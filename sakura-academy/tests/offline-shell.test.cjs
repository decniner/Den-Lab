const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const workerSource = fs.readFileSync(path.join(project, 'sw.js'), 'utf8');
const html = fs.readFileSync(path.join(project, 'index.html'), 'utf8');

function makeWorker(fetchImpl = async () => { throw new Error('offline'); }) {
  const listeners = {};
  const stored = new Map();
  const added = [];
  const deleted = [];
  const base = 'https://example.test/Den-Lab/sakura-academy/';
  const cache = {
    async addAll(items) {
      added.push(...items);
      for (const item of items) stored.set(new URL(item, base).href, `cached:${item}`);
    },
    async put(request, response) { stored.set(request.url, response); },
  };
  const caches = {
    async open() { return cache; },
    async keys() { return ['sakura-academy-shell-old', 'unrelated-cache']; },
    async delete(key) { deleted.push(key); return true; },
    async match(request, options = {}) {
      const url = new URL(typeof request === 'string' ? request : request.url);
      if (options.ignoreSearch) url.search = '';
      return stored.get(url.href);
    },
  };
  const self = {
    location: { origin: 'https://example.test', href: `${base}sw.js` },
    registration: { scope: base },
    clients: { async claim() {} },
    async skipWaiting() {},
    addEventListener(name, handler) { listeners[name] = handler; },
  };
  vm.runInNewContext(workerSource, { self, caches, fetch: fetchImpl, URL, Response });
  return { listeners, caches, added, deleted, stored, base };
}

test('offline shell precaches the full app and tracker assets', async () => {
  const worker = makeWorker();
  let installPromise;
  worker.listeners.install({ waitUntil(promise) { installPromise = promise; } });
  await installPromise;
  for (const file of ['./', './index.html', './styles.css', './issue-tracker.html', './src/app.js', './src/content.js', './src/n5-app.js']) {
    assert.ok(worker.added.includes(file), `precache includes ${file}`);
  }
});

test('worker activation removes only obsolete Sakura cache versions', async () => {
  const worker = makeWorker();
  let activationPromise;
  worker.listeners.activate({ waitUntil(promise) { activationPromise = promise; } });
  await activationPromise;
  assert.deepEqual(worker.deleted, ['sakura-academy-shell-old']);
});

test('offline navigation falls back to the cached app index', async () => {
  const worker = makeWorker();
  let installPromise;
  worker.listeners.install({ waitUntil(promise) { installPromise = promise; } });
  await installPromise;
  let responsePromise;
  worker.listeners.fetch({
    request: { method: 'GET', mode: 'navigate', url: `${worker.base}missing-route` },
    respondWith(promise) { responsePromise = promise; },
  });
  assert.equal(await responsePromise, 'cached:./index.html');
});

test('app registers the worker relative to its own project route', () => {
  assert.match(html, /navigator\.serviceWorker\.register\('\.\/sw\.js'\)/);
  assert.match(html, /sakura-academy/);
});

test('visible app version and offline cache version stay in sync', () => {
  const version = html.match(/v([0-9]+\.[0-9]+\.[0-9]+) · Updated /)?.[1];
  assert.ok(version, 'app footer has a semantic version');
  assert.ok(workerSource.includes(`sakura-academy-shell-v${version}`), 'service-worker cache uses the visible app version');
});
