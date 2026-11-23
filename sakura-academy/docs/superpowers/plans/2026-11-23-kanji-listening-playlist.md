# Kanji Listening Playlist Implementation Plan

> **For agentic workers:** This plan records the approved direction for a Sakura Academy feature; execute it task by task and keep the checkboxes current.

**Goal:** Let a learner press Play once to hear sample sentences for all 84 N5 kanji with a large active character and optional synchronized furigana.

**Architecture:** Add a third “Kanji listening” mode to the existing Audio lessons route. Bundle an 84-item sentence dataset with aligned ruby text and Japanese audio, using short sourced N5 vocabulary examples where available and original beginner sentences for gaps. Use the existing offline audio manifest and playback/highlight infrastructure; keep the mode available on mobile and in Focus mode.

**Tech Stack:** Existing vanilla JavaScript app, Node test runner, local Kokoro Japanese audio generator, static service-worker cache.

**Spec:** User requested one continuous Play action, large kanji and sample sentence, kana readings above sentence kanji in karaoke style, complete coverage of all 84 kanji, and offline single-project compatibility.

## Global Constraints

- Cover all 84 curated N5 kanji.
- Use one Play/Pause control to move through all entries automatically.
- Make kana readings optional, small, and positioned above kanji; highlight the currently spoken sentence character.
- Bundle audio and data for offline playback.
- Add source links for Tatoeba examples; write original sentences for characters without suitable source examples.
- Record SA-105 before implementation, close it only after verification, and bump the visible version and service-worker cache together.

## Review Focus

- Every card has a kana-only pronunciation matching its ruby text.
- Every kanji has a sentence containing that character; missing audio never silently skips.
- Tatoeba examples retain sentence attribution in the player.
- Playback advances exactly once after each clip and stops cleanly at the final card.
- Three mode controls, furigana toggle, and large text fit a phone viewport.

### Task 1: Data and audio assets

**Files:** Create `src/data/kanji-listening.js`; modify `scripts/generate_kanji_listening_audio.py`, `sw.js`, `index.html`, and `build.mjs`; test in `tests/kanji-listening.test.cjs`.

- [ ] Add one entry per kanji with sentence, furigana markup, kana reading, English, and source ID where sourced.
- [ ] Bundle missing clips with local Kokoro `jf_alpha`; update the JSON/JS manifests and service-worker audio precache.
- [ ] Add failing coverage tests for count, unique characters, ruby alignment, clip availability, and standalone embedding.
- [ ] Run the focused test and verify it fails for the missing feature, then implement the data and generator.

### Task 2: Continuous player

**Files:** Modify `src/audio-lessons.js`, `src/app.js`, `styles.css`; test in `tests/audio-lessons.test.cjs` and `tests/app-integration.test.cjs`.

- [ ] Add the Kanji listening queue and third Audio lessons mode.
- [ ] Render the large active kanji and sentence with an optional Show kana toggle, character-level timed highlighting, translation, and source link.
- [ ] Add one Play/Pause control and a progress indicator; advance through all 84 clips automatically.
- [ ] Verify missing audio errors are visible, final completion is stable, and mobile layout works.

### Task 3: Release and tracker

**Files:** Modify `index.html`, `build.mjs`, `sw.js`, `issue-tracker.html`, `PROGRESS.md`, and tests.

- [ ] Bump the visible release to v1.5.136 and align script/cache versions.
- [ ] Close SA-105 with evidence and correct tracker totals.
- [ ] Run all tests, standalone build, cache/version checks, and mobile browser review.
- [ ] Commit to `main`, verify GitHub Pages deployment, and check the live app and tracker.
