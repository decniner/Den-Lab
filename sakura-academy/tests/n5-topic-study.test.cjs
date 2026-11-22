const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const context = vm.createContext({
  console, state: { learned: {}, n5Study: {} },
  esc: value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])),
  render() {}, save() {}, rewardOnce() {}, speak() {}, sectionGuide() { return ''; }, header() { return ''; },
  stopN5Story() {}, toKatakana(value) { return value; }, strokeOrderSvg(ch) { return `<svg>${ch}</svg>`; },
  KANJI: [], nav() {},
});
for (const file of ['src/n5-data.js', 'src/n5-stories.js', 'src/n5-app.js']) {
  vm.runInContext(fs.readFileSync(path.join(project, file), 'utf8'), context, { filename: file });
}
const evaluate = expression => vm.runInContext(expression, context);

test('N5 Grammar Study shows one point and uses Previous/Next without the full card list', () => {
  const html = evaluate('n5GrammarList()');
  assert.match(html, /n5-topic-study/);
  assert.match(html, /POINT 1 OF/);
  assert.match(html, /n5GrammarIndex=Math\.min/);
  assert.match(html, /Usage note|More examples/);
  assert.doesNotMatch(html, /n5-grammar-row/);
  assert.equal(evaluate('n5GrammarIndex'), 0);
  evaluate('n5GrammarIndex=1; n5GrammarIndex=Math.max(0,n5GrammarIndex-1)');
  assert.equal(evaluate('n5GrammarIndex'), 0);
});

test('N5 Grammar Browse is searchable and opens the selected point in Study', () => {
  evaluate("n5SetGrammarMode('browse')");
  const html = evaluate('n5GrammarList()');
  assert.match(html, /Search grammar patterns/);
  assert.match(html, /n5-grammar-row/);
  assert.match(html, /n5SelectGrammar\(/);
  assert.equal((html.match(/aria-label="Study /g) || []).length, 5);
  const second = evaluate('N5_GRAMMAR[1].pattern');
  evaluate('n5SelectGrammar(1)');
  assert.equal(evaluate('n5GrammarMode'), 'study');
  assert.match(evaluate('n5GrammarList()'), new RegExp(second));
});

test('N5 Kanji Study hides the long grid and keeps one character card navigable', () => {
  const html = evaluate('n5KanjiList()');
  assert.match(html, /n5-kanji-study/);
  assert.match(html, /CHARACTER 1 OF/);
  assert.match(html, /Practice writing/);
  assert.match(html, /Stroke order/);
  assert.doesNotMatch(html, /kana-grid/);
  const second = evaluate('N5_KANJI[1].character');
  evaluate('n5SelectedKanji=1');
  assert.match(evaluate('n5KanjiList()'), new RegExp(second));
});

test('N5 Kanji Browse searches compact entries and opens one selected character', () => {
  evaluate("n5SetKanjiMode('browse')");
  const html = evaluate('n5KanjiList()');
  assert.match(html, /Search kanji, reading, or meaning/);
  assert.match(html, /n5-kanji-row/);
  assert.match(html, /n5SelectKanji\(/);
  assert.equal((html.match(/aria-label="Study kanji /g) || []).length, 6);
  assert.doesNotMatch(html, /Stroke order/);
  evaluate('n5SelectKanji(1)');
  assert.equal(evaluate('n5KanjiMode'), 'study');
  assert.equal(evaluate('n5SelectedKanji'), 1);
});
