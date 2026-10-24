'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { auditCatalogue } = require('../scripts/content-completeness-audit.cjs');

test('content audit covers all 310 places and records honest exceptions', () => {
  const result = auditCatalogue();
  assert.equal(result.rows.length, 310);
  assert.equal(result.rows.filter(row => !row.complete).length, 309);
  assert.ok(result.rows.every(row => row.name && row.region));
  assert.ok(result.rows.filter(row => !row.complete).every(row => row.gaps.length));
  assert.equal(result.rows.find(row => row.id === 'nikko-in-the-cedars').complete, true);
  assert.equal(result.moji.findings.length, 0);
  assert.ok(result.repeatedSentences.length > 0, 'the uniqueness gate must flag the existing repeated route prose');
});
