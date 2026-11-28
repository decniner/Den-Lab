const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(project, 'src', 'app.js'), 'utf8');
const progressSource = fs.readFileSync(path.join(project, 'src', 'lesson-progress.js'), 'utf8');
const n5Source = fs.readFileSync(path.join(project, 'src', 'n5-app.js'), 'utf8');
const n5AppSource = fs.readFileSync(path.join(project, 'src', 'n5-app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(project, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(project, 'styles.css'), 'utf8');

test('lesson renderer calls the helper exported before the app loads', () => {
  assert.match(progressSource, /Object\.assign\(root,\s*\{\s*lessonTabStatus\s*,/);
  assert.match(appSource, /lessonTabStatus\(t\[0\],l,state,ASSESSMENT_TYPES\)/);
  assert.doesNotMatch(appSource, /getLessonTabStatus\(/);
  assert.match(indexHtml, /href="styles\.css\?v=1\.8\.1"/);
  assert.match(indexHtml, /src="src\/lesson-progress\.js\?v=1\.8\.1"><\/script><script src="src\/audio-lessons\.js\?v=1\.8\.1"><\/script><script src="src\/reward-guard\.js"><\/script><script src="src\/speech-audio-manifest\.js\?v=1\.8\.1"><\/script><script src="src\/app\.js\?v=1\.8\.1">/);
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

test('Settings exposes a saved Japanese female Kokoro voice choice used by bundled audio', () => {
  assert.match(appSource, /aria-label="Japanese female voice"/);
  for (const voice of ['jf_alpha', 'jf_gongitsune', 'jf_tebukuro']) assert.match(appSource, new RegExp(voice));
  assert.match(appSource, /state\.japaneseVoice=this\.value;save\(\)/);
  assert.match(appSource, /source\.voices\?\.\[voice\]/);
  assert.match(appSource, /voice=state\.japaneseVoice/);
  assert.match(appSource, /item\.voice/);
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
  assert.match(indexHtml, /src="src\/speech-audio-manifest\.js\?v=1\.8\.1"><\/script>/);
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
  assert.match(indexHtml, /src="src\/lesson-progress\.js\?v=1\.8\.1"><\/script>/);
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
  assert.match(n5Source, /id="n5Tabs" role="group" aria-label="N5 study sections; swipe horizontally to see all seven sections"/);
  assert.match(n5Source, /class="tab-overflow-cue" aria-hidden="true">Swipe to explore all seven sections/);
  assert.match(n5Source, /function n5RevealActiveTab\(\)[\s\S]*?strip\.scrollTo\(\{left:target/);
  assert.match(appSource, /if\(view==='n5'\)\{requestAnimationFrame\(n5RevealActiveTab\)/);
  assert.match(styles, /@media\(max-width:760px\)\{\.n5-tabs\{padding-right:8px\}\}/);
});

test('kanji in learning text opens its matching explorer card and returns to the prior view', () => {
  assert.match(appSource, /function makeKanjiCharactersTappable\([\s\S]*?role','link'[\s\S]*?tabindex','0'[\s\S]*?aria-label',`Study kanji \$\{ch\}`/);
  assert.match(appSource, /let memoryTip=kanjiContextDetails\(ch,context\.trim\(\)\)\.memory/);
  assert.match(appSource, /setAttribute\('aria-description',memoryTip\)/);
  assert.match(appSource, /target\.dataset\.memoryTip=memoryTip/);
  assert.match(appSource, /document\.addEventListener\('click',handleKanjiTextActivation,true\)/);
  assert.match(appSource, /document\.addEventListener\('keydown',handleKanjiTextActivation,true\)/);
  assert.match(appSource, /function openKanjiFromStudyText\(index,char='',context=''\)[\s\S]*?kanjiTextReturn=\{view,scrollY:window\.scrollY,focusMode[\s\S]*?kanjiContextCard=\{ch:targetChar,context\}/);
  assert.match(appSource, /function makeKanjiCharactersTappable\([\s\S]*?view==='kanji'&&!parent\.closest\('.kanji-memory,\.kanji-components,\.kanji-context-card p \.jp'\)/);
  assert.match(appSource, /function kanjiContextPage\(\)[\s\S]*?header\('Kanji explorer'[\s\S]*?Sentence:/);
  assert.match(appSource, /function returnFromKanjiText\(\)[\s\S]*?view=previous\.view;focusMode=previous\.focusMode/);
  assert.match(appSource, /window\.scrollTo\(\{top:previous\.scrollY,behavior:'auto'\}\)/);
  assert.match(appSource, /Return to previous study section/);
  assert.match(appSource, /\$\('content'\)\.innerHTML=[\s\S]*?makeKanjiCharactersTappable\(\)/);
  assert.match(styles, /\.kanji-tap-target\{position:relative;display:inline-block;cursor:pointer;text-decoration:underline dotted/);
  assert.match(styles, /\.kanji-memory-tooltip\{position:fixed;z-index:10000/);
  assert.match(appSource, /for\(const type of \['pointerover','pointerout','focusin','focusout'\]\)document\.addEventListener/);
  assert.match(appSource, /positionKanjiMemoryTooltip\(target,tip\)/);
  assert.match(appSource, /document\.documentElement\.append\(tip\)/);
  assert.doesNotMatch(appSource, /document\.body\.append\(tip\)/);
  assert.match(styles, /body\[data-focus-mode=\"true\"\]\{height:100dvh;overflow:hidden\}/);
});

test('kanji tooltip explains visual component shapes simply, including missing definitions', () => {
  const componentContent = fs.readFileSync(path.join(project, 'src', 'content.js'), 'utf8');
  const componentSource = componentContent.match(/globalThis\.SAKURA_KANJI_COMPONENTS=Object\.freeze\(({[\s\S]*})\);/)[1];
  const helper = appSource.match(/function kanjiTooltipComponents\([\s\S]*?\nfunction showKanjiMemoryTooltip/)[0].replace(/\nfunction showKanjiMemoryTooltip$/, '');
  const context = vm.createContext({ globalThis: {}, KANJI: [], SAKURA_KANJI_SUPPLEMENTAL: {}, esc: value => String(value), audioKanaToRomaji: value => value === 'こざとへん' ? 'kozato-hen' : value });
  vm.runInContext(`globalThis.SAKURA_KANJI_COMPONENTS=Object.freeze(${componentSource})\n${helper}`, context);
  const parts = vm.runInContext(`kanjiTooltipComponents([{ch:'⻖',position:'left'},{ch:'夅',position:'right'}],'降')`, context);
  assert.match(parts, /⻖<\/span> \(left\): Hill\/mound radical \(阜\), used on the left/);
  assert.match(parts, /called <span class=jp>こざとへん<\/span> \(kozato-hen\)/);
  assert.match(parts, /夅<\/span> \(right\): Rare historical form related to 降/);
  assert.doesNotMatch(parts, /<ul>|<li>|Older dictionaries|not a separate beginner vocabulary word/);
  const fallback = vm.runInContext(`kanjiTooltipComponents([{ch:'未',position:'left'}],'降')`, context);
  assert.match(fallback, /未<\/span> \(left\): left-side shape used in 降; separate meaning not listed/);
  assert.match(appSource, /kanjiTooltipComponents\(details\.components,ch\)/);
  assert.match(appSource, /<b>Parts:<\/b>/);
});

test('kanji tooltip presents one beginner reading with kana and romaji', () => {
  const details = appSource.match(/function kanjiContextDetails\([\s\S]*?\nfunction kanjiContextPage/)[0].replace(/\nfunction kanjiContextPage$/, '');
  const reading = appSource.match(/function audioKanaToRomaji\([\s\S]*?\nfunction kanaAnswer/)[0].replace(/\nfunction kanaAnswer$/, '');
  const formatter = appSource.match(/function kanjiTooltipReading\([\s\S]*?\nfunction showKanjiMemoryTooltip/)[0].replace(/\nfunction showKanjiMemoryTooltip$/, '');
  const context = vm.createContext({
    N5_GRAMMAR: [], N5_STORIES: [{ sentences: [{ kanji: '山に行きます', kana: 'やまにいきます', english: 'I go to the mountain.' }] }], N5_VOCAB: [],
    KANJI: [{ ch: '山', meaning: 'mountain', memoryTip: 'Three peaks rise in the center.', on: 'サン', kun: 'やま' }],
    KANJI_MEMORY: {}, SAKURA_KANJI_SUPPLEMENTAL: {}, SAKURA_KANJI_COMPONENTS: {},
    esc: value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
  });
  vm.runInContext(`${details}\n${reading}\n${formatter}`, context);
  const d = vm.runInContext("kanjiContextDetails('山', '山に行きます')", context);
  assert.equal(d.meaning, 'mountain');
  assert.equal(d.reading, '', 'a whole story line reading must not be mislabeled as this kanji reading');
  const common = vm.runInContext('kanjiTooltipReading({on:d.on,kun:d.kun,reading:""})', Object.assign(context, { d }));
  assert.match(common, /Common reading/);
  assert.match(common, /やま/);
  assert.match(common, /yama/);
  assert.doesNotMatch(common, /サン|On’yomi|Kun’yomi/);
  const direct = vm.runInContext('kanjiTooltipReading({reading:"やま",on:"—",kun:"—"})', context);
  assert.match(direct, /Reading/);
  assert.match(direct, /yama/);
  assert.match(vm.runInContext('kanjiTooltipReading({reading:"",on:"—",kun:"—"})', context), /Reading not listed/);
  assert.match(styles, /\.kanji-memory-tooltip\{[^}]*width:min\(480px,calc\(100vw - 24px\)\)[^}]*font:500 16px/);
  assert.match(styles, /\.kanji-tooltip-char\{[^}]*font:600 34px/);
});

test('kanji memory tooltip stays within viewport margins and flips below near the top', () => {
  const source = appSource.match(/function positionKanjiMemoryTooltip\([\s\S]*?\nlet activeKanjiTooltipTarget/)[0].replace(/\nlet activeKanjiTooltipTarget$/, '');
  const context = vm.createContext({ window: { innerWidth: 320, innerHeight: 240 } });
  vm.runInContext(source, context);
  const place = (left, top, width = 280, height = 80) => {
    const target = { getBoundingClientRect() { return { left, top, bottom: top + 10 }; } };
    const tip = { style: {}, getBoundingClientRect() { return { width, height }; } };
    vm.runInContext('positionKanjiMemoryTooltip(target,tip)', Object.assign(context, { target, tip }));
    return { left: parseFloat(tip.style.left), top: parseFloat(tip.style.top) };
  };
  const firstKanji = place(22, 30);
  assert.equal(firstKanji.left, 22);
  assert.equal(firstKanji.top, 48);
  const rightEdge = place(300, 140);
  assert.equal(rightEdge.left, 28);
  assert.ok(rightEdge.left + 280 <= 308);
  const narrow = place(2, 30, 216);
  assert.equal(narrow.left, 12);
  context.window.innerWidth = 390;
  const phoneFirstKanji = place(22, 30);
  assert.equal(phoneFirstKanji.left, 22);
  context.window.innerWidth = 1440;
  context.window.innerHeight = 900;
  const wideRightEdge = place(1420, 600);
  assert.equal(wideRightEdge.left, 1148);
  assert.ok(wideRightEdge.left + 280 <= 1428);
  const nearBottom = place(30, 880);
  assert.ok(nearBottom.top >= 12 && nearBottom.top + 80 <= 888);
});

test('kanji links inside visual memory open a second detail and return through the prior study card', () => {
  const context = vm.createContext({ view: 'n5', kanjiContextCard: null, kanjiTextReturn: null, kanjiIndex: 0, focusMode: true, KANJI: [{ ch: '山' }, { ch: '木' }], window: { scrollY: 260, scrollTo() {} }, nav: null, hideKanjiMemoryTooltip() {}, stopStrokeGuide() {}, requestAnimationFrame(fn) { fn(); }, render() {}, FOCUS_ROUTES: ['n5', 'kanji'], mobileMoreOpen: false });
  const helpers = appSource.match(/function openKanjiFromStudyText[\s\S]*?\nfunction kanjiContextDetails/)[0].replace(/\nfunction kanjiContextDetails$/, '');
  context.nav = vm.runInContext('(route)=>{view=route}', context);
  vm.runInContext(helpers, context);
  vm.runInContext("openKanjiFromStudyText(0,'山','山に登ります。');openKanjiFromStudyText(1,'木','木 is beside the tree component.');returnFromKanjiText()", context);
  assert.equal(context.view, 'kanji');
  assert.equal(context.kanjiContextCard.ch, '山');
  assert.equal(context.kanjiTextReturn.view, 'n5');
  vm.runInContext('returnFromKanjiText()', context);
  assert.equal(context.view, 'n5');
  assert.equal(context.kanjiContextCard, null);
  assert.equal(context.kanjiTextReturn, null);
});

test('降 component cards explain ⻖ and 夅 and expose their own study details', () => {
  const content = fs.readFileSync(path.join(project, 'src', 'content.js'), 'utf8');
  const componentSource = content.match(/globalThis\.SAKURA_KANJI_COMPONENTS=Object\.freeze\(({[\s\S]*})\);/)[1];
  const supplemental = { 降: { components: [{ ch: '⻖', position: 'left' }, { ch: '夅', position: 'right' }], memoryTip: 'Picture 降 as ⻖ on the left and 夅 on the right.' } };
  const context = vm.createContext({ globalThis: {}, SAKURA_KANJI_SUPPLEMENTAL: supplemental, N5_GRAMMAR: [], N5_STORIES: [], N5_VOCAB: [], KANJI: [], KANJI_MEMORY: {} });
  vm.runInContext(`globalThis.SAKURA_KANJI_COMPONENTS=Object.freeze(${componentSource})`, context);
  const detailsSource = appSource.match(/function kanjiContextDetails\([\s\S]*?\nfunction kanjiContextPage/)[0].replace(/\nfunction kanjiContextPage$/, '');
  vm.runInContext(detailsSource, context);
  for (const [ch, position, fragment] of [['⻖', 'left', 'landforms'], ['夅', 'right', 'historical']]) {
    const detail = vm.runInContext(`kanjiContextDetails('${ch}','${supplemental.降.memoryTip}')`, context);
    assert.match(detail.memory, new RegExp(fragment));
    if (ch === '⻖') { assert.match(detail.meaning, /阜/); assert.equal(detail.component.reading, 'こざとへん'); }
    assert.equal(detail.component.parent, '降');
    assert.equal(detail.component.position, position);
  }
  assert.match(appSource, /kanji-components.*Parts in this character/);
  assert.match(appSource, /esc\(part\.ch\)/);
  assert.match(appSource, /strokes\?`<div id=/);
});

test('Kana Masterclass shows and plays stroke order after a character is selected', () => {
  assert.match(appSource, /kanaSelectedCharacter=''/);
  assert.match(appSource, /function kanaPick\(ch\)[\s\S]*?kanaSelectedCharacter=ch/);
  assert.match(appSource, /if\(view==='kana'&&kanaSelectedCharacter&&STROKES\[kanaSelectedCharacter\]\)requestAnimationFrame\(\(\)=>playKanjiStrokeOrder/);
  assert.match(appSource, /Selected kana stroke order[\s\S]*?id=\"kanjiStrokeGuide\"/);
});

test('Kanji Explorer always shows and autoplays the selected stroke order', () => {
  assert.match(appSource, /function kanjiStrokePaths\(ch\).*SAKURA_KANJI_SUPPLEMENTAL/);
  assert.match(appSource, /if\(view==='kanji'&&\(kanjiContextCard\|\|KANJI\[kanjiIndex\]\)\)requestAnimationFrame\(\(\)=>playKanjiStrokeOrder/);
  assert.match(appSource, /id=\"kanjiStrokeGuide\" class=\"kanji-stroke-guide\"/);
  assert.doesNotMatch(appSource, /<details class=\"kanji-stroke-details\"/);
  assert.match(appSource, /function playKanjiStrokeOrder\(ch\)[\s\S]*?strokeTimer=setInterval/);
  assert.match(indexHtml, /src=\"src\/data\/kanji-explorer-supplemental.js\?v=1\.8\.1\"><\/script>/);
  assert.match(appSource, /function kanjiContextPage\(\)[\s\S]*?kanjiMemoryMarkup\(k\.ch,d\.memory\)[\s\S]*?Reading here:[\s\S]*?Sentence:/);
  assert.match(appSource, /kanjiMemoryMarkup\(k\.ch,k\.memoryTip\)/);
  assert.match(indexHtml, /src="src\/data\/kanji-memory\.js\?v=1\.8\.1"><\/script>/);
  assert.match(indexHtml, /src="src\/data\/n5-kanji-cards\.js\?v=1\.8\.1"><\/script>/);
  assert.match(appSource, /N5_STORIES\.flatMap/);
  assert.match(appSource, /\.n5-story-line/);
});

test('structured visual memories take priority over imported one-line cues', () => {
  assert.match(appSource, /memory:globalThis\.SAKURA_KANJI_MEMORY\?\.\[ch\]\?\.summary\|\|component\?\.memoryTip\|\|course\?\.memoryTip/);
});

test('context Explorer readings follow the sentence furigana', () => {
  const helper = appSource.match(/function kanjiContextDetails\(ch,context\)\{[\s\S]*?\nfunction kanjiContextPage/)[0].replace(/\nfunction kanjiContextPage$/, '');
  const context = { N5_GRAMMAR: [{ examples: [{ ja: '私は学生です。', furigana: '{私|わたし}は{学生|がくせい}です。' }] }], N5_VOCAB: [{ word: '私', reading: 'わたし', meanings: ['I'] }], N5_STORIES: [], KANJI: [], KANJI_MEMORY: {} };
  vm.runInNewContext(`${helper};globalThis.reading=kanjiContextDetails('私','私は学生です。').reading;globalThis.meaning=kanjiContextDetails('私','私は学生です。').meaning`, context);
  assert.equal(context.reading, 'わたし');
  assert.equal(context.meaning, 'I');
});

test('Kanji Explorer sentence context excludes memory prose and single words', () => {
  const helper = appSource.match(/function isKanjiSourceSentence\(text\)\{[\s\S]*?\nfunction kanjiContextDetails/);
  assert.ok(helper, 'expected a shared detector for source sentence context');
  const context = {};
  vm.runInNewContext(`${helper[0].replace(/\nfunction kanjiContextDetails$/, '')};globalThis.check=isKanjiSourceSentence`, context);
  assert.equal(context.check('私は時々、図書館に行きます。'), true);
  assert.equal(context.check('時'), false);
  assert.equal(context.check('The sun 日 beside the temple 寺 marks the hours as sunlight passes.'), false);
  assert.match(appSource, /isKanjiSourceSentence\(k\.context\)\?`<p><b>Sentence:<\/b>/);
});

test('N5 story reader pairs kanji with kana and sentence-synchronized karaoke playback', () => {
  assert.match(n5Source, /\['stories','Stories'\]/);
  assert.match(n5Source, /function n5Stories\(\)/);
  assert.match(n5Source, /n5StoryMode/);
  assert.match(n5Source, /data-story-line/);
  assert.match(n5Source, /n5StoryPlay/);
  assert.match(n5Source, /Kana equivalent/);
});


test('main learning routes and lesson tabs explain their purpose and next action', () => {
  assert.match(appSource, /function sectionGuide\(/);
  assert.match(appSource, /LESSON_SECTION_GUIDES/);
  for (const key of ['vocab','grammar','dialogue','builder','listening','writing','quiz']) assert.match(appSource, new RegExp(`${key}:`));
  assert.match(appSource, /YOUR LESSONS/);
  assert.match(appSource, /section-guide/);
  assert.match(n5Source, /N5_SECTION_GUIDES/);
  for (const key of ['overview','vocabulary','grammar','kanji','stories','practice','mock']) assert.match(n5Source, new RegExp(`${key}:`));
});

test('learning guidance can be hidden once, persisted, and restored in settings', () => {
  assert.match(appSource, /showGuides:true,showDescriptions:true,guideChoiceMade:false/);
  assert.match(appSource, /function sectionGuide\(text\).*?state\.showGuides/);
  assert.match(appSource, /function promptGuidePreference\(/);
  assert.match(appSource, /Hide permanently/);
  assert.match(appSource, /Keep all/);
  assert.match(appSource, /function setGuidePreference\(show\)/);
  assert.match(appSource, /Show What to do guidance/);
  assert.match(appSource, /dataset\.guideVisibility/);
  assert.match(styles, /body\[data-guide-visibility="hidden"\]\s+\.section-guide\{display:none!important\}/);
});

test('section descriptions have their own persistent mobile-space preference', () => {
  assert.match(appSource, /showDescriptions:true/);
  assert.match(appSource, /function header\(title,subtitle.*?state\.showDescriptions/);
  assert.match(appSource, /function setDescriptionPreference\(show\)/);
  assert.match(appSource, /Show section descriptions/);
  assert.match(appSource, /Keep short descriptions and/);
  assert.match(appSource, /page-description/);
  assert.match(styles, /body\[data-description-visibility="hidden"\]\s+\.page-description\{display:none!important\}/);
});

test('lesson Focus mode keeps activity tabs pinned and hides surrounding app chrome', () => {
  assert.match(appSource, /function toggleFocusMode\(/);
  assert.match(appSource, /aria-pressed="\$\{focusMode\}"/);
  assert.match(appSource, /Exit focus/);
  assert.match(appSource, /LESSON_SECTION_GUIDES\[tab\]/);
  assert.match(styles, /body\[data-focus-mode="true"\] \.sidebar/);
  assert.match(styles, /body\[data-focus-mode="true"\] \.lesson-overview/);
  assert.match(styles, /body\[data-focus-mode="true"\] \.lesson-tabbar/);
  assert.match(styles, /body\[data-focus-mode="true"\] \.lesson-activity/);
});

test('Focus mode is available on every study and learning route', () => {
  assert.match(appSource, /const FOCUS_ROUTES=\['lesson','audio','kana','handwriting','kanji','n5','flashcards'\]/);
  assert.match(appSource, /function focusToolbar\(/);
  assert.match(appSource, /focusMode&&FOCUS_ROUTES\.includes\(view\)/);
  for (const route of ['kana', 'handwriting', 'kanji', 'flashcards', 'audio', 'n5']) assert.ok(appSource.includes(`${route}:`));
  assert.match(n5AppSource, /function n5Page\(/);
  assert.match(styles, /body\[data-focus-mode="true"\] #content/);
});

test('study routes open in Focus mode by default while Home and Settings stay regular', () => {
  const navFunction = appSource.split('\n').find(line => line.startsWith('function nav('));
  const focusFunction = appSource.split('\n').find(line => line.startsWith('function toggleFocusMode('));
  assert.ok(navFunction && focusFunction);
  const sandbox = {
    FOCUS_ROUTES: ['lesson', 'audio', 'kana', 'handwriting', 'kanji', 'n5', 'flashcards'],
    view: 'dashboard', focusMode: false, kanjiContextCard: null, mobileMoreOpen: false,
    feedback: '', builderChecked: false, strictNotice: '',
    stopStrokeGuide() {}, render() {},
    window: { scrollTo() {} },
  };
  vm.runInNewContext(`${navFunction}\n${focusFunction}\nnav('kanji')`, sandbox);
  assert.equal(sandbox.focusMode, true, 'entering a study activity starts focused');
  vm.runInNewContext('toggleFocusMode()', sandbox);
  assert.equal(sandbox.focusMode, false, 'learner can exit Focus mode');
  vm.runInNewContext("nav('settings')", sandbox);
  assert.equal(sandbox.focusMode, false, 'Settings keeps its regular layout');
  vm.runInNewContext("nav('dashboard')", sandbox);
  assert.equal(sandbox.focusMode, false, 'Home keeps its regular layout');
  vm.runInNewContext("nav('audio')", sandbox);
  assert.equal(sandbox.focusMode, true, 'another study activity starts focused by default');
});

test('learning screens omit the space-consuming caveat paragraphs', () => {
  for (const phrase of [
    'not the historical origin', 'not exhaustive', 'not automatically graded',
    'not an official JLPT paper', 'cannot predict the JLPT', 'does not predict a pass or fail',
    'approximate N5 kanji', 'approximate vocabulary entries',
    'not taken from JLPT exams', 'not a JLPT scaled score', 'not official score sections',
    'does not claim endorsement', 'not published as a current official specification',
    'community approximation',
  ]) assert.doesNotMatch(`${appSource}\n${n5Source}`, new RegExp(phrase, 'i'));
  assert.doesNotMatch(appSource, /Data is not uploaded anywhere/);
});

test('N5 app script URL carries the visible release version', () => {
  const version = indexHtml.match(/v([0-9]+\.[0-9]+\.[0-9]+) · Updated /)?.[1];
  assert.ok(version);
  assert.ok(indexHtml.includes(`src="src/n5-app.js?v=${version}"`));
});

test('N5 vocabulary has a one-card study flow, spoken sentence, and compact browse styling', () => {
  assert.match(n5AppSource, /function n5VocabularyCard/);
  assert.match(n5AppSource, /function n5PlayVocabularyExample/);
  assert.match(n5AppSource, /function n5AddVocabularyToStudy/);
  assert.match(n5AppSource, /function n5NextVocabulary/);
  assert.match(n5AppSource, /n5-vocabulary-row/);
  assert.match(appSource, /n5Study:\{\}/);
  assert.match(styles, /n5-vocabulary-study/);
  assert.match(styles, /data-focus-view="n5"\] #content:has\(\.n5-vocabulary-study\)/);
});

test('N5 vocabulary sentence audio uses the shared scoped character highlighter', () => {
  assert.match(n5AppSource, /function n5PlayVocabularyExample\(index\).*speak\(example\.ja,\{displayText:example\.ja\}\)/);
  assert.match(appSource, /activeElement\?\.closest\('\.n5-vocabulary-card,[^']*'\)/);
  assert.match(appSource, /span\.classList\.toggle\('spoken'/);
  assert.match(styles, /\.jp-character\.spoken\{[^}]*background:#ffe6a1/);
});

test('spoken N5 sentence highlights start at speech onset and progress when boundaries are missing', () => {
  assert.match(appSource, /u\.onstart=\(\)=>\{[^}]*updateJapaneseHighlight\(highlightText,0\)[^}]*startJapaneseHighlightFallback/);
  assert.match(appSource, /function startJapaneseHighlightFallback/);
  assert.match(appSource, /speechBoundarySeen=true/);
  assert.match(appSource, /speechHighlightTimer/);
});

test('N5 vocabulary study provides a previous-word action with disabled first-item state', () => {
  assert.match(n5AppSource, /function n5PreviousVocabulary/);
  assert.match(n5AppSource, /n5-vocabulary-previous/);
  assert.match(n5AppSource, /n5VocabularyHistory/);
});
