import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(process.argv[2] || '_site');
const outputProject = join(outputDir, 'sakura-academy');
const html = await readFile(join(projectDir, 'index.html'), 'utf8');
const css = await readFile(join(projectDir, 'styles.css'), 'utf8');
const content = await readFile(join(projectDir, 'src/content.js'), 'utf8');
const app = await readFile(join(projectDir, 'src/app.js'), 'utf8');

await mkdir(outputProject, { recursive: true });
await cp(join(projectDir, 'index.html'), join(outputProject, 'index.html'));
await cp(join(projectDir, 'styles.css'), join(outputProject, 'styles.css'));
await cp(join(projectDir, 'src'), join(outputProject, 'src'), { recursive: true });

const standalone = html
  .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`)
  .replace(
    '<script src="src/content.js"></script><script src="src/app.js"></script>',
    `<script>\n${content}\n${app}\n</script>`,
  );
await writeFile(join(outputDir, 'genki-interactive-academy.html'), standalone);
console.log(`Built Sakura Academy into ${outputDir}`);
