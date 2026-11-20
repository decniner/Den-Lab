const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const project = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(project, 'src', 'app.js'), 'utf8');
const progressSource = fs.readFileSync(path.join(project, 'src', 'lesson-progress.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(project, 'index.html'), 'utf8');

test('lesson renderer calls the helper exported before the app loads', () => {
  assert.match(progressSource, /Object\.assign\(root,\s*\{\s*lessonTabStatus\s*,/);
  assert.match(appSource, /lessonTabStatus\(t\[0\],l,state,ASSESSMENT_TYPES\)/);
  assert.doesNotMatch(appSource, /getLessonTabStatus\(/);
  assert.match(indexHtml, /src="src\/lesson-progress\.js"><\/script><script src="src\/reward-guard\.js"><\/script><script src="src\/app\.js">/);
});
