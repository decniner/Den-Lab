# Sakura Academy

An offline first Japanese beginner learning app, maintained as a small static web project with no build-time dependencies.

## Project layout

- `index.html` — application document shell.
- `styles.css` — layout, responsive styles, and visual design.
- `src/content.js` — original lessons, kana, expanded kanji, and ordered stroke paths.
- `src/n5-data.js` — approximate N5 vocabulary, grammar, kanji, and original reading/listening practice (12 reading and 16 listening questions).
- `src/n5-app.js` — N5 course hub, searchable study lists, exam-format practice, and a timed 60-question mock with 20/40/30-minute sections.
- `src/data/` — upstream OpenJLPT source data and attribution notice.
- `DATA_SOURCES.md` — JLPT scope, coverage mapping, data attribution, and licenses.
- `src/app.js` — navigation, practice interactions, and local progress.
- `sw.js` — caches the Sakura Academy app shell for offline use, scoped to the Academy route.
- `src/content-validation.js` and `src/reward-guard.js` — course-data checks and one-time XP rewards, shared by the app and its tests.
- `tests/` — course-content, reward-guard, and offline-shell checks run in CI.
- `build.mjs` — prepares the GitHub Pages project route and the legacy single-file route.

The app uses no external runtime libraries, APIs, fonts, or services. JLPT level mappings are approximate community lists, not official specifications. Progress stays in browser storage. The stroke data is from [KanjiVG](https://kanjivg.tagaini.net/) by Ulrich Apel and contributors, licensed CC BY-SA 3.0; the derived data remains under that license.

## Build

From the repository root, run:

```sh
node sakura-academy/build.mjs /tmp/sakura-academy-site
```

Run the focused content checks with:

```sh
node --test sakura-academy/tests/content-quality.test.cjs sakura-academy/tests/offline-shell.test.cjs
```

The output contains `/sakura-academy/` with the maintainable source assets and the standalone `genki-interactive-academy.html` compatibility page. The build also refreshes the tracked root compatibility file; edit the project sources, not that generated file. The JLPT content is a best-effort community approximation: the JLPT does not publish a current exhaustive vocabulary, kanji, or grammar specification.
