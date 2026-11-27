const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(project, 'src', 'n5-data.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(project, 'src', 'data', 'kanji-memory.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(project, 'src', 'content.js'), 'utf8'), context);
const strokeCoverage = vm.runInContext(`(() => {
  const kana = KANA.filter(item => !item.extra);
  return {
    kanaCount: kana.length,
    kanaMissing: kana.filter(item => !STROKES[item.ch]?.length).map(item => item.ch),
    kanjiCount: KANJI.length,
    kanjiMissing: KANJI.filter(item => !STROKES[item.ch]?.length).map(item => item.ch),
  };
})()`, context);
const appSource = fs.readFileSync(path.join(project, 'src', 'app.js'), 'utf8');

test('every basic kana and bundled beginner kanji has stroke-order data', () => {
  assert.equal(strokeCoverage.kanaCount, 92);
  assert.deepEqual(Array.from(strokeCoverage.kanaMissing), []);
  assert.equal(strokeCoverage.kanjiCount, 84);
  assert.deepEqual(Array.from(strokeCoverage.kanjiMissing), []);
});

test('lesson writing directs learners to reference-backed character practice', () => {
  const writingPanel = appSource.match(/function writing\(l\)\{([\s\S]*?)\}\nfunction checkWriting/);
  assert.ok(writingPanel, 'lesson writing panel is present');
  assert.match(writingPanel[1], /Open character writing practice/);
  assert.match(writingPanel[1], /nav\('handwriting'\)/);
  assert.doesNotMatch(writingPanel[1], /<canvas id="draw"/);
  assert.doesNotMatch(writingPanel[1], /Verified stroke-order diagrams are not included/);
});


test('changing handwriting characters resets the stroke guide to its first stroke', () => {
  assert.match(appSource, /function stepPractice\(n\)\{stopStrokeGuide\(\);strokeStep=0;/);
  assert.match(appSource, /function finishPractice\(key\)\{stopStrokeGuide\(\);strokeStep=0;/);
});
