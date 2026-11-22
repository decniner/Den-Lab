const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const audioCalls = [];
const context = vm.createContext({
  console,
  state: { learned: {}, n5Study: {} },
  esc: value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])),
  render() {}, save() {}, rewardOnce() {},
  audioCalls, speak(...args) { audioCalls.push(args); }, sectionGuide() { return ''; }, header() { return ''; },
  stopN5Story() {}, toKatakana(value) { return value; },
});
for (const file of ['src/n5-data.js', 'src/n5-stories.js', 'src/n5-app.js']) {
  vm.runInContext(fs.readFileSync(path.join(project, file), 'utf8'), context, { filename: file });
}

function evaluate(expression) { return vm.runInContext(expression, context); }

test('N5 vocabulary defaults to a single compact study card with spoken sentence controls', () => {
  const html = evaluate('n5VocabularyList()');
  assert.match(html, /n5-vocabulary-study/);
  assert.match(html, /Study/);
  assert.match(html, /Browse/);
  assert.match(html, /n5AddVocabularyToStudy/);
  assert.match(html, /Show reading & meaning/);
  assert.doesNotMatch(html, /Previous<\/button>/);
  assert.doesNotMatch(html, /n5-example/);
});

test('N5 vocabulary browsing is separate and searchable without rendering full study cards', () => {
  evaluate("n5VocabularyMode='browse'; n5BrowseFilter='all'");
  const html = evaluate('n5VocabularyList()');
  assert.match(html, /Search word, reading, or meaning/);
  assert.match(html, /Study this word/);
  assert.match(html, /n5-vocabulary-row/);
  assert.doesNotMatch(html, /Hear example sentence/);
});

test('N5 vocabulary Next marks the current word learned; Add to Study saves it without marking learned', () => {
  evaluate("n5VocabularyMode='study'; n5VocabularyIndex=0");
  const firstId = evaluate('N5_VOCAB[0].id');
  evaluate('n5AddVocabularyToStudy()');
  assert.equal(evaluate(`state.n5Study['${firstId}']`), true);
  assert.equal(evaluate(`state.learned['n5-${firstId}']`), undefined);
  const afterSave = evaluate('n5VocabularyIndex');
  assert.ok(afterSave > 0);
  const nextId = evaluate('N5_VOCAB[n5VocabularyIndex].id');
  evaluate('n5NextVocabulary()');
  assert.equal(evaluate(`state.learned['n5-${nextId}']`), true);
  assert.ok(evaluate('n5VocabularyIndex') > afterSave);
});

test('saved vocabulary is queued for later and skipped in the new-word queue after reload', () => {
  evaluate('state.n5Study[N5_VOCAB[0].id]=true; n5VocabularyIndex=0; n5AllowLearnedVocabulary=false');
  evaluate('n5VocabularyList()');
  assert.notEqual(evaluate('n5VocabularyIndex'), 0);
});

test('N5 vocabulary examples have a sentence, translation, and Japanese sentence audio action', () => {
  evaluate('n5RevealVocabulary=true');
  const html = evaluate("n5VocabularyCard(N5_VOCAB[0])");
  assert.match(html, /もうスミスさんに会われましたね。/);
  assert.match(html, /You&#39;ve met Mr\. Smith already/);
  assert.match(html, /n5PlayVocabularyExample\(0\)/);
  evaluate('n5PlayVocabularyExample(0)');
  assert.equal(audioCalls.at(-1)[0], 'もうスミスさんに会われましたね。');
  assert.ok(evaluate('N5_VOCAB.every(w => n5VocabularyExample(w)?.ja)'));
});
