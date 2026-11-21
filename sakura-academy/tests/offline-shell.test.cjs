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
  for (const file of ['./', './index.html', './favicon.svg', './styles.css?v=1.5.100', './issue-tracker.html', './PROGRESS.md', './DATA_SOURCES.md', './src/n5-data.js', './src/app.js?v=1.5.100', './src/content.js', './src/n5-app.js', './src/content-validation.js', './src/lesson-progress.js?v=1.5.100', './src/audio-lessons.js?v=1.5.100', './src/reward-guard.js']) {
    assert.ok(worker.added.includes(file), `precache includes ${file}`);
  }
  const audio = JSON.parse(fs.readFileSync(path.join(project, 'src/speech-audio-manifest.json'), 'utf8'));
  for (const asset of new Set(Object.values(audio).map(entry => entry.src))) assert.ok(worker.added.includes(asset), `precache includes ${asset}`);
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
  assert.match(html, /href="styles\.css\?v=1\.5\.100"/);
  assert.match(html, /src="src\/audio-lessons\.js\?v=1\.5\.100"><\/script>/);
  assert.ok(workerSource.includes('./src/audio-lessons.js?v=1.5.100'));
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
    const audio = JSON.parse(fs.readFileSync(path.join(fixtureProject, 'src/speech-audio-manifest.json'), 'utf8'));
    const sample = Object.values(audio)[0].src.replace(/^\.\//, '');
    assert.equal(fs.readFileSync(path.join(output, 'sakura-academy', sample)).length, fs.readFileSync(path.join(fixtureProject, sample)).length);
    const standalone = fs.readFileSync(path.join(output, 'genki-interactive-academy.html'), 'utf8');
    assert.match(standalone, /data:audio\/mpeg;base64,/);
    assert.match(standalone, /\.audio-player-card/);
    assert.doesNotMatch(standalone, /href="styles\.css\?v=1\.5\.100/);
    assert.match(standalone, /function buildLessonAudioQueue\(lesson\)/);
    assert.match(standalone, /function audioLessons\(\)/);
    assert.doesNotMatch(standalone, /function practiceSentence|SpeechRecognition|🎙/);
    assert.match(standalone, /▶ Listen/);
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

  const selectors = ['#summary', '#search', '#status', '#rows', '#details', '#registerTitle', '#scope-active', '#scope-archive', '#scope-all'];
  const listeners = {};
  const nodes = Object.fromEntries(selectors.map(selector => [selector, { value: selector === '#status' ? 'all' : '', innerHTML: '', addEventListener(event, handler) { listeners[`${selector}:${event}`] = handler; }, setAttribute(name, value) { this[name] = value; } }]));
  const context = { document: { querySelector: selector => nodes[selector] } };
  vm.runInNewContext(script, context);
  assert.equal(nodes['#registerTitle'].textContent, 'Active issues');
  assert.equal(nodes['#rows'].innerHTML.includes('No open issues'), true);
  assert.equal(nodes['#scope-active'].textContent, 'Active (0)');
  assert.equal(nodes['#scope-active']['aria-pressed'], 'true');
  vm.runInContext("trackerScope='archive';render()", context);
  assert.equal(nodes['#registerTitle'].textContent, 'Issue archive');
  assert.match(nodes['#rows'].innerHTML, /SA-007[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-025[\s\S]*class="pill closed">Closed/);
  assert.equal(nodes['#scope-archive'].textContent, 'Archive (68)');
  assert.equal(nodes['#scope-archive']['aria-pressed'], 'true');
  vm.runInContext("trackerScope='all';render()", context);
  assert.equal(nodes['#registerTitle'].textContent, 'All issues');
  assert.match(nodes['#summary'].innerHTML, /Total tracked[\s\S]*?<div class="num">68<\/div>/);
  assert.match(nodes['#summary'].innerHTML, /New[\s\S]*?<div class="num">0<\/div>/);
  assert.match(nodes['#summary'].innerHTML, /Work in progress[\s\S]*?<div class="num">0<\/div>/);
  assert.match(nodes['#summary'].innerHTML, /Closed[\s\S]*?<div class="num">68<\/div>/);
  assert.match(nodes['#rows'].innerHTML, /SA-035[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-036[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-037[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-038[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-039[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-040[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-041[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-042[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-043[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-044[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-045[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-046[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-047[\s\S]*Conversation practice stops after the selected lesson[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-048[\s\S]*Speaker A and Speaker B use the same voice[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-049[\s\S]*Conversation characters are too small[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-050[\s\S]*speaker labels omit voice identity[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-051[\s\S]*Kana Recognition challenge is hidden below the character grid[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-052[\s\S]*Fixed mobile navigation covers audio practice controls[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-053[\s\S]*Stroke order must be started manually for each handwriting character[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-054[\s\S]*Speaker colors do not match their female and male voices[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-067[\s\S]*Bottom navigation targets are too narrow on small phones[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-068[\s\S]*Conversation character mouth movement looks unnatural[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-066[\s\S]*Conversation mouth movement still looks unnatural[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-065[\s\S]*Dashboard mastery totals count obsolete progress IDs[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-064[\s\S]*Assessment distractors include untaught answers[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-063[\s\S]*Conversation mouth animation still looks unnatural[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-056[\s\S]*Fresh accounts show unseen vocabulary as reviews due[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-058[\s\S]*Decorative swipe cue is exposed to assistive technology[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-059[\s\S]*Long conversation lines are clipped in mobile speaker bubbles[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-060[\s\S]*Mobile handwriting stroke guide is squeezed beside the canvas[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-062[\s\S]*Kana recognition question opens below the phone fold[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-061[\s\S]*Lesson swipe cue overlaps the Conversation tab label on mobile[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-054[\s\S]*Speaker colors do not match their female and male voices[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-055[\s\S]*Conversation mouth animation looks unnatural[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-056[\s\S]*Fresh accounts show unseen vocabulary as reviews due[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-043[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-031[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-032[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-033[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-034[\s\S]*class="pill closed">Closed/);
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
  assert.match(nodes['#rows'].innerHTML, /SA-025[\s\S]*Text size preference misses inline-styled character samples[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-026[\s\S]*Mobile navigation labels are clipped at phone widths[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-027[\s\S]*Resolved issues are mixed with active tracker items[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-028[\s\S]*Assessment is unavailable until two words[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-029[\s\S]*Vocabulary examples and Grammar Lab worked examples[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-030[\s\S]*lesson activity bar now stays pinned[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-031[\s\S]*Lesson Play controls are silent when the browser has no speech engine[\s\S]*class="pill closed">Closed/);
  assert.match(nodes['#rows'].innerHTML, /SA-032[\s\S]*Lesson sentences have no microphone pronunciation check[\s\S]*class="pill closed">Closed/);

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
