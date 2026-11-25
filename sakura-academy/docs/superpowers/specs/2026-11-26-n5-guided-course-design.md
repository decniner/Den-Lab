# Sakura Academy N5 Guided Course Design

## Intent

Turn the existing N5 reference catalogs into a guided, offline-first course with a clear sequence, usable explanations, and visible progress. Keep the 674-word, 81-point grammar, and 84-kanji catalogs available for independent study; add an integrated 12-unit path that teaches all 81 grammar points and all 84 kanji in context.

## Findings and evidence

- N5 currently has 674 vocabulary entries, 81 grammar points, and 84 kanji in separate study tabs.
- Grammar entries already have formation, examples, and usage notes, but the app does not organize them into a teachable course sequence.
- Reading has 12 questions, listening has 16; the 20-item listening mock cycles the same 16 prompts and repeats four.
- The story library has four original three-sentence stories.
- The JLPT does not publish a current exhaustive vocabulary, kanji, or grammar list. Community list counts must remain described as approximate, not official.

## Goals

- Add a first-class 12-unit N5 Course path, grouped by practical beginner situations and sequenced from basic sentence patterns through integrated review.
- Assign every existing N5 grammar point and kanji exactly once to a unit.
- Give each unit a short teacher explanation, a clear “when to use it” distinction, examples, guided vocabulary, reading/listening, and an original mixed-skill check.
- Track unit checklist and assessment completion locally. In Strict mode, disable the next unit until the current unit’s required study steps and assessment are complete; allow review of earlier units. With Strict mode off, allow free navigation.
- Expand original reading/listening practice so a standard 20-question listening mock draws 20 distinct items; grow the story library to 12 short original stories.
- Bundle all added Japanese audio with the existing Kokoro voices and service-worker cache. Preserve the standalone single-file build and existing catalog views.
- Release as v1.6.0 and update the issue tracker before and after the fix.

## Non-goals

- Claim the app contains the official or exhaustive JLPT word/kanji/grammar syllabus.
- Copy JLPT exam items or source story text from third parties.
- Add external services, runtime libraries, accounts, or network requirements.

## Design calls

- Use 12 short practical units, not another giant scrollable page. Each unit has horizontal steps: Learn, Words, Grammar, Kanji, Read & Listen, Check.
- Reuse the existing N5 reference entries, audio helper, story reader, local progress store, strict-mode preference, and build pipeline. Add one focused course-data file for the unit map and original lesson/check content.
- Give units concise hand-written outcomes and usage contrasts. Unit questions use original content and have a transparent pass threshold; mastery is stored locally.
- Add 12 original short story pieces and expand the N5 reading/listening pools with original items. Keep Japanese audio readings explicit and regenerate voice variants offline.
- Keep Home, Settings, and the current Focus-mode default behavior unchanged.

## Acceptance

- All 81 grammar point IDs and 84 kanji map to exactly one unit; no missing or duplicate assignments.
- New learners see the N5 Course path first. Strict progression, saved progress, review of unlocked lessons, and free navigation with Strict mode off work.
- Every new reading/listening item has a valid answer and distractors; all listening/story phrases have explicit kana and bundled audio.
- Tests cover course coverage, unlock/assessment boundaries, state sanitization, mock uniqueness, story rendering/audio coverage, offline caching, and v1.6.0 version consistency.
- Full test suite, standalone build, and service-worker checks pass before publishing.

## Sources

- JLPT N5 test-item purposes: https://www.jlpt.jp/e/guideline/pdf/n5_e_revised.pdf
- JLPT level summary: https://www.jlpt.jp/e/about/levelsummary.html
- JLPT FAQ on why vocabulary/kanji/grammar lists are not published: https://www.jlpt.jp/e/faq/
- Existing community-data and license notes: `DATA_SOURCES.md` and `src/data/NOTICE.md`.
