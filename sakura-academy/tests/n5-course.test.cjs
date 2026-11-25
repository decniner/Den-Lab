const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const context = vm.createContext({});
for (const file of ['src/n5-data.js', 'src/n5-stories.js', 'src/n5-course.js', 'src/n5-app.js']) {
  vm.runInContext(fs.readFileSync(path.join(project, file), 'utf8'), context, { filename: file });
}
const evaluate = expression => vm.runInContext(expression, context);

test('the 12-unit N5 course covers every catalog grammar point and kanji exactly once', () => {
  const { units, grammar, kanji } = JSON.parse(evaluate('JSON.stringify({units:N5_COURSE_UNITS,grammar:N5_GRAMMAR.map(x=>x.id),kanji:N5_KANJI.map(x=>x.character)})'));
  assert.equal(units.length, 12);
  assert.deepEqual(units.flatMap(unit => unit.grammarIds).sort(), [...grammar].sort());
  assert.deepEqual(units.flatMap(unit => unit.kanji).sort(), [...kanji].sort());
  assert.equal(new Set(units.flatMap(unit => unit.grammarIds)).size, grammar.length);
  assert.equal(new Set(units.flatMap(unit => unit.kanji)).size, kanji.length);
});

test('every unit has teachable explanations, real catalog vocabulary, story, and mixed-skill checks', () => {
  const { units, vocab, stories } = JSON.parse(evaluate('JSON.stringify({units:N5_COURSE_UNITS,vocab:N5_VOCAB.map(x=>x.word),stories:N5_STORIES.map(x=>x.id)})'));
  const vocabSet = new Set(vocab), storySet = new Set(stories);
  for (const unit of units) {
    assert.ok(unit.canDo && unit.explanation && unit.usage && unit.pitfall, `${unit.id} has lesson teaching copy`);
    assert.ok(unit.vocabularyWords.length >= 6 && unit.vocabularyWords.every(word => vocabSet.has(word)), `${unit.id} uses catalog vocabulary`);
    assert.ok(storySet.has(unit.storyId), `${unit.id} links a story`);
    assert.ok(unit.check.length >= 3 && unit.check.length <= 5, `${unit.id} has a short lesson check`);
    assert.ok(new Set(unit.check.map(item => item.skill)).size >= 3, `${unit.id} check spans multiple skills`);
    for (const item of unit.check) {
      assert.ok(item.prompt && item.feedback);
      assert.equal(item.options.length, 4);
      assert.ok(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.options.length);
    }
  }
});

test('N5 course grows to 12 stories, 24 original reading items, and 32 listening items', () => {
  assert.equal(evaluate('N5_STORIES.length'), 12);
  assert.equal(evaluate('N5_READINGS.length'), 24);
  assert.equal(evaluate('N5_LISTENING.length'), 32);
  assert.ok(evaluate('N5_STORIES.every(s=>s.sentences.length>=3 && s.sentences.every(x=>x.kanji && x.kana && x.english))'));
  assert.ok(evaluate('N5_READINGS.every(q=>q.question && q.options.length===3 && Number.isInteger(q.answer) && q.answer>=0 && q.answer<q.options.length)'));
  assert.ok(evaluate('N5_LISTENING.every(q=>q.audio && q.audioReading && q.question && q.options.length===3 && Number.isInteger(q.answer) && q.answer>=0 && q.answer<q.options.length)'));
});

test('guided units distribute the full N5 vocabulary reference across their additional word lists', () => {
  const { assigned, catalog } = JSON.parse(evaluate('JSON.stringify({assigned:N5_COURSE_UNITS.flatMap(unit=>[...unit.vocabularyWords,...unit.catalogVocabularyWords]),catalog:N5_VOCAB.map(item=>item.word)})'));
  assert.deepEqual([...new Set(assigned)].sort(), [...catalog].sort());
});

test('strict mode unlocks the next guided N5 unit only after a 4/5 mixed-skill pass', () => {
  const sandbox = vm.createContext({ state: { strictMode: true, n5Study: {} }, render() {}, save() {}, window: { scrollTo() {} } });
  for (const file of ['src/n5-data.js', 'src/n5-stories.js', 'src/n5-course.js', 'src/n5-app.js']) vm.runInContext(fs.readFileSync(path.join(project, file), 'utf8'), sandbox, { filename: file });
  assert.equal(vm.runInContext('n5CourseCanOpen(0)', sandbox), true);
  assert.equal(vm.runInContext('n5CourseCanOpen(1)', sandbox), false);
  vm.runInContext(`n5CourseUnit=0;for(const [step] of N5_COURSE_STEPS)state.n5Study[n5CourseKey(N5_COURSE_UNITS[0].id,step)]=step!=='check';n5CourseStep='check';n5CourseAnswers=N5_COURSE_UNITS[0].check.map((q,i)=>i<3?q.answer:(q.answer+1)%q.options.length);n5CourseAdvance()`, sandbox);
  assert.equal(vm.runInContext('n5CourseDone(N5_COURSE_UNITS[0].id,"check")', sandbox), false);
  assert.equal(vm.runInContext('n5CourseCanOpen(1)', sandbox), false);
  vm.runInContext('n5CourseAnswers=N5_COURSE_UNITS[0].check.map(q=>q.answer);n5CourseAdvance()', sandbox);
  assert.equal(vm.runInContext('n5CourseDone(N5_COURSE_UNITS[0].id,"check")', sandbox), true);
  assert.equal(vm.runInContext('n5CourseCanOpen(1)', sandbox), true);
  assert.equal(vm.runInContext('n5CourseUnit', sandbox), 1);
});

test('mixed-skill checks vary the position of the correct choice', () => {
  const positions = JSON.parse(evaluate('JSON.stringify(N5_COURSE_UNITS.map(unit=>unit.check.map(item=>item.answer)))'));
  for (const unit of positions) assert.ok(new Set(unit).size >= 4);
});

test('guided lesson screens page grammar and kanji instead of rendering long lists', () => {
  const sandbox = vm.createContext({ state: { strictMode: true, n5Study: {} }, window: { scrollTo() {} }, render() {}, save() {}, esc(value) { return String(value ?? ''); }, strokeOrderSvg() { return '<svg></svg>'; } });
  for (const file of ['src/n5-data.js', 'src/n5-stories.js', 'src/n5-course.js', 'src/n5-app.js']) vm.runInContext(fs.readFileSync(path.join(project, file), 'utf8'), sandbox, { filename: file });
  vm.runInContext('n5CourseOpen(0)', sandbox);
  vm.runInContext("n5CourseStep='grammar'", sandbox);
  const grammarScreen = vm.runInContext('n5CoursePage()', sandbox);
  assert.match(grammarScreen, /Grammar point 1 of 7/);
  assert.equal((grammarScreen.match(/class=\"course-example\"/g) || []).length, 2);
  vm.runInContext("n5CourseStep='kanji'", sandbox);
  const kanjiScreen = vm.runInContext('n5CoursePage()', sandbox);
  assert.match(kanjiScreen, /Kanji 1 of 7/);
  assert.equal((kanjiScreen.match(/class=\"course-kanji-char\"/g) || []).length, 1);
});

test('strict mode off allows previewing any unit while the 20-item mock can draw unique listening prompts', () => {
  const sandbox = vm.createContext({ state: { strictMode: true, n5Study: {} } });
  for (const file of ['src/n5-data.js', 'src/n5-stories.js', 'src/n5-course.js', 'src/n5-app.js']) vm.runInContext(fs.readFileSync(path.join(project, file), 'utf8'), sandbox, { filename: file });
  vm.runInContext('state.strictMode=false', sandbox);
  assert.equal(vm.runInContext('n5CourseCanOpen(11)', sandbox), true);
  assert.ok(evaluate('N5_LISTENING.length >= 20'));
  const source = fs.readFileSync(path.join(project, 'src/n5-app.js'), 'utf8');
  assert.match(source, /const listening=Array\.from\(\{length:20\},\(_,i\)=>buildN5Question\('listening',N5_LISTENING\[i%N5_LISTENING\.length\]\)\)/);
});

test('the guided course opens first and old Overview bookmarks migrate to it', () => {
  const appSource = fs.readFileSync(path.join(project, 'src/n5-app.js'), 'utf8');
  const mainSource = fs.readFileSync(path.join(project, 'src/app.js'), 'utf8');
  assert.match(appSource, /let n5Tab='course'/);
  assert.match(mainSource, /raw\.n5Tab==='overview'\?'course'/);
});
