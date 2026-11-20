const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateCourseContent } = require('../src/content-validation.js');

const project = path.resolve(__dirname, '..');
const contentSource = fs.readFileSync(path.join(project, 'src/content.js'), 'utf8');
const lessonMatch = contentSource.match(/const LESSONS=(\[.*?\]), KANA=/s);
assert.ok(lessonMatch, 'LESSONS data is present');
const lessons = JSON.parse(lessonMatch[1]);
const appSource = fs.readFileSync(path.join(project, 'src/app.js'), 'utf8');
const usageBlock = appSource.match(/const WORD_GUIDANCE=\{([\s\S]*?)\n\};/);
assert.ok(usageBlock, 'WORD_GUIDANCE data is present');
const wordGuidance = Object.fromEntries([...usageBlock[1].matchAll(/^'([^']+)':'([^']*)',?$/gm)].map(m => [m[1], m[2]]));

test('lesson data passes the content validator', () => {
  assert.deepEqual(validateCourseContent(lessons, wordGuidance), []);
});

test('every vocabulary example demonstrates its target word', () => {
  const allExamples = [];
  for (const lesson of lessons) for (const word of lesson.vocab) {
    assert.ok(word.example.replace(/\s/g, '').includes(word.jp.replace(/\s/g, '')), `${lesson.id}: ${word.jp} missing from ${word.example}`);
    assert.ok(word.exampleEn.trim(), `${lesson.id}: ${word.jp} needs an English translation`);
    allExamples.push(word.example);
  }
  assert.equal(new Set(allExamples).size, allExamples.length, 'vocabulary examples should not be copied across words');
});

test('dialogue replies and answer choices fit each lesson and vary across lessons', () => {
  assert.equal(new Set(lessons.map(l => l.dialogue.find(d => d.who === 'B').jp)).size, lessons.length);
  for (const lesson of lessons) {
    const answer = lesson.responseOptions[lesson.responseAnswer];
    assert.equal(answer, lesson.dialogue.find(d => d.who === 'B').jp, `lesson ${lesson.id} answer matches Speaker B`);
    assert.equal(new Set(lesson.responseOptions).size, 3, `lesson ${lesson.id} choices are distinct`);
  }
});

test('validator accepts numeric lesson IDs and rejects malformed lesson data', () => {
  const validLesson = { id: 1, title: 'Valid', description: 'A valid lesson', jp: 'ねこ', en: 'cat', rule: 'noun', explain: 'e', builderEn: 'cat', mistake: 'm', builder: ['ねこ'], vocab: [{ id: '1-0', jp: 'ねこ', en: 'cat', romaji: 'neko', example: 'ねこです。', exampleEn: 'It is a cat.' }], dialogue: [{ who: 'A', jp: 'こんにちは。', en: 'Hello.' }, { who: 'B', jp: 'こんにちは。', en: 'Hello.' }], responseOptions: ['こんにちは。', 'さようなら。', 'ありがとう。'], responseAnswer: 0 };
  assert.deepEqual(validateCourseContent([validLesson], { ねこ: 'Use for a cat.' }), []);
  const errors = validateCourseContent([{ ...validLesson, id: '1', title: '' }], { ねこ: 'Use for a cat.' });
  assert.ok(errors.some(error => error.includes('lesson id')));
  assert.ok(errors.some(error => error.includes('title')));
});

test('first-time reward guard rejects repeated claims', () => {
  const { claimRewardOnce } = require('../src/reward-guard.js');
  const state = { rewarded: {} };
  let xp = 0;
  const award = points => { xp += points; };
  assert.equal(claimRewardOnce(state, 'lesson:1:dialogue', 5, award), true);
  assert.equal(claimRewardOnce(state, 'lesson:1:dialogue', 5, award), false);
  assert.equal(xp, 5);
});
