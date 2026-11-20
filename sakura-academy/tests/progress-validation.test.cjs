const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateProgressBackupSettings, sanitizeStoredProgressSettings, validateStrictProgressData, sanitizeStrictProgressData, validatePracticeProgressData, sanitizePracticeProgressData, countKnownFlags, strictMilestoneDone } = require('../src/content-validation.js');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

test('crafted goal markup is rejected before backup import replaces progress', () => {
  const errors = validateProgressBackupSettings({ xp: 20, goal: '\"><img src=x onerror=alert(1)>' });
  assert.deepEqual(errors, ['Invalid daily goal']);
  assert.match(appSource, /validateProgressBackupSettings\(s\).*if\(!confirm\('Replace all current progress/);
});

test('backup goal must be a safe integer from 1 through 200', () => {
  for (const goal of [0, -1, 201, 1.5, Infinity, '15', null]) {
    assert.ok(validateProgressBackupSettings({ xp: 0, goal }).includes('Invalid daily goal'), `reject goal ${String(goal)}`);
  }
  assert.deepEqual(validateProgressBackupSettings({ xp: 0, goal: 200 }), []);
  assert.deepEqual(validateProgressBackupSettings({ xp: 0 }), []);
});

test('XP must be a nonnegative safe integer', () => {
  for (const xp of [-1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1, '20']) {
    assert.ok(validateProgressBackupSettings({ xp, goal: 15 }).includes('Invalid XP value'), `reject XP ${String(xp)}`);
  }
  assert.deepEqual(validateProgressBackupSettings({ xp: 0, goal: 15 }), []);
});

test('unsafe settings from older local progress are reset before rendering', () => {
  const state = sanitizeStoredProgressSettings({ xp: Infinity, goal: '\"><svg onload=alert(1)>' });
  assert.equal(state.xp, 0);
  assert.equal(state.goal, 15);
  assert.match(appSource, /sanitizeStoredProgressSettings\(state\)/);
});

const { isValidPassingAssessment } = require('../src/content-validation.js');

test('strict-mode assessment requires a valid mixed-skills run with five recorded answers', () => {
  const types = ['vocabulary', 'grammar', 'dialogue', 'listening', 'writing'];
  const wordIds = ['1-0', '1-1', '1-2'];
  const validRun = { questionTypes: [...types], wordIds: ['1-0', '1-1'], results: [true, true, true, true, false], passed: true };
  assert.equal(isValidPassingAssessment(validRun, types, wordIds), true);
  assert.equal(isValidPassingAssessment({ passed: true }, types, wordIds), false);
  assert.equal(isValidPassingAssessment({ ...validRun, results: [true, true, true, true] }, types, wordIds), false);
  assert.equal(isValidPassingAssessment({ ...validRun, results: [true, true, true, false, false], passed: true }, types, wordIds), false);
  assert.equal(isValidPassingAssessment({ ...validRun, questionTypes: ['vocabulary'] }, types, wordIds), false);
  assert.equal(isValidPassingAssessment({ ...validRun, wordIds: ['unknown', '1-1'] }, types, wordIds), false);
  assert.match(appSource, /strictMilestoneDone\(state,l,'assessment',ASSESSMENT_TYPES\)/);
});

test('strict progress import rejects truthy non-boolean flags and answer fields', () => {
  const malformed = {
    learned: { '1-1': 'false' },
    completed: { 1: 'false' },
    answers: [{ lesson: 1, format: 'ordering', correct: 'false' }],
  };
  assert.ok(validateStrictProgressData(malformed).length >= 3);
  assert.match(appSource, /validateStrictProgressData\(s\)/);
});

test('valid completion flags and answer records remain importable', () => {
  const valid = {
    learned: { '1-1': true, '1-2': false },
    completed: { 1: false },
    answers: [{ lesson: 1, format: 'ordering', correct: true }],
  };
  assert.deepEqual(validateStrictProgressData(valid), []);
});

test('older local progress with malformed flags is removed before strict checks', () => {
  const state = {
    learned: { '1-1': 'true', '1-2': true },
    completed: { 1: 'false', 2: true },
    answers: [
      { lesson: 1, format: 'ordering', correct: 'true' },
      { lesson: 1, format: 'dialogue', correct: true },
    ],
  };
  sanitizeStrictProgressData(state);
  assert.deepEqual(state.learned, { '1-2': true });
  assert.deepEqual(state.completed, { 2: true });
  assert.deepEqual(state.answers, [{ lesson: 1, format: 'dialogue', correct: true }]);
  assert.match(appSource, /sanitizeStrictProgressData\(state\)/);
});


test('strict checklist milestone logic accepts only boolean completion evidence', () => {
  const lesson = { id: 1, vocab: [{ id: '1-1' }, { id: '1-2' }] };
  const state = { learned: { '1-1': 'true', '1-2': true }, completed: { 1: 'false' }, answers: [{ lesson: 1, format: 'dialogue', correct: 'true' }], assessments: {} };
  assert.equal(strictMilestoneDone(state, lesson, 'vocabulary'), false);
  assert.equal(strictMilestoneDone(state, lesson, 'conversation'), false);
  assert.equal(strictMilestoneDone(state, lesson, 'grammar'), false);
  state.completed[1] = true;
  for (const milestone of ['vocabulary', 'grammar', 'conversation', 'listening', 'writing', 'assessment']) {
    assert.equal(strictMilestoneDone(state, lesson, milestone), false, `lesson completion cannot waive ${milestone}`);
  }
});

test('practice and reward imports reject truthy non-boolean flags', () => {
  const malformed = {
    kana: { 'あ': 'false' },
    kanji: { '一': 1 },
    handwriting: { 'Hiragana:H0': 'true' },
    rewarded: { 'kana:あ': 'false' },
  };
  assert.equal(validatePracticeProgressData(malformed).length, 4);
  assert.match(appSource, /validatePracticeProgressData\(s\)/);
});

test('older local practice data drops malformed flags before rewards or rendering', () => {
  const state = {
    kana: { 'あ': true, 'い': 'false' },
    kanji: { '1': true, '2': null },
    handwriting: { 'Hiragana:H0': true, 'Hiragana:H1': 'true' },
    rewarded: { 'kana:あ': true, 'kana:い': 'false' },
  };
  sanitizePracticeProgressData(state);
  assert.deepEqual(state, {
    kana: { 'あ': true },
    kanji: { '1': true },
    handwriting: { 'Hiragana:H0': true },
    rewarded: { 'kana:あ': true },
  });
  assert.match(appSource, /sanitizePracticeProgressData\(state\)/);
});

test('readiness totals count only known true study flags', () => {
  assert.equal(countKnownFlags({ a: true, b: false, c: 'true', extra: true }, ['a', 'b', 'c']), 1);
  assert.match(appSource, /countKnownFlags\(state\.kana,KANA\.map\(x=>x\.ch\)\)/);
  assert.match(appSource, /countKnownFlags\(state\.kanji,KANJI\.map\(x=>x\.id\)\)/);
  assert.match(appSource, /countKnownFlags\(done,practicePool\(\)\.map\(x=>practiceScript\+':'\+x\.id\)\)/);
});
