const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(project, 'src/app.js'), 'utf8');
const n5 = fs.readFileSync(path.join(project, 'src/n5-app.js'), 'utf8');
const html = fs.readFileSync(path.join(project, 'index.html'), 'utf8');

test('story library provides matched kanji, kana, translations, and bundled sentence audio', () => {
  const data = fs.readFileSync(path.join(project, 'src/n5-stories.js'), 'utf8');
  const sandbox = {};
  vm.runInNewContext(`${data};globalThis.stories=N5_STORIES`, sandbox);
  const manifest = JSON.parse(fs.readFileSync(path.join(project, 'src/speech-audio-manifest.json'), 'utf8'));
  assert.ok(sandbox.stories.length >= 4);
  for (const story of sandbox.stories) {
    assert.ok(story.title && story.level === 'N5' && story.sentences.length >= 3);
    for (const line of story.sentences) {
      assert.ok(line.kanji && line.kana && line.english);
      assert.doesNotMatch(line.kana, /[㐀-䶿一-鿿]/, `story reading should be kana-only: ${line.kanji}`);
      const key = line.kanji.normalize('NFC').replace(/\s+/g, '');
      const asset = manifest[key];
      assert.ok(asset, `Missing offline story audio: ${line.kanji}`);
      const expectedFile = `ja-${crypto.createHash('sha256').update(`${key}|${line.kana}`).digest('hex').slice(0, 14)}.mp3`;
      assert.equal(path.basename(asset.src), expectedFile, `story audio matches its explicit kana reading: ${line.kanji}`);
      assert.ok(fs.statSync(path.join(project, asset.src.replace(/^\.\//, ''))).size > 1000, `story audio is not empty: ${line.kanji}`);
    }
  }
});

test('story narration uses the paired kana reading while keeping the kanji audio key', () => {
  const generator = fs.readFileSync(path.join(project, 'scripts/generate_story_audio.py'), 'utf8');
  assert.match(generator, /phrase = line\["kanji"\]/);
  assert.match(generator, /synthesis_text = line\["kana"\]/);
  assert.match(generator, /pipeline\(synthesis_text, voice="jf_alpha"/);
  assert.match(generator, /key = re\.sub\(r"\\s\+", "", unicodedata\.normalize\("NFC", phrase\)\)/);
});

test('N5 story reader supports kanji, hiragana, katakana, and karaoke playback', () => {
  assert.match(n5, /\['stories','Stories'\]/);
  assert.match(n5, /function n5Stories\(\)/);
  assert.match(n5, /Kana equivalent/);
  assert.match(n5, /Katakana/);
  assert.match(n5, /data-story-line/);
  assert.match(app, /function toKatakana\(/);
  assert.match(n5, /function n5StoryPlay\(/);
  assert.match(n5, /function playN5StorySentence\(/);
  assert.match(html, /src="src\/n5-stories\.js"><\/script>/);
  const katakanaFunction = app.match(/function toKatakana\(text\)\{[^\n]+/)?.[0];
  const sandbox = {};
  vm.runInNewContext(`${katakanaFunction};globalThis.convert=toKatakana`, sandbox);
  assert.equal(sandbox.convert('あさごはんをたべます。'), 'アサゴハンヲタベマス。');
});
