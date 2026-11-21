import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(process.argv[2] || '_site');
const outputProject = join(outputDir, 'sakura-academy');
const html = await readFile(join(projectDir, 'index.html'), 'utf8');
const css = await readFile(join(projectDir, 'styles.css'), 'utf8');
const content = await readFile(join(projectDir, 'src/content.js'), 'utf8');
const n5Data = await readFile(join(projectDir, 'src/n5-data.js'), 'utf8');
const dataSources = await readFile(join(projectDir, 'DATA_SOURCES.md'), 'utf8');
const n5App = await readFile(join(projectDir, 'src/n5-app.js'), 'utf8');
const validation = await readFile(join(projectDir, 'src/content-validation.js'), 'utf8');
const lessonProgress = await readFile(join(projectDir, 'src/lesson-progress.js'), 'utf8');
const audioLessons = await readFile(join(projectDir, 'src/audio-lessons.js'), 'utf8');
const rewardGuard = await readFile(join(projectDir, 'src/reward-guard.js'), 'utf8');
const app = await readFile(join(projectDir, 'src/app.js'), 'utf8');
const audioManifest = JSON.parse(await readFile(join(projectDir, 'src/speech-audio-manifest.json'), 'utf8'));
const inlineAudioManifest = Object.fromEntries(await Promise.all(Object.entries(audioManifest).map(async ([phrase, asset]) => [phrase, { ...asset, src: `data:audio/mpeg;base64,${(await readFile(join(projectDir, asset.src.replace(/^\.\//, '')))).toString('base64')}` }])));
const inlineAudioScript = `globalThis.SAKURA_AUDIO=Object.freeze(${JSON.stringify(inlineAudioManifest)});`;

await mkdir(outputProject, { recursive: true });
await cp(join(projectDir, 'index.html'), join(outputProject, 'index.html'));
await cp(join(projectDir, 'favicon.svg'), join(outputProject, 'favicon.svg'));
await cp(join(projectDir, 'sw.js'), join(outputProject, 'sw.js'));
await cp(join(projectDir, 'issue-tracker.html'), join(outputProject, 'issue-tracker.html'));
await cp(join(projectDir, 'PROGRESS.md'), join(outputProject, 'PROGRESS.md'));
await cp(join(projectDir, 'styles.css'), join(outputProject, 'styles.css'));
await cp(join(projectDir, 'src'), join(outputProject, 'src'), { recursive: true });
await cp(join(projectDir, 'audio'), join(outputProject, 'audio'), { recursive: true });
await writeFile(join(outputProject, 'DATA_SOURCES.md'), dataSources);
await writeFile(join(outputDir, 'DATA_SOURCES.md'), dataSources);

const standalone = html
  .replace('<link rel="stylesheet" href="styles.css?v=1.5.101">', `<style>\n${css}\n</style>`)
  .replace(
    `<script src="src/n5-data.js"></script><script src="src/content.js"></script><script src="src/n5-app.js"></script><script src="src/content-validation.js"></script><script src="src/lesson-progress.js?v=1.5.101"></script><script src="src/audio-lessons.js?v=1.5.101"></script><script src="src/reward-guard.js"></script><script src="src/speech-audio-manifest.js?v=1.5.101"></script><script src="src/app.js?v=1.5.101"></script>`,
    `<script>\n${n5Data}\n${content}\n${n5App}\n${validation}\n${lessonProgress}\n${audioLessons}\n${rewardGuard}\n${inlineAudioScript}\n${app}\n</script>`,
  );
await writeFile(join(outputDir, 'genki-interactive-academy.html'), standalone);
await writeFile(resolve(projectDir, '..', 'genki-interactive-academy.html'), standalone);
console.log(`Built Sakura Academy into ${outputDir}`);
