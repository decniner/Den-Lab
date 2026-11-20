# Sakura Academy

An offline first Japanese beginner learning app, maintained as a small static web project with no build-time dependencies.

## Project layout

- `index.html` — application document shell.
- `styles.css` — layout, responsive styles, and visual design.
- `src/content.js` — lessons, vocabulary, kana, beginner kanji, and ordered stroke paths.
- `src/app.js` — navigation, practice interactions, and local progress.
- `build.mjs` — prepares the GitHub Pages project route and the legacy single-file route.

The app uses no external runtime libraries, APIs, fonts, or services. Progress stays in browser storage. The stroke data is from [KanjiVG](https://kanjivg.tagaini.net/) by Ulrich Apel and contributors, licensed CC BY-SA 3.0; the derived data remains under that license.

## Build

From the repository root, run:

```sh
node sakura-academy/build.mjs /tmp/sakura-academy-site
```

The output contains `/sakura-academy/` with the maintainable source assets and the standalone `genki-interactive-academy.html` compatibility page.
