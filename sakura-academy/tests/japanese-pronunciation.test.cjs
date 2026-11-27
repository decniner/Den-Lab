const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const n5Source = fs.readFileSync(path.join(project, 'src/n5-data.js'), 'utf8');
const contentSource = fs.readFileSync(path.join(project, 'src/content.js'), 'utf8');
const kanjiMemorySource = fs.readFileSync(path.join(project, 'src/data/kanji-memory.js'), 'utf8');
const appSource = fs.readFileSync(path.join(project, 'src/app.js'), 'utf8');
const n5AppSource = fs.readFileSync(path.join(project, 'src/n5-app.js'), 'utf8');
const generatorSource = fs.readFileSync(path.join(project, 'scripts/generate_japanese_audio.py'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(project, 'src/speech-audio-manifest.json'), 'utf8'));
const kanaOnly = /^[ぁ-ゖァ-ヺー・、。！？!?（）() 　0-9０-９〜～「」『』]+$/u;

function loadCourse() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${n5Source}\n${kanjiMemorySource}\n${contentSource}\nglobalThis.data={vocab:N5_VOCAB,kanji:N5_KANJI,listening:N5_LISTENING,explorer:KANJI}`, context);
  return context.data;
}

test('all N5 vocabulary playback uses the catalog kana reading and bundled clip', () => {
  const { vocab } = loadCourse();
  assert.equal(vocab.length, 674);
  for (const word of vocab) {
    assert.match(word.reading, kanaOnly, `kana reading for ${word.word}`);
    const key = word.word.normalize('NFC').replace(/\s+/g, '');
    const asset = manifest[key];
    assert.ok(asset?.src, `bundled speech for ${word.word}`);
    const fingerprint = `${key}|${word.reading}`;
    const expected = `ja-${crypto.createHash('sha256').update(fingerprint).digest('hex').slice(0, 14)}.mp3`;
    assert.equal(path.basename(asset.src), expected, `audio uses the explicit reading for ${word.word}`);
    assert.ok(fs.statSync(path.join(project, asset.src.replace(/^\.\//, ''))).size > 1000, `audio clip for ${word.word}`);
  }
  assert.match(n5AppSource, /function n5PlayVocabularyWord\(index\)\{let w=N5_VOCAB\[index\];if\(w\)speak\(w\.word,\{reading:w\.reading,displayText:w\.word\}\)\}/);
});

test('Kanji Explorer examples expose and use an explicit reading', () => {
  const { explorer } = loadCourse();
  assert.equal(explorer.length, 84);
  for (const entry of explorer) {
    assert.ok(entry.example, `example for ${entry.ch}`);
    assert.match(entry.exampleReading, kanaOnly, `example reading for ${entry.example}`);
  }
  assert.match(appSource, /speak\(\x27\$\{k\.example\}\x27,\{reading:\x27\$\{k\.exampleReading/);
});

test('Kanji Explorer shows the reading of compound examples beside the kanji', () => {
  const { explorer } = loadCourse();
  const sun = explorer.find(entry => entry.ch === '日');
  assert.equal(sun.example, '明日');
  assert.equal(sun.exampleReading, 'あした');
  assert.match(appSource, /k\.exampleReading&&k\.exampleReading!==k\.example/);
  assert.match(appSource, /Hear example \$\{esc\(k\.example\)\} \(\$\{esc\(k\.exampleReading\)\}\)/);
});

test('every N5 listening prompt has a paired kana reading and bundled audio', () => {
  const { listening } = loadCourse();
  assert.equal(listening.length, 32);
  for (const item of listening) {
    if (!item.audio) continue;
    assert.match(item.audioReading, kanaOnly, `listening reading: ${item.audio}`);
    const key = item.audio.normalize('NFC').replace(/\s+/g, '');
    const asset = manifest[key];
    assert.ok(asset?.src, `bundled audio for ${item.audio}`);
    const expected = `ja-${crypto.createHash('sha256').update(`${key}|${item.audioReading}`).digest('hex').slice(0, 14)}.mp3`;
    assert.equal(path.basename(asset.src), expected, `N5 listening clip uses paired reading`);
    assert.ok(fs.statSync(path.join(project, asset.src.replace(/^\.\//, ''))).size > 1000);
  }
  assert.match(n5AppSource, /speak\(n5Question\.audio,\{reading:n5Question\.audioReading/);
});

test('Kokoro generator adds N5 vocabulary and listening with explicit readings', () => {
  assert.match(generatorSource, /N5_VOCAB/);
  assert.match(generatorSource, /N5_LISTENING/);
  assert.match(generatorSource, /reading/);
  assert.match(generatorSource, /fingerprint/);
  assert.match(appSource, /SpeechSynthesisUtterance\(speechText\)/);
});
