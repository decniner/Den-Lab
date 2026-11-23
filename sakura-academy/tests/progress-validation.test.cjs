const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateProgressBackupSettings, sanitizeStoredProgressSettings, validateStrictProgressData, sanitizeStrictProgressData, validatePracticeProgressData, sanitizePracticeProgressData, countKnownFlags, assessmentWordPool, assessmentOptionCandidates, isValidAssessmentRun, ensureAssessmentRun, strictMilestoneDone } = require('../src/content-validation.js');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const contentSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'content.js'), 'utf8');
const lessons = JSON.parse(contentSource.match(/const LESSONS=(\[.*?\]), KANA=/s)[1]);

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

test('font size is an enumerated setting with a safe default for old progress', () => {
  assert.deepEqual(validateProgressBackupSettings({ xp: 0, fontSize: 'large' }), []);
  for (const fontSize of ['tiny', '<img>', 2, null]) {
    assert.ok(validateProgressBackupSettings({ xp: 0, fontSize }).includes('Invalid text size'));
  }
  assert.equal(sanitizeStoredProgressSettings({ xp: 0, fontSize: '<svg>' }).fontSize, 'standard');
  assert.equal(sanitizeStoredProgressSettings({ xp: 0 }).fontSize, 'standard');
});

test('guide visibility preference migrates safely and rejects malformed backup values', () => {
  assert.deepEqual(sanitizeStoredProgressSettings({ xp: 0 }), {
    xp: 0, fontSize: 'standard', japaneseVoice: 'jf_alpha', showGuides: true, showDescriptions: true, guideChoiceMade: false,
  });
  assert.deepEqual(validateProgressBackupSettings({ xp: 0, showGuides: false, guideChoiceMade: true }), []);
  assert.deepEqual(validateProgressBackupSettings({ xp: 0, showGuides: 'false', guideChoiceMade: 1 }), [
    'Invalid guide visibility', 'Invalid guide choice state',
  ]);
  assert.deepEqual(validateProgressBackupSettings({ xp: 0, showDescriptions: 'false' }), ['Invalid description visibility']);
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
    kanjiStudy: {},
  });
  assert.match(appSource, /sanitizePracticeProgressData\(state\)/);
});

test('readiness totals count only known true study flags', () => {
  assert.equal(countKnownFlags({ a: true, b: false, c: 'true', extra: true }, ['a', 'b', 'c']), 1);
  assert.equal(countKnownFlags({ 'lesson-1-word': true, 'removed-word': true }, ['lesson-1-word', 'lesson-2-word']), 1);
  assert.equal(countKnownFlags({ 1: true, 99: true }, [1, 2]), 1);
  assert.match(appSource, /countKnownFlags\(state\.kana,KANA\.map\(x=>x\.ch\)\)/);
  assert.match(appSource, /countKnownFlags\(state\.kanji,KANJI\.map\(x=>x\.id\)\)/);
  assert.match(appSource, /countKnownFlags\(state\.learned,LESSONS\.flatMap\(l=>l\.vocab\.map\(w=>w\.id\)\)\)/);
  assert.match(appSource, /countCompletedLessons\(LESSONS,state\.completed,state\.strictMode,strictLessonComplete\)/);
  assert.match(appSource, /countKnownFlags\(done,practicePool\(\)\.map\(x=>practiceScript\+':'\+x\.id\)\)/);
});

test('legacy vocabulary-only assessment results are not upgraded to mixed-skill passes', () => {
  const types = ['vocabulary', 'grammar', 'dialogue', 'listening', 'writing'];
  const lesson = { id: 1, vocab: [{ id: '1-0' }, { id: '1-1' }] };
  const legacy = { results: [true, true, true, true, false], passed: true };
  const fresh = { questionTypes: [...types], wordIds: ['1-0', '1-1'], results: [], passed: false };
  let created = 0;
  const learned = { '1-0': true, '1-1': true };
  const reset = ensureAssessmentRun(legacy, lesson, types, currentLesson => {
    assert.equal(currentLesson, lesson);
    created++;
    return fresh;
  }, learned);
  assert.equal(isValidAssessmentRun(legacy, types, lesson.vocab.map(word => word.id)), false);
  assert.equal(isValidAssessmentRun(fresh, types, lesson.vocab.map(word => word.id)), true);
  assert.equal(created, 1);
  assert.equal(reset, fresh);
  const currentRun = { ...fresh, results: [true], passed: false };
  assert.equal(ensureAssessmentRun(currentRun, lesson, types, () => { throw new Error('valid run should be preserved'); }, learned), currentRun);
  assert.match(appSource, /function assessmentRun\(l\)\{let existing=state\.assessments\[l\.id\],run=ensureAssessmentRun\(existing,l,ASSESSMENT_TYPES,newAssessment,state\.learned\)/);
});

test('assessment word pool includes only vocabulary explicitly studied in this lesson', () => {
  const lesson = { id: 1, vocab: [{ id: '1-0' }, { id: '1-1' }, { id: '1-2' }] };
  assert.deepEqual(assessmentWordPool(lesson, { '1-0': true, '1-1': false, '1-2': 'true' }).map(word => word.id), ['1-0']);
  assert.deepEqual(assessmentWordPool(lesson, {}).map(word => word.id), []);
  assert.match(appSource, /function newAssessment\(l\).*assessmentWordPool\(l,state\.learned\)/);
  assert.match(appSource, /function assessment\(l\).*ASSESSMENT LOCKED/);
});

test('stored assessment runs with unstudied target words are reset and cannot pass strict mode', () => {
  const types = ['vocabulary', 'grammar', 'dialogue', 'listening', 'writing'];
  const lesson = { id: 1, vocab: [{ id: '1-0' }, { id: '1-1' }, { id: '1-2' }] };
  const learned = { '1-0': true, '1-1': true };
  const old = { questionTypes: [...types], wordIds: ['1-0', '1-2'], results: [true, true, true, true, true], passed: true };
  const fresh = { ...old, wordIds: ['1-0', '1-1'], results: [], passed: false };
  assert.equal(ensureAssessmentRun(old, lesson, types, () => fresh, learned), fresh);
  assert.equal(strictMilestoneDone({ learned, assessments: { 1: old } }, lesson, 'assessment', types), false);
  assert.equal(strictMilestoneDone({ learned, assessments: { 1: fresh } }, lesson, 'assessment', types), false);
  assert.match(appSource, /ensureAssessmentRun\(existing,l,ASSESSMENT_TYPES,newAssessment,state\.learned\)/);
});

test('lesson example sentence renderers expose full-sentence audio controls', () => {
  assert.match(appSource, /function wordCards\(list\).*speak\('\$\{w\.example\}'\)/);
  assert.match(appSource, /function grammar\(l\).*speak\('\$\{l\.jp\}'\)/);
  assert.match(appSource, /function dialogue\(l\).*speak\('\$\{d\.jp\}'\)/);
  assert.match(appSource, /function sentenceBuilder\(l\).*speak\('\$\{l\.jp\}'\)/);
});


test('assessment distractors stay within learned vocabulary and the current lesson', () => {
  const lesson = { id: 1, en: 'I go to school.', builder: ['がっこうへ', 'いきます'], dialogue: [{ who: 'A', en: 'Hello.' }, { who: 'B', en: 'Nice to meet you.' }], vocab: [{ id: '1-0', en: 'school', jp: 'がっこう' }, { id: '1-1', en: 'go', jp: 'いきます' }, { id: '1-2', en: 'book', jp: 'ほん' }] };
  const learned = { '1-0': true, '1-1': false, '1-2': true };
  assert.deepEqual(assessmentOptionCandidates(lesson, 'vocabulary', learned), ['school', 'book']);
  assert.deepEqual(assessmentOptionCandidates(lesson, 'dialogue', learned), ['Hello.', 'Nice to meet you.']);
  assert.deepEqual(assessmentOptionCandidates(lesson, 'listening', learned), ['I go to school.', 'Hello.', 'Nice to meet you.']);
  const grammarOptions = assessmentOptionCandidates(lesson, 'grammar', learned);
  assert.deepEqual(grammarOptions, ['いきます がっこうへ']);
  assert.deepEqual(assessmentOptionCandidates(lesson, 'writing', learned), ['がっこう', 'ほん']);
  assert.match(appSource, /assessmentOptionCandidates\(l,type,state\.learned\)/);
  assert.doesNotMatch(appSource, /otherLessons=LESSONS\.filter/);
});


test('all course assessments have lesson-local answer choices for every skill', () => {
  for (const lesson of lessons) {
    const learned = Object.fromEntries(lesson.vocab.map(word => [word.id, true]));
    const required = { vocabulary: lesson.vocab[0].en, grammar: lesson.builder.join(' '), dialogue: (lesson.dialogue.find(line => line.who === 'A') || lesson.dialogue[0]).en, listening: lesson.en, writing: lesson.vocab[1].jp };
    for (const [type, correct] of Object.entries(required)) {
      const candidates = assessmentOptionCandidates(lesson, type, learned);
      const choices = [...new Set([correct, ...candidates])];
      assert.ok(choices.includes(correct), `Lesson ${lesson.id} ${type} includes its correct response`);
      assert.ok(choices.some(candidate => candidate !== correct), `Lesson ${lesson.id} ${type} has at least one lesson-based distractor`);
    }
  }
});


test('Japanese voice preference accepts only bundled female Kokoro presets', () => {
  assert.deepEqual(validateProgressBackupSettings({ xp: 0, japaneseVoice: 'jf_gongitsune' }), []);
  assert.ok(validateProgressBackupSettings({ xp: 0, japaneseVoice: 'jm_kumo' }).includes('Invalid Japanese voice'));
  assert.equal(sanitizeStoredProgressSettings({ xp: 0, japaneseVoice: '<script>' }).japaneseVoice, 'jf_alpha');
});
