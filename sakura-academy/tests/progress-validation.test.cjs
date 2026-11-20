const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateProgressBackupSettings, sanitizeStoredProgressSettings } = require('../src/content-validation.js');

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
