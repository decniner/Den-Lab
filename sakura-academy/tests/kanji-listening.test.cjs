const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const dataPath = path.join(project, 'src/data/kanji-listening.js');
const dataSource = fs.existsSync(dataPath) ? fs.readFileSync(dataPath, 'utf8') : '';
const helperSource = fs.readFileSync(path.join(project, 'src/audio-lessons.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(project, 'index.html'), 'utf8');
const appSource = fs.readFileSync(path.join(project, 'src/app.js'), 'utf8');
const workerSource = fs.readFileSync(path.join(project, 'sw.js'), 'utf8');

test('Kanji listening queue covers all 84 kanji with aligned sentence readings and audio', () => {
  assert.ok(dataSource, 'kanji listening data is bundled');
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(dataSource, sandbox);
  vm.runInContext(helperSource, sandbox);
  const queue = Array.from(sandbox.buildKanjiListeningQueue());
  const manifest = JSON.parse(fs.readFileSync(path.join(project, 'src/speech-audio-manifest.json'), 'utf8'));
  assert.equal(queue.length, 84);
  assert.equal(new Set(queue.map(item => item.character)).size, 84);
  for (const item of queue) {
    assert.ok(item.kanji.includes(item.character), `${item.character} appears in its sentence`);
    assert.ok(item.kana && /^[ぁ-ゖァ-ヺー、。「」！？\s]+$/.test(item.kana), `${item.character} has a kana-only reading`);
    assert.equal(item.furigana.replace(/\{([^|{}]+)\|[^{}]+\}/g, '$1'), item.kanji, `${item.character} ruby base matches sentence`);
    assert.equal(item.furigana.replace(/\{([^|{}]+)\|([^{}]+)\}/g, '$2'), item.kana, `${item.character} ruby reading matches audio`);
    assert.ok(item.en, `${item.character} has a translation`);
    assert.ok(item.tatoebaId || item.source === 'Sakura Academy', `${item.character} has attribution or original source`);
    const key = item.kanji.normalize('NFC').replace(/\s+/g, '');
    assert.ok(manifest[key], `${item.character} has bundled audio`);
    assert.ok(fs.existsSync(path.join(project, manifest[key].src.replace(/^\.\//, ''))), `${item.character} audio file exists`);
  }
});

test('Audio lessons exposes a continuous Kanji listening mode with optional karaoke kana', () => {
  assert.match(appSource, /setAudioMode\('kanji'\)/);
  assert.match(appSource, /Show kana/);
  assert.match(appSource, /kanji-audio-sentence/);
  assert.match(appSource, /updateKanjiListeningHighlight/);
  assert.match(appSource, /buildKanjiListeningQueue/);
  assert.match(indexHtml, /src\/data\/kanji-listening\.js\?v=/);
  assert.match(workerSource, /src\/data\/kanji-listening\.js\?v=/);
});
