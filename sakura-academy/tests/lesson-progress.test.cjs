const test = require('node:test');
const assert = require('node:assert/strict');
const { lessonTabStatus } = require('../src/lesson-progress.js');

const types = ['vocabulary', 'grammar', 'dialogue', 'listening', 'writing'];
const lesson = { id: 1, vocab: [{ id: '1-1' }, { id: '1-2' }] };
const emptyState = () => ({ learned: {}, answers: [], assessments: {}, tabVisits: {} });

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
  assert.equal(lessonTabStatus('grammar', lesson, { ...state, answers: [{ lesson: 1, format: 'ordering', correct: true }] }, types), 'complete');
});

test('assessment tab distinguishes passing, active, failed, and forged pass records', () => {
  const state = emptyState();
  const pass = { questionTypes: [...types], wordIds: ['1-1', '1-2'], results: [true, true, true, true, false], passed: true };
  state.assessments[1] = { ...pass, results: [true] };
  assert.equal(lessonTabStatus('quiz', lesson, state, types), 'in-progress');
  state.assessments[1] = pass;
  assert.equal(lessonTabStatus('quiz', lesson, state, types), 'complete');
  state.assessments[1] = { ...pass, results: [true, true, false, false, false], passed: false };
  assert.equal(lessonTabStatus('quiz', lesson, state, types), 'needs-review');
  state.assessments[1] = { passed: true };
  assert.notEqual(lessonTabStatus('quiz', lesson, state, types), 'complete');
});
