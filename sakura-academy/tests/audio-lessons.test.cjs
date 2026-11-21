const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const helperSource = fs.readFileSync(path.join(project, 'src/audio-lessons.js'), 'utf8');
const contentSource = fs.readFileSync(path.join(project, 'src/content.js'), 'utf8');
const lessons = JSON.parse(contentSource.match(/const LESSONS=(\[.*?\]), KANA=/s)[1]);
const appSource = fs.readFileSync(path.join(project, 'src/app.js'), 'utf8');
const stylesSource = fs.readFileSync(path.join(project, 'styles.css'), 'utf8');

test('audio lesson queue covers the lesson sentence, vocabulary, examples, and dialogue in order', () => {
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(helperSource, sandbox);
  const queue = sandbox.buildLessonAudioQueue(lessons[0]);
  assert.equal(queue.length, 19);
  assert.deepEqual(JSON.parse(JSON.stringify(queue[0])), { section: 'Lesson sentence', jp: lessons[0].jp, en: lessons[0].en });
  assert.deepEqual(JSON.parse(JSON.stringify(queue[1])), { section: 'Vocabulary', jp: lessons[0].vocab[0].jp, en: lessons[0].vocab[0].en });
  assert.deepEqual(JSON.parse(JSON.stringify(queue[2])), { section: 'Example', jp: lessons[0].vocab[0].example, en: lessons[0].vocab[0].exampleEn });
  assert.equal(queue.at(-1).section, 'Conversation · Speaker B');
  assert.equal(queue.at(-1).jp, lessons[0].dialogue[1].jp);
  assert.equal(queue.at(-1).en, lessons[0].dialogue[1].en);
  assert.equal(queue.at(-1).voice, 'jm_kumo');
  assert.ok(queue.every(item => item.jp && item.en));
});

test('every queued clip is present in the offline audio manifest', () => {
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(helperSource, sandbox);
  const manifest = JSON.parse(fs.readFileSync(path.join(project, 'src/speech-audio-manifest.json'), 'utf8'));
  for (const lesson of lessons) for (const item of sandbox.buildLessonAudioQueue(lesson)) {
    assert.ok(manifest[item.jp.normalize('NFC').replace(/\s+/g, '')], `Lesson ${lesson.id} is missing bundled audio for ${item.jp}`);
  }
});

test('conversation clips identify the active speaker for synchronized visuals', () => {
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(helperSource, sandbox);
  assert.equal(sandbox.lessonAudioSpeaker({ section: 'Conversation · Speaker A' }), 'A');
  assert.equal(sandbox.lessonAudioSpeaker({ section: 'Conversation · Speaker B' }), 'B');
  assert.equal(sandbox.lessonAudioSpeaker({ section: 'Vocabulary' }), null);
  assert.equal(sandbox.lessonAudioSpeaker(null), null);
});

test('audio lesson screen has one-tap play with pause and restart controls', () => {
  assert.match(appSource, /function audioLessons\(\)/);
  assert.match(appSource, /function startAudioLesson\(id=/);
  assert.match(appSource, /function toggleAudioLesson\(\)/);
  assert.match(appSource, /function restartAudioLesson\(\)/);
  assert.match(appSource, /Audio lessons/);
  assert.match(appSource, /audioLessonStatus/);
  assert.match(appSource, /role="progressbar" aria-label="\$\{conversation\?'Conversation':'Audio lesson'\} progress"/);
  assert.match(appSource, /if\(view==='audio'&&v!=='audio'\)/);
  assert.match(appSource, /audio-dialogue-scene/);
  assert.match(appSource, /audioSpeaker'\+role/);
  assert.match(appSource, /audioBubble'\+role/);
  assert.match(appSource, /lessonAudioSpeaker\(entry\)/);
  assert.match(appSource, /classList\.toggle\('is-speaking',active\)/);
  assert.match(stylesSource, /audio-dialogue-person\.is-speaking/);
  assert.match(stylesSource, /audio-dialogue-bubble\{display:block;[^}]*overflow:visible/);
  assert.doesNotMatch(stylesSource, /audio-dialogue-bubble\{[^}]*-webkit-line-clamp|audio-dialogue-bubble\{[^}]*overflow:hidden/);
  assert.match(stylesSource, /audio-dialogue-person-a\{color:#b86680\}\.audio-dialogue-person-b\{color:#414a79\}/);
  assert.match(appSource, /getByteTimeDomainData/);
  assert.match(appSource, /audioMouthLevel/);
  assert.match(stylesSource, /audio-dialogue-person\.mouth-active \.mouth-open\{opacity:1\}/);
  assert.doesNotMatch(stylesSource, /sakura-talk-mouth|audio-dialogue-person\.is-speaking \.mouth-open\{[^}]*animation/);
  assert.doesNotMatch(stylesSource, /sakura-talk-bob|audio-dialogue-person\.is-speaking \.audio-stick-figure\{animation/);
  assert.match(stylesSource, /mouth-open\{[^}]*transform:scaleY\(var\(--mouth-open/);
  assert.match(stylesSource, /mouth-open\{[^}]*transition:transform 110ms cubic-bezier/);
  assert.match(appSource, /mouth-open[^>]*rx="3" ry="2"/);
  assert.match(appSource, /prefers-reduced-motion/);
  assert.match(stylesSource, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(stylesSource, /audio-voice-bars/);
  assert.doesNotMatch(appSource, /audio-voice-bars/);
  assert.match(appSource, /Speaker \$\{role\} · \$\{role===/);
  assert.match(stylesSource, /audio-dialogue-scene\{min-height:clamp\(290px,42vh,480px\)/);
  assert.match(stylesSource, /audio-stick-figure\{width:auto;height:clamp\(150px,25vh,240px\)/);
  assert.match(stylesSource, /audio-dialogue-scene\{min-height:clamp\(285px,38svh,380px\)/);
  assert.match(stylesSource, /audio-stick-figure\{height:clamp\(145px,22svh,185px\)/);
  const audioScreen = appSource.slice(appSource.indexOf('function audioLessons()'), appSource.indexOf('\n', appSource.indexOf('function audioLessons()')));
  assert.ok(audioScreen.indexOf('class="audio-mode-switch"') < audioScreen.indexOf('audioDialogueScene(l)'), 'conversation mode should be selected before its speaker scene');
  assert.doesNotMatch(stylesSource, /\.audio-controls\{position:sticky/);
});

test('conversation queue contains only speaker dialogue in lesson order', () => {
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(helperSource, sandbox);
  const queue = sandbox.buildLessonConversationQueue(lessons[0]);
  assert.equal(queue.length, lessons[0].dialogue.length);
  assert.ok(queue.every(item => item.section.startsWith('Conversation · Speaker ')));
  assert.equal(queue[0].section, `Conversation · Speaker ${lessons[0].dialogue[0].who}`);
  assert.equal(queue[0].jp, lessons[0].dialogue[0].jp);
  assert.equal(queue[0].en, lessons[0].dialogue[0].en);
});

test('audio screen separates conversation and full lesson modes with focused practice controls', () => {
  assert.match(appSource, /setAudioMode\('conversation'\)/);
  assert.match(appSource, /setAudioMode\('full'\)/);
  assert.match(appSource, /replayAudioLine\(\)/);
  assert.match(appSource, /audioEchoEnabled/);
  assert.match(appSource, /audioSlowPlayback/);
  assert.match(appSource, /audioShowContext/);
  assert.match(stylesSource, /audio-mode-switch/);
});

test('optional romaji helper handles digraphs, doubled consonants, and katakana', () => {
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(helperSource, sandbox);
  assert.equal(sandbox.audioKanaToRomaji('ちょっとまって'), 'chottomatte');
  assert.equal(sandbox.audioKanaToRomaji('がっこう'), 'gakkou');
  assert.equal(sandbox.audioKanaToRomaji('コンニチハ'), 'konnichiwa');
  assert.equal(sandbox.audioKanaToRomaji('わたしは りなです。'), 'watashi wa rina desu.');
});

test('conversation view offers optional romaji and renders it on the active transcript', () => {
  assert.match(appSource, /toggleAudioRomaji\(this\.checked\)/);
  assert.match(appSource, /audioShowRomaji\?/);
  assert.match(appSource, /audioKanaToRomaji\(item\.jp\)/);
  assert.match(stylesSource, /\.audio-romaji/);
});

test('course conversation queue spans lessons and assigns distinct Japanese Kokoro voices', () => {
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(helperSource, sandbox);
  const queue = sandbox.buildCourseConversationQueue(lessons, 1);
  assert.equal(queue.length, lessons.reduce((total, lesson) => total + lesson.dialogue.length, 0));
  assert.equal(queue[0].lessonId, lessons[0].id);
  assert.equal(queue.at(-1).lessonId, lessons.at(-1).id);
  assert.equal(queue.find(item => item.speaker === 'A').voice, 'jf_alpha');
  assert.equal(queue.find(item => item.speaker === 'B').voice, 'jm_kumo');
  assert.match(queue.find(item => item.speaker === 'B').audioKey, /^dialogue:B:/);
  assert.equal(sandbox.buildCourseConversationQueue(lessons, 4)[0].lessonId, lessons[3].id);
});

test('offline manifest and generator reserve a male Kokoro voice for Speaker B clips', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(project, 'src/speech-audio-manifest.json'), 'utf8'));
  const generator = fs.readFileSync(path.join(project, 'scripts/generate_japanese_audio.py'), 'utf8');
  assert.match(generator, /jm_kumo/);
  for (const lesson of lessons) for (const line of lesson.dialogue.filter(line => line.who === 'B')) {
    const key = `dialogue:B:${line.jp.normalize('NFC').replace(/\s+/g, '')}`;
    assert.ok(manifest[key], `Lesson ${lesson.id} is missing male dialogue audio for ${line.jp}`);
  }
});

test('Kana masterclass uses one top row for Hiragana, Katakana, and Challenge tabs', () => {
  const kanaPage = appSource.slice(appSource.indexOf('function kanaPage()'), appSource.indexOf('\nfunction ', appSource.indexOf('function kanaPage()') + 1));
  assert.match(kanaPage, /kana-mode-tabs/);
  assert.match(kanaPage, /onclick=\"setKanaTab/);
  for (const name of ['Hiragana', 'Katakana', 'Challenge']) assert.match(kanaPage, new RegExp(`'${name}'`));
  assert.ok(kanaPage.includes("kanaTab==='Challenge'?`<section class=\"card kana-challenge"));
  assert.ok(kanaPage.includes(':`<div class=\"row kana-filters\"'));
});

test('audio mouth movement follows clip amplitude and ignores silence', () => {
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(helperSource, sandbox);
  assert.equal(sandbox.audioMouthLevel(new Uint8Array(32).fill(128)), 0);
  assert.equal(sandbox.audioMouthLevel(new Uint8Array(32).fill(127)), 0);
  assert.ok(sandbox.audioMouthLevel(Uint8Array.from({ length: 32 }, (_, i) => i % 2 ? 104 : 152)) > 0.8);
  assert.ok(sandbox.audioMouthLevel(Uint8Array.from({ length: 32 }, (_, i) => i % 2 ? 120 : 136)) < sandbox.audioMouthLevel(Uint8Array.from({ length: 32 }, (_, i) => i % 2 ? 104 : 152)));
});
