const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(project, 'src', 'app.js'), 'utf8');
const progressSource = fs.readFileSync(path.join(project, 'src', 'lesson-progress.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(project, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(project, 'styles.css'), 'utf8');

test('lesson renderer calls the helper exported before the app loads', () => {
  assert.match(progressSource, /Object\.assign\(root,\s*\{\s*lessonTabStatus\s*,/);
  assert.match(appSource, /lessonTabStatus\(t\[0\],l,state,ASSESSMENT_TYPES\)/);
  assert.doesNotMatch(appSource, /getLessonTabStatus\(/);
  assert.match(indexHtml, /href="styles\.css\?v=1\.5\.108"/);
  assert.match(indexHtml, /src="src\/lesson-progress\.js\?v=1\.5\.108"><\/script><script src="src\/audio-lessons\.js\?v=1\.5\.108"><\/script><script src="src\/reward-guard\.js"><\/script><script src="src\/speech-audio-manifest\.js\?v=1\.5\.108"><\/script><script src="src\/app\.js\?v=1\.5\.108">/);
});

test('vocabulary search uses a concise mobile-friendly placeholder', () => {
  assert.match(appSource, /aria-label="Search vocabulary" placeholder="Search words"/);
});

test('mobile navigation keeps touch targets wide and groups secondary destinations under More', () => {
  assert.match(appSource, /function navButton\(x,moreMenu=false\)/);
  assert.match(appSource, /data-mobile-secondary/);
  assert.match(appSource, /aria-controls=\"mobileMoreMenu\" aria-expanded=\"\$\{mobileMoreOpen\}\"/);
  assert.match(appSource, /function toggleMobileMore\(\).*mobile-more-menu \.navbtn.*mobile-more-toggle/);
  assert.match(appSource, /id=\"mobileMoreMenu\" role=\"group\" aria-label=\"More sections\"/);
  assert.match(appSource, /settings:'Settings'/);
  assert.match(styles, /\.mobile-more-toggle\{display:none\}/);
  assert.match(styles, /\.sidebar \.navbtn\{flex:1 1 0;width:auto;min-width:44px/);
  assert.match(styles, /\.mobile-more-menu \.navbtn\{flex:initial;min-width:0;min-height:48px/);
  assert.match(styles, /\.sidebar \.mobile-more-menu \.navtext\[data-mobile\]\{font-size:13px!important/);
});

test('Settings exposes a persistent accessible text-size preference', () => {
  assert.match(appSource, /aria-label="Interface text size"/);
  assert.match(appSource, /Standard[\s\S]*Large[\s\S]*Extra large/);
  assert.match(appSource, /state\.fontSize=this\.value;applyTextSize\(\);save\(\)/);
  assert.match(appSource, /function applyTextSize\(\)/);
  assert.match(styles, /body\[data-text-size="large"\].*--text-scale:1\.12/);
  assert.match(styles, /body\[data-text-size="extra-large"\].*--text-scale:1\.24/);
});

test('inline Japanese samples use text-size-aware styles', () => {
  assert.doesNotMatch(appSource, /style="[^"]*font-size:/);
  for (const selector of ['.jp-dialogue', '.jp-prompt', '.practice-model', '.practice-reference-char']) {
    assert.match(styles, new RegExp(`${selector.replace('.', '\\.')}\\{font-size:calc\\(var\\(--text-scale, 1\\) \\*`));
  }
});

test('mobile text-size overrides keep important declarations valid', () => {
  assert.match(styles, /font-size:calc\(var\(--text-scale, 1\) \* 54px\)!important/);
  assert.doesNotMatch(styles, /calc\(var\(--text-scale, 1\) \* 54px!important\)/);
  assert.match(styles, /\.sidebar \.navtext\[data-mobile\]\{font-size:0!important\}/);
  assert.doesNotMatch(styles, /font-size:calc\(var\(--text-scale, 1\) \* 0\)/);
  const itemList = appSource.slice(appSource.indexOf('let items=['), appSource.indexOf('],secondaryRoute='));
  const mobileLabels = [...itemList.matchAll(/\['(?:dashboard|n5|lessons|audio|kana|handwriting|kanji|flashcards|settings)','[^']*','[^']*','([^']*)'\]/g)].map(match => match[1]);
  assert.deepEqual(mobileLabels, ['Home', 'N5', 'Learn', 'Audio', 'Kana', 'Write', 'Kanji', 'Cards', 'Prefs']);
});

test('lesson activity tabs remain sticky and compact on mobile', () => {
  assert.match(styles, /\.tabs\{[^}]*position:sticky;[^}]*top:0/);
  assert.match(styles, /@media\(max-width:760px\)\{\.tabs\{flex-wrap:nowrap;overflow-x:auto/);
  assert.match(styles, /\.tabs \.tab\{flex:0 0 auto\}/);
  assert.match(appSource, /role="group" aria-label="Lesson sections; swipe horizontally to see all seven sections"/);
  assert.match(appSource, /<span class="tab-overflow-cue" aria-hidden="true">↔<\/span>/);
  assert.match(appSource, /join\(''\)\}<\/div><span class="tab-overflow-cue"/);
  assert.match(styles, /\.tab-overflow-cue\{display:flex;width:100%;height:16px/);
  assert.doesNotMatch(styles, /tab-overflow-cue\{position:sticky|tab-overflow-cue\{[^}]*margin-left:-28px/);
  assert.doesNotMatch(styles, /\.tabs:after\{[^}]*content:'↔'/);
});

test('checklist navigation scrolls a selected offscreen lesson tab into view', () => {
  const helper = appSource.split('\n').find(line => line.startsWith('function revealActiveLessonTab'));
  assert.ok(helper, 'app exposes the selected-tab reveal helper');
  const calls = [];
  const active = { getBoundingClientRect: () => ({ left: 470, right: 548 }) };
  const tabs = {
    querySelector: () => active,
    getBoundingClientRect: () => ({ left: 12, right: 372 }),
    scrollBy: options => calls.push(options),
  };
  vm.runInNewContext(`${helper}\nrevealActiveLessonTab()`, { document: { querySelector: () => tabs }, window: { matchMedia: () => ({ matches: false }) } });
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [{ left: 208, behavior: 'smooth' }]);
  const reducedMotionCalls = [];
  tabs.scrollBy = options => reducedMotionCalls.push(options);
  vm.runInNewContext(`${helper}\nrevealActiveLessonTab()`, { document: { querySelector: () => tabs }, window: { matchMedia: () => ({ matches: true }) } });
  assert.deepEqual(JSON.parse(JSON.stringify(reducedMotionCalls)), [{ left: 208, behavior: 'auto' }]);
  assert.match(appSource, /function openChecklistStep\(tab\)\{selectLessonTab\(tab\)/);
  assert.match(appSource, /if\(view==='lesson'\)requestAnimationFrame\(revealActiveLessonTab\)/);
});

test('starting a kana recognition question scrolls its prompt into view', () => {
  const helper = appSource.split('\n').find(line => line.startsWith('function revealKanaQuizQuestion'));
  assert.ok(helper, 'app exposes a helper for revealing the active kana question');
  const calls = [];
  const prompt = { scrollIntoView: options => calls.push(options) };
  const context = { document: { querySelector: selector => selector === '.kana-challenge .bigjp' ? prompt : null }, window: { matchMedia: () => ({ matches: false }) } };
  vm.runInNewContext(`${helper}\nrevealKanaQuizQuestion()`, context);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [{ block: 'start', behavior: 'smooth' }]);
  calls.length = 0;
  context.window.matchMedia = () => ({ matches: true });
  vm.runInNewContext(`${helper}\nrevealKanaQuizQuestion()`, context);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [{ block: 'start', behavior: 'auto' }]);
  assert.match(appSource, /requestAnimationFrame\(revealKanaQuizQuestion\)/);
});

test('Japanese audio prefers bundled clips and gives visible playback failures', () => {
  assert.match(indexHtml, /src="src\/speech-audio-manifest\.js\?v=1\.5\.108"><\/script>/);
  assert.match(appSource, /SAKURA_AUDIO/);
  assert.match(appSource, /speech-toast/);
  assert.match(styles, /\.speech-toast\{[^}]*position:fixed/);
});

test('lessons omit microphone practice but retain sentence listening controls', () => {
  assert.doesNotMatch(appSource, /practiceSentence|SpeechRecognition|webkitSpeechRecognition|AudioCtx/);
  assert.doesNotMatch(appSource, /🎙|Speak example sentence|Speak this sentence/);
  assert.match(appSource, /aria-label="Play example sentence"/);
  assert.match(appSource, /aria-label="Hear the model sentence"/);
  assert.doesNotMatch(indexHtml, /speech-practice\.js/);
});

test('the lesson progress helper has a versioned offline-safe URL', () => {
  assert.match(indexHtml, /src="src\/lesson-progress\.js\?v=1\.5\.108"><\/script>/);
  assert.doesNotMatch(indexHtml, /src="src\/lesson-progress\.js"><\/script>/);
});

test('strict checklist rows link the next step to its lesson activity and return to page top', () => {
  assert.match(appSource, /function openChecklistStep\(tab\)/);
  assert.match(appSource, /checklistStepAvailability\(checks\)/);
  assert.match(appSource, /strictChecklistTab\('grammar'\)/);
  assert.match(appSource, /openChecklistStep\('\$\{x\.tab\}'\)/);
  assert.match(appSource, /requestAnimationFrame\(\(\)=>window\.scrollTo\(\{top:0,behavior:'smooth'\}\)\)/);
});

test('handwriting stroke order automatically plays for every newly rendered character', () => {
  assert.match(appSource, /if\(view==='handwriting'\)\{setupPracticeCanvas\(\);strokeStep=0;stopStrokeGuide\(\);playStrokeOrder\(\)\}/);
  assert.match(appSource, /aria-label="Replay correct stroke order" onclick="playStrokeOrder\(\)">↺ Replay order/);
  assert.match(appSource, /function playStrokeOrder\(\)[\s\S]*?setInterval\(\(\)=>/);
});

test('mobile handwriting stacks readable stroke guide above a usable canvas', () => {
  assert.match(styles, /@media\(max-width:760px\)\{\.practice-workspace\{grid-template-columns:minmax\(0,1fr\)\}\.stroke-card \.row\{flex-wrap:wrap\}\.stroke-card #strokeGuide svg\{width:190px!important;max-width:190px!important;display:block;margin:0 auto\}\.practice-workspace #practiceDraw\{height:clamp\(230px,34vh,300px\)!important\}\}/);
});

test('dashboard counts only actual scheduled reviews, not unseen cards', () => {
  assert.match(appSource, /dueCount=dueReviewCount\(allCards\(\),state\.reviews\)/);
  const helper = appSource.match(/function dueReviewCount\(cards,reviews\)\{[\s\S]*?\.length\}/)?.[0];
  assert.ok(helper, 'due review counter is present');
  const sandbox = { today: () => '2026-11-21' };
  vm.runInNewContext(`${helper};globalThis.count=dueReviewCount`, sandbox);
  const cards = [{ id: 'new' }, { id: 'due' }, { id: 'future' }, { id: 'bad' }];
  assert.equal(sandbox.count(cards, {}), 0);
  assert.equal(sandbox.count(cards, { due: { due: '2026-11-20' }, future: { due: '2026-11-22' }, bad: { due: 'not-a-date' } }), 1);
  assert.match(appSource, /header\('Study'/);
  assert.match(appSource, /cards ready · Card/);
  assert.match(appSource, /Study cards return tomorrow/);
});


test('N5 sections announce horizontal navigation and reveal the selected tab', () => {
  const n5Source = fs.readFileSync(path.join(project, 'src', 'n5-app.js'), 'utf8');
  assert.match(n5Source, /id="n5Tabs" role="group" aria-label="N5 study sections; swipe horizontally to see all six sections"/);
  assert.match(n5Source, /class="tab-overflow-cue" aria-hidden="true">Swipe to explore all six sections/);
  assert.match(n5Source, /function n5RevealActiveTab\(\)[\s\S]*?strip\.scrollTo\(\{left:target/);
  assert.match(appSource, /if\(view==='n5'\)requestAnimationFrame\(n5RevealActiveTab\)/);
  assert.match(styles, /@media\(max-width:760px\)\{\.n5-tabs\{padding-right:8px\}\}/);
});


test('N5 app script URL carries the visible release version', () => {
  const version = indexHtml.match(/v([0-9]+\.[0-9]+\.[0-9]+) · Updated /)?.[1];
  assert.ok(version);
  assert.ok(indexHtml.includes(`src="src/n5-app.js?v=${version}"`));
});
