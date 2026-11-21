const test = require('node:test');
const assert = require('node:assert/strict');
const { getRecognitionTranscript, sentenceMatchScore } = require('../src/speech-practice.js');

test('a low-confidence no-match event still provides the transcript for feedback', () => {
  const event = { results: [[{ transcript: 'わたしは りなです。', confidence: 0.18 }]] };
  assert.equal(getRecognitionTranscript(event), 'わたしは りなです。');
});

test('interim transcript chunks are retained together for fallback feedback', () => {
  const event = { results: [
    Object.assign([{ transcript: 'わたしは', confidence: 0.4 }], { isFinal: false }),
    Object.assign([{ transcript: 'りなです。', confidence: 0.3 }], { isFinal: false }),
  ] };
  assert.equal(getRecognitionTranscript(event), 'わたしはりなです。');
});

test('sentence scoring ignores Japanese punctuation and whitespace', () => {
  assert.equal(sentenceMatchScore('わたしは りなです。', 'わたしはりなです'), 100);
});

test('sentence scoring treats hiragana and katakana as equivalent', () => {
  assert.equal(sentenceMatchScore('わたしは りなです。', 'ワタシハ リナデス。'), 100);
});

test('sentence scoring returns a useful partial score for a near match', () => {
  const score = sentenceMatchScore('わたしはりなです', 'わたしはりなだす');
  assert.ok(score >= 80 && score < 100, `expected partial similarity, got ${score}`);
});
