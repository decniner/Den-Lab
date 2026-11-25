# Sakura Academy N5 Guided Course Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ship a guided 12-unit offline N5 course that sequences all current grammar and kanji, integrates original reading/listening lessons, and tracks strict-mode progression.

**Architecture:** Add a focused `n5-course.js` curriculum map consumed by the existing N5 app. Reuse current local progress, audio, story reader, reference catalogs, and static build pipeline. Enlarge original story and practice data, then generate bundled Kokoro clips and update the offline shell.

**Tech Stack:** Vanilla JavaScript, static HTML/CSS, Node built-in test runner, existing local Kokoro Python environment and MP3 pipeline.

**Spec:** `docs/superpowers/specs/2026-11-26-n5-guided-course-design.md`

## Global Constraints

- Keep the app offline-first, dependency-free at runtime, and compatible with the generated standalone HTML.
- State that JLPT word/kanji/grammar lists are community approximations; do not claim official or exhaustive lists.
- Preserve current catalog, Focus mode, voice selection, and Home/Settings behavior.
- Bundle new speech audio in all supported Kokoro voice choices; never add network-only lesson content.
- Bump the visible app version and service-worker cache together to v1.6.0.
- Record SA-111 before implementation and close/update it only after verification.

## Review Focus

- Grammar and kanji are each mapped exactly once across 12 units — `n5-course.test.cjs` checks IDs and duplicates.
- Strict-mode progress cannot be forged or accidentally unlock a unit — tests exercise incomplete, passed, malformed, and saved states.
- Listening mocks use 20 distinct questions — `n5-course.test.cjs` and N5 mock tests assert uniqueness.
- Story and listening Japanese narration follows explicit kana — pronunciation tests validate readings and manifest fingerprints.
- Standalone and offline builds include the course script and every new audio asset — offline-shell and build validation cover this.

---

### Task 1: Original N5 lesson and assessment data

**Files:**
- Create: `src/n5-course.js`
- Modify: `src/n5-data.js`
- Modify: `src/n5-stories.js`
- Test: `tests/n5-course.test.cjs`
- Test: `tests/japanese-pronunciation.test.cjs`
- Test: `tests/story-reading.test.cjs`

**Interfaces:**
- Produces `N5_COURSE_UNITS`, each with a stable `id`, `title`, `canDo`, short lesson `explanation`, `usage`, `pitfall`, `grammarIds`, `kanji`, `vocabularyWords`, `storyId`, and original `check` questions.
- Every check question has `skill`, `prompt`, `options`, `answer`, and learner-facing feedback.

- [x] Write tests for 12 units, complete unique coverage of 81 grammar IDs and 84 kanji, valid vocabulary/story references, and 3–5 mixed-skill questions per unit.
- [x] Run the focused test and confirm it fails because course data is absent.
- [x] Add the 12-unit map, original story entries (one per unit), and original reading/listening items. Preserve existing records and attribution.
- [x] Validate explicit kana for every new story and listening phrase; regenerate all three Kokoro voice variants with existing scripts.
- [x] Run N5 data, reading, and pronunciation tests; verify audio manifest and file fingerprints.

### Task 2: Guided lesson flow and local progression

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `src/n5-app.js`
- Modify: `styles.css`
- Test: `tests/n5-course.test.cjs`
- Test: `tests/app-integration.test.cjs`

**Interfaces:**
- `n5CoursePage()` renders the course overview or selected unit.
- `n5CourseAdvance()` and step controls navigate Learn, Words, Grammar, Kanji, Read & Listen, and Check.
- `n5CourseDone(unitId, step)` reads completion as validated boolean flags in `state.n5Study`; `n5CourseAdvance()` records flags and calls `save()`.
- `n5CourseCanOpen(unitIndex)` determines if required course activities and the assessment are complete.

- [x] Add failing tests for the course being the first N5 tab, step navigation, persistent progress, strict unlock/previous-unit review, and free navigation when Strict mode is off.
- [x] Run focused tests and verify they fail on the current seven-tab reference browser.
- [x] Implement compact unit study screens reusing grammar notes/examples, vocab audio, kanji explorer links, story karaoke, and original mixed-skill checks.
- [x] Add an explicit per-unit checklist and assessment pass threshold; keep labels and touch targets mobile-sized.
- [x] Run course and app-integration tests, including malformed persisted progress.

### Task 3: Offline build, tracker, release, and deployment

**Files:**
- Modify: `src/speech-audio-manifest.json`
- Modify: `src/speech-audio-manifest.js`
- Modify: `sw.js`
- Modify: `build.mjs`
- Modify: `index.html`
- Modify: `tests/offline-shell.test.cjs`
- Modify: `tests/audio-lessons.test.cjs`
- Modify: `PROGRESS.md`
- Modify: `issue-tracker.html`
- Generated: `../genki-interactive-academy.html`

- [x] Add tests for v1.6.0 consistency, offline precache coverage, archive/summary counts, course assets in the standalone build, and distinct listening question selection.
- [x] Update the mock to draw 20 distinct listening items when available; protect the behavior with a regression assertion.
- [x] Rebuild the app shell after TTS generation and confirm the standalone page contains the same N5 course.
- [x] Run all Sakura Academy tests, `node --check` on changed scripts, `node build.mjs`, and `git diff --check`.
- [x] Close SA-111 with evidence, update progress counts, and bump the visible and service-worker version to v1.6.0.
- [x] Commit and push to `main`.
- [x] Verify GitHub Actions run 45718900977 and the live app/tracker at v1.6.0.
