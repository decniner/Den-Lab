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

test('audio lesson queue covers the lesson sentence, vocabulary, examples, and dialogue in order', () => {
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(helperSource, sandbox);
  const queue = sandbox.buildLessonAudioQueue(lessons[0]);
  assert.equal(queue.length, 19);
  assert.deepEqual(JSON.parse(JSON.stringify(queue[0])), { section: 'Lesson sentence', jp: lessons[0].jp, en: lessons[0].en });
  assert.deepEqual(JSON.parse(JSON.stringify(queue[1])), { section: 'Vocabulary', jp: lessons[0].vocab[0].jp, en: lessons[0].vocab[0].en });
  assert.deepEqual(JSON.parse(JSON.stringify(queue[2])), { section: 'Example', jp: lessons[0].vocab[0].example, en: lessons[0].vocab[0].exampleEn });
  assert.deepEqual(JSON.parse(JSON.stringify(queue.at(-1))), { section: 'Conversation · Speaker B', jp: lessons[0].dialogue[1].jp, en: lessons[0].dialogue[1].en });
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

test('audio lesson screen has one-tap play with pause and restart controls', () => {
  assert.match(appSource, /function audioLessons\(\)/);
  assert.match(appSource, /function startAudioLesson\(id=/);
  assert.match(appSource, /function toggleAudioLesson\(\)/);
  assert.match(appSource, /function restartAudioLesson\(\)/);
  assert.match(appSource, /Audio lessons/);
  assert.match(appSource, /audioLessonStatus/);
  assert.match(appSource, /role="progressbar" aria-label="Audio lesson progress"/);
  assert.match(appSource, /if\(view==='audio'&&v!=='audio'\)/);
});
