const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const workerSource = fs.readFileSync(path.join(project, 'sw.js'), 'utf8');
const html = fs.readFileSync(path.join(project, 'index.html'), 'utf8');
const trackerHtml = fs.readFileSync(path.join(project, 'issue-tracker.html'), 'utf8');
const progressMarkdown = fs.readFileSync(path.join(project, 'PROGRESS.md'), 'utf8');

function makeWorker(fetchImpl = async () => { throw new Error('offline'); }, { failInstall = false } = {}) {
  const listeners = {};
  const stored = new Map();
  const added = [];
  const deleted = [];
  const lifecycle = { skipWaitingCalls: 0 };
  const base = 'https://example.test/Den-Lab/sakura-academy/';
  const cache = {
    async addAll(items) {
      if (failInstall) throw new Error('shell asset unavailable');
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
    async skipWaiting() { lifecycle.skipWaitingCalls++; },
    addEventListener(name, handler) { listeners[name] = handler; },
  };
  vm.runInNewContext(workerSource, { self, caches, fetch: fetchImpl, URL, Response });
  return { listeners, caches, added, deleted, stored, base, lifecycle };
}

test('offline shell precaches the full app and tracker assets', async () => {
  const worker = makeWorker();
  let installPromise;
  worker.listeners.install({ waitUntil(promise) { installPromise = promise; } });
  await installPromise;
  for (const file of ['./', './index.html', './favicon.svg', './styles.css', './issue-tracker.html', './PROGRESS.md', './DATA_SOURCES.md', './src/n5-data.js', './src/app.js', './src/content.js', './src/n5-app.js', './src/content-validation.js', './src/lesson-progress.js', './src/reward-guard.js']) {
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
  assert.match(html, /rel="icon" type="image\/svg\+xml" href="\.\/favicon\.svg"/);
  assert.match(html, /sakura-academy/);
});

test('static build copies the favicon into the published Academy project', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'sakura-build-'));
  try {
    const fixtureProject = path.join(fixture, 'sakura-academy');
    const output = path.join(fixture, 'site');
    fs.cpSync(project, fixtureProject, { recursive: true });
    const result = spawnSync(process.execPath, [path.join(fixtureProject, 'build.mjs'), output], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(fs.readFileSync(path.join(output, 'sakura-academy', 'favicon.svg'), 'utf8'), fs.readFileSync(path.join(project, 'favicon.svg'), 'utf8'));
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test('visible app version and offline cache version stay in sync', () => {
  const version = html.match(/v([0-9]+\.[0-9]+\.[0-9]+) · Updated /)?.[1];
  assert.ok(version, 'app footer has a semantic version');
  assert.ok(workerSource.includes(`sakura-academy-shell-v${version}`), 'service-worker cache uses the visible app version');
});

test('issue tracker script parses and renders all registered issues', () => {
  const scripts = [...trackerHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1, 'tracker contains one inline app script');
  const script = scripts[0][1];
  assert.doesNotThrow(() => new vm.Script(script), 'tracker script must be valid JavaScript');

  const selectors = ['#summary', '#search', '#status', '#rows', '#details'];
  const nodes = Object.fromEntries(selectors.map(selector => [selector, { value: selector === '#status' ? 'all' : '', innerHTML: '', addEventListener() {} }]));
  vm.runInNewContext(script, { document: { querySelector: selector => nodes[selector] } });
  assert.match(nodes['#summary'].innerHTML, /Total tracked[\s\S]*?<div class="num">24<\/div>/);
  assert.match(nodes['#summary'].innerHTML, /New[\s\S]*?<div class="num">0<\/div>/);
  assert.match(nodes['#summary'].innerHTML, /Work in progress[\s\S]*?<div class="num">0<\/div>/);
  assert.match(nodes['#summary'].innerHTML, /Closed[\s\S]*?<div class="num">24<\/div>/);
  assert.match(nodes['#rows'].innerHTML, /SA-007[\s\S]*v1\.5\.29[\s\S]*seven tabs and eight vocabulary cards[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-013/);
  assert.match(nodes['#rows'].innerHTML, /SA-014/);
  assert.match(nodes['#rows'].innerHTML, /SA-015/);
  assert.match(nodes['#rows'].innerHTML, /SA-016/);
  assert.match(nodes['#rows'].innerHTML, /SA-017/);
  assert.match(nodes['#rows'].innerHTML, /SA-018/);
  assert.match(nodes['#rows'].innerHTML, /SA-019[\s\S]*Lesson writing canvas has no target character or stroke guide/);
  assert.match(nodes['#rows'].innerHTML, /SA-020[\s\S]*Stroke-order step can carry over to the next character/);
  assert.match(nodes['#rows'].innerHTML, /SA-021[\s\S]*Opening a lesson fails on an undefined tab-status helper/);
  assert.match(nodes['#rows'].innerHTML, /SA-022[\s\S]*Sakura Academy favicon is missing from the built site[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-023[\s\S]*Vocabulary search placeholder is clipped on mobile[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-024[\s\S]*Learners cannot adjust interface text size[\s\S]*class="pill closed">Closed/);

  for (const label of ['Total tracked', 'Work in progress', 'New', 'Closed', 'Timeline gaps']) {
    const sourceValue = progressMarkdown.match(new RegExp(`^- ${label}: (\\d+)$`, 'm'))?.[1];
    const trackerValue = nodes['#summary'].innerHTML.match(new RegExp(`${label}[\\s\\S]*?<div class="num">(\\d+)<\\/div>`))?.[1];
    assert.equal(Number(trackerValue), Number(sourceValue), `${label} matches PROGRESS.md`);
  }
});


test('an online navigation is cached and can be refreshed after network loss', async () => {
  let online = true;
  const worker = makeWorker(async () => {
    if (!online) throw new Error('offline');
    return new Response('online academy page', { status: 200 });
  });
  let installPromise;
  worker.listeners.install({ waitUntil(promise) { installPromise = promise; } });
  await installPromise;

  const navigate = () => {
    let responsePromise;
    worker.listeners.fetch({
      request: { method: 'GET', mode: 'navigate', url: `${worker.base}index.html` },
      respondWith(promise) { responsePromise = promise; },
    });
    return responsePromise;
  };

  assert.equal(await (await navigate()).text(), 'online academy page');
  online = false;
  assert.equal(await (await navigate()).text(), 'online academy page');
});

test('a failed shell install cannot skip waiting or partially activate', async () => {
  const worker = makeWorker(undefined, { failInstall: true });
  let installPromise;
  worker.listeners.install({ waitUntil(promise) { installPromise = promise; } });
  await assert.rejects(installPromise, /shell asset unavailable/);
  assert.equal(worker.lifecycle.skipWaitingCalls, 0);
});
