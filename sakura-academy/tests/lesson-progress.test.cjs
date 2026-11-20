const test = require('node:test');
const assert = require('node:assert/strict');
const { lessonTabStatus, sanitizeGrammarParts } = require('../src/lesson-progress.js');

const types = ['vocabulary', 'grammar', 'dialogue', 'listening', 'writing'];
const lesson = { id: 1, vocab: [{ id: '1-1' }, { id: '1-2' }], builder: ['わたし', 'は'] };
const emptyState = () => ({ learned: {}, completed: {}, answers: [], assessments: {}, tabVisits: {}, grammarParts: {} });

test('untouched tabs stay neutral and visited tabs become in progress', () => {
  const state = emptyState();
  assert.equal(lessonTabStatus('dialogue', lesson, state, types), 'not-started');
  state.tabVisits[1] = ['dialogue'];
  assert.equal(lessonTabStatus('dialogue', lesson, state, types), 'in-progress');
});

test('vocabulary tab progress reflects partial and complete word mastery', () => {
  const state = emptyState();
  state.learned['1-1'] = true;
  assert.equal(lessonTabStatus('vocab', lesson, state, types), 'in-progress');
  state.learned['1-2'] = true;
  assert.equal(lessonTabStatus('vocab', lesson, state, types), 'complete');
});

test('practice tabs complete only after a correct response', () => {
  const state = emptyState();
  state.answers.push({ lesson: 1, format: 'dialogue', correct: false });
  assert.equal(lessonTabStatus('dialogue', lesson, state, types), 'in-progress');
  state.answers.push({ lesson: 1, format: 'dialogue', correct: true });
  assert.equal(lessonTabStatus('dialogue', lesson, state, types), 'complete');
  assert.equal(lessonTabStatus('builder', lesson, { ...state, answers: [{ lesson: 1, format: 'ordering', correct: true }] }, types), 'complete');
});

test('lesson completion and builder results do not mark unrelated tabs complete', () => {
  const state = emptyState();
  state.completed[1] = true;
  state.answers.push({ lesson: 1, format: 'ordering', correct: true });
  assert.equal(lessonTabStatus('vocab', lesson, state, types), 'not-started');
  assert.equal(lessonTabStatus('grammar', lesson, state, types), 'not-started');
  assert.equal(lessonTabStatus('builder', lesson, state, types), 'complete');
});

test('Grammar Lab progresses from token review separately from Sentence Builder', () => {
  const grammarLesson = { ...lesson, builder: ['わたし', 'は', 'がくせい', 'です'] };
  const state = emptyState();
  state.tabVisits[1] = ['grammar'];
  state.answers.push({ lesson: 1, format: 'ordering', correct: true });
  assert.equal(lessonTabStatus('grammar', grammarLesson, state, types), 'in-progress');
  state.grammarParts = { 1: [0, 1, 2] };
  assert.equal(lessonTabStatus('grammar', grammarLesson, state, types), 'in-progress');
  state.grammarParts[1].push(3);
  assert.equal(lessonTabStatus('grammar', grammarLesson, state, types), 'complete');
});

test('grammar review progress drops unknown lessons, invalid indexes, and duplicates', () => {
  const grammarLesson = { ...lesson, builder: ['わたし', 'は'] };
  assert.deepEqual(sanitizeGrammarParts({ 1: [0, 0, 1, -1, 9, '1'], 99: [0], 2: 'invalid' }, [grammarLesson]), { 1: [0, 1] });
});

test('assessment tab distinguishes passing, active, failed, and forged pass records', () => {
  const state = emptyState();
  state.learned = { '1-1': true, '1-2': true };
  const pass = { questionTypes: [...types], wordIds: ['1-1', '1-2'], results: [true, true, true, true, false], passed: true };
  state.assessments[1] = { ...pass, results: [true], passed: false };
  assert.equal(lessonTabStatus('quiz', lesson, state, types), 'in-progress');
  state.assessments[1] = pass;
  state.learned = { '1-1': true, '1-2': true };
  assert.equal(lessonTabStatus('quiz', lesson, state, types), 'complete');
  state.assessments[1] = { ...pass, results: [true, true, false, false, false], passed: false };
  assert.equal(lessonTabStatus('quiz', lesson, state, types), 'needs-review');
  state.assessments[1] = { passed: true };
  assert.notEqual(lessonTabStatus('quiz', lesson, state, types), 'complete');
});

test('assessment progress ignores stored results for words that are no longer studied', () => {
  const state = emptyState();
  state.assessments[1] = { questionTypes: [...types], wordIds: ['1-1', '1-2'], results: [true], passed: false };
  assert.equal(lessonTabStatus('quiz', lesson, state, types), 'not-started');
  state.learned = { '1-1': true, '1-2': true };
  assert.equal(lessonTabStatus('quiz', lesson, state, types), 'in-progress');
  state.learned['1-2'] = false;
  assert.equal(lessonTabStatus('quiz', lesson, state, types), 'not-started');
});
