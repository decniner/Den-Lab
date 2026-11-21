const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const project = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(project, 'src', 'app.js'), 'utf8');
const progressSource = fs.readFileSync(path.join(project, 'src', 'lesson-progress.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(project, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(project, 'styles.css'), 'utf8');

test('lesson renderer calls the helper exported before the app loads', () => {
  assert.match(progressSource, /Object\.assign\(root,\s*\{\s*lessonTabStatus\s*,/);
  assert.match(appSource, /lessonTabStatus\(t\[0\],l,state,ASSESSMENT_TYPES\)/);
  assert.doesNotMatch(appSource, /getLessonTabStatus\(/);
  assert.match(indexHtml, /src="src\/lesson-progress\.js"><\/script><script src="src\/reward-guard\.js"><\/script><script src="src\/speech-audio-manifest\.js\?v=1\.5\.45"><\/script><script src="src\/app\.js\?v=1\.5\.45">/);
});

test('vocabulary search uses a concise mobile-friendly placeholder', () => {
  assert.match(appSource, /aria-label="Search vocabulary" placeholder="Search words"/);
});

test('Settings exposes a persistent accessible text-size preference', () => {
  assert.match(appSource, /aria-label="Interface text size"/);
  assert.match(appSource, /Standard[\s\S]*Large[\s\S]*Extra large/);
  assert.match(appSource, /state\.fontSize=this\.value;applyTextSize\(\);save\(\)/);
  assert.match(appSource, /function applyTextSize\(\)/);
  assert.match(styles, /body\[data-text-size="large"\].*--text-scale:1\.12/);
  assert.match(styles, /body\[data-text-size="extra-large"\].*--text-scale:1\.24/);
});

test('inline Japanese samples use text-size-aware styles', () => {
  assert.doesNotMatch(appSource, /style="[^"]*font-size:/);
  for (const selector of ['.jp-dialogue', '.jp-prompt', '.practice-model', '.practice-reference-char']) {
    assert.match(styles, new RegExp(`${selector.replace('.', '\\.')}\\{font-size:calc\\(var\\(--text-scale, 1\\) \\*`));
  }
});

test('mobile text-size overrides keep important declarations valid', () => {
  assert.match(styles, /font-size:calc\(var\(--text-scale, 1\) \* 54px\)!important/);
  assert.doesNotMatch(styles, /calc\(var\(--text-scale, 1\) \* 54px!important\)/);
  assert.match(styles, /\.sidebar \.navtext\[data-mobile\]\{font-size:0!important\}/);
  assert.doesNotMatch(styles, /font-size:calc\(var\(--text-scale, 1\) \* 0\)/);
  const mobileLabels = [...appSource.matchAll(/\['(?:dashboard|n5|lessons|kana|handwriting|kanji|flashcards|settings)','[^']*','[^']*','([^']*)'\]/g)].map(match => match[1]);
  assert.deepEqual(mobileLabels, ['Home', 'N5', 'Learn', 'Kana', 'Write', 'Kanji', 'Cards', 'Prefs']);
});

test('lesson activity tabs remain sticky and compact on mobile', () => {
  assert.match(styles, /\.tabs\{[^}]*position:sticky;[^}]*top:0/);
  assert.match(styles, /@media\(max-width:760px\)\{\.tabs\{flex-wrap:nowrap;overflow-x:auto/);
  assert.match(styles, /\.tabs \.tab\{flex:0 0 auto\}/);
});

test('Japanese audio prefers bundled clips and gives visible playback failures', () => {
  assert.match(indexHtml, /src="src\/speech-audio-manifest\.js\?v=1\.5\.45"><\/script>/);
  assert.match(appSource, /SAKURA_AUDIO/);
  assert.match(appSource, /speech-toast/);
  assert.match(styles, /\.speech-toast\{[^}]*position:fixed/);
});

test('lesson sentence microphone controls report transcript similarity and capability limits', () => {
  assert.match(appSource, /function practiceSentence\(text\)/);
  assert.match(appSource, /window\.SpeechRecognition\|\|window\.webkitSpeechRecognition/);
  assert.match(appSource, /aria-label="Speak this sentence for feedback"/);
  assert.match(appSource, /Speech recognition is not available in this browser/);
  assert.match(appSource, /estimated pitch pattern/);
  assert.match(appSource, /AudioCtx/);
  assert.match(appSource, /practiceSentence\('\$\{w\.example\}'\)/);
});
