# Sakura Academy issue tracker

Every published app change must bump the small footer version and its update date, and keep the service-worker cache version in sync. This page is the source of truth for the Sakura Academy reliability audit. Counts and statuses on `issue-tracker.html` mirror this register. Progress is updated in 10% steps; New is 0%, Closed is 100%. Discovery times are marked `Not recorded` when they were not captured at discovery. Fix duration is recorded only after resolution.

## Summary

- Total tracked: 40
- Work in progress: 0
- New: 0
- Closed: 40
- Timeline gaps: 40

## Issue register

| Issue | Owner | Status | Progress | Discovered | Time to fix |
|---|---|---|---:|---|---|
| SA-001 — Speaker B replies were identical across lessons | Codex | Closed | 100% | Not recorded | Not recorded |
| SA-002 — Vocabulary examples often did not demonstrate the target word | Codex | Closed | 100% | Not recorded | Not recorded |
| SA-003 — Content validator falsely reported numeric lesson IDs missing | Codex | Closed | 100% | Not recorded | Not recorded |
| SA-004 — Vocabulary cards lack practical usage and context guidance | Codex | Closed | 100% | 2026-11-20 | Not recorded |
| SA-005 — Repeatable study actions could award XP repeatedly | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-006 — Repeated answer clicks could distort lesson accuracy | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-007 — Hosted offline refresh/update cycle not fully verified | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-008 — Lesson grammar explanations are too brief and generic | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-009 — Imported progress can inject unsafe settings markup | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-010 — Imported assessment flag can bypass strict-mode checklist | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-011 — Lesson tabs do not show activity status | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-012 — Non-boolean imported progress can satisfy strict checkpoints | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-013 — Published issue tracker script fails to parse | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-014 — Lesson tabs can inherit unrelated completion evidence | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-015 — Progress summary timeline-gap count disagrees with tracker | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-016 — Imported practice flags can distort progress and reward state | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-017 — Lesson completion can bypass strict-mode skill checkpoints | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-018 — Legacy vocabulary quiz can be migrated as mixed assessment | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-019 — Lesson writing canvas has no target character or stroke guide | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-020 — Stroke-order step can carry over to the next character | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-021 — Opening a lesson fails on an undefined tab-status helper | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-022 — Sakura Academy favicon is missing from the built site | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-023 — Vocabulary search placeholder is clipped on mobile | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-024 — Learners cannot adjust interface text size | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-025 — Text size preference misses inline-styled character samples | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-026 — Mobile navigation labels are clipped at phone widths | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-027 — Resolved issues are mixed with active tracker items | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-028 — Assessment can test lesson vocabulary before it is studied | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-029 — Lesson example sentences lack nearby audio controls | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-030 — Lesson activity tabs disappear while studying long vocabulary lists | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-031 — Lesson Play controls are silent when the browser has no speech engine | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-032 — Lesson sentences have no microphone pronunciation check | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-033 — Cached lesson script can hide the newly released microphone control | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-034 — Microphone check discards the transcript from a low-confidence result | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-035 — Mobile speech recognition captures audio but returns no Japanese transcript | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-036 — Unreliable sentence microphone controls should be removed | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-037 — Strict lesson checklist items cannot open the next activity | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-038 — Checklist shortcut leaves the lesson scrolled near the bottom | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-039 — Daily routine audio pronounces 7 o’clock as ななじ | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-040 — Strict mode is off by default | Codex | Closed | 100% | 2026-11-21 | Not recorded |

### SA-013 — Published issue tracker script fails to parse

- **Status:** Closed (100%)
- **Evidence:** Removed the orphaned text after SA-010. The issue tracker script now parses and executes, rendering its summary and all issue rows.
- **Impact:** Resolved: the reliability tracker and its search controls render again.
- **Resolution:** Added a regression test that compiles and executes the embedded tracker script and checks totals and newly registered issue rows.
- **Verification:** All 35 focused Academy tests pass, including tracker parsing and rendering.
- **Fix estimate:** Time not recorded.

### SA-014 — Lesson tabs can inherit unrelated completion evidence

- **Status:** Closed (100%)
- **Evidence:** Grammar Lab and Sentence Builder now use independent progress evidence. Lesson-level completion no longer overrides individual tab states. Grammar Lab records each reviewed example part and completes only when all parts have been explored.
- **Impact:** Resolved: green tab labels now reflect activity within that specific section.
- **Resolution:** Added per-lesson grammar-part progress with safe backup sanitization; preserved focus while refreshing the live tab status after each selection.
- **Verification:** Tests cover unrelated lesson completion, builder/grammar separation, untouched/visited/partial/complete states, and sanitization of duplicate or invalid indexes. All 35 focused Academy tests pass.
- **Fix estimate:** Time not recorded.

### SA-015 — Progress summary timeline-gap count disagrees with tracker

- **Status:** Closed (100%)
- **Evidence:** Both summaries now report 15 timeline gaps. The metric counts an issue when its discovery date or fix duration is unrecorded; all 15 issues currently lack a fix duration record.
- **Impact:** Resolved: the project register and published tracker no longer show conflicting totals.
- **Resolution:** Reconciled the source count and added a regression test comparing all five markdown summary metrics with the rendered tracker cards.
- **Verification:** All 35 focused Academy tests pass, including the cross-summary consistency check.
- **Fix estimate:** Time not recorded.

### SA-016 — Imported practice flags can distort progress and reward state

- **Status:** Closed (100%)
- **Evidence:** Backup imports reject non-boolean values in kana, kanji, handwriting, and reward maps. Older stored state drops malformed values before rendering or reward checks. Readiness and handwriting progress count only known characters with explicit `true` flags.
- **Impact:** Resolved: malformed backup values cannot fabricate practice progress or suppress legitimate XP rewards.
- **Resolution:** Added practice-map validation and startup/import sanitization, and replaced key counts with known-true flag counts.
- **Verification:** Tests cover import rejection, cleanup of malformed local flags, valid flag preservation, and exclusion of false, non-boolean, and unknown keys from progress totals. The full focused Academy suite passes.
- **Fix estimate:** Time not recorded.

### SA-017 — Lesson completion can bypass strict-mode skill checkpoints

- **Status:** Closed (100%)
- **Evidence:** The strict milestone evaluator now requires its own evidence for vocabulary, grammar, conversation, listening, writing, and assessment. A lesson-level completion flag no longer satisfies any skill item.
- **Impact:** Resolved: completing a lesson outside strict mode cannot unlock the next lesson's strict checklist.
- **Resolution:** Removed the lesson-wide shortcut from strict milestone evaluation; all Next gating still depends on every checklist item passing individually.
- **Verification:** Regression coverage confirms a completed lesson with no skill evidence leaves all six milestones incomplete. All 38 focused Academy tests pass.
- **Fix estimate:** Time not recorded.

### SA-018 — Legacy vocabulary quiz can be migrated as mixed assessment

- **Status:** Closed (100%)
- **Evidence:** Legacy records without their original skill types or word IDs now fail current-run validation and reset to a fresh mixed-skill assessment. Valid current runs remain unchanged.
- **Impact:** Resolved: old vocabulary-only results cannot satisfy the new mixed-skills assessment milestone.
- **Resolution:** Removed the migration that assigned random types/word IDs to legacy results; centralized assessment-run validation and fresh-run fallback.
- **Verification:** Regression coverage proves a legacy 4/5 pass resets and a valid incomplete current run is preserved. The complete focused Academy suite passes.
- **Fix estimate:** Time not recorded.

### SA-001 — Speaker B replies were identical across lessons

- **Status:** Closed (100%)
- **Evidence:** All 12 lessons now have different context-specific Speaker B replies, with matching answer choices and translations.
- **Impact:** Resolved: dialogue practice now models varied, relevant responses.
- **Resolution:** The learner sees Speaker A, chooses a fitting response, then sees and can hear Speaker B’s reply.
- **Verification:** Automated test confirms all replies differ and each correct choice matches Speaker B; browser flow confirmed the reply and disabled choices after answering.
- **Fix estimate:** Time not recorded.

### SA-004 — Vocabulary cards lack practical usage and context guidance

- **Status:** Closed (100%)
- **Evidence:** All 95 unique vocabulary items received an editorial review. Five misleading notes were corrected: いくら now distinguishes prices from counts; family guidance uses ご家族; another person’s younger sister is 妹さん; the window note distinguishes nearby に from activity で; and 好き guidance presents が as the basic pattern while noting は for topic or contrast.
- **Impact:** Incorrect forms or overbroad rules can teach beginners unnatural Japanese even when the examples are valid.
- **Resolution:** Corrected the five audited notes, added regression tests, and cross-checked with Tokyo Metropolitan University N5 materials and Japan Foundation Irodori beginner resources.
- **Verification:** The complete vocabulary content-quality suite passes and independently asserts the corrected distinctions. References are listed in DATA_SOURCES.md.
- **Fix estimate:** Time not recorded.

### SA-002 — Vocabulary examples often did not demonstrate the target word

- **Status:** Closed (100%)
- **Evidence:** All 96 vocabulary entries now have individual Japanese examples and translations, each containing its target headword.
- **Impact:** Resolved: each card now demonstrates the word being taught instead of repeating the lesson sentence for unrelated words.
- **Resolution:** Replaced generic repeated examples with a target-specific example for each item.
- **Verification:** Automated test checks every example includes its Japanese headword and translation; all 96 pass.
- **Fix estimate:** Time not recorded.

### SA-003 — Content validator falsely reported numeric lesson IDs missing

- **Status:** Closed (100%)
- **Evidence:** Lesson identifiers are numeric. The previous generic `.length` check treated valid IDs as missing.
- **Impact:** Resolved: valid course content no longer produces misleading missing-ID warnings.
- **Resolution:** Replaced the loosely typed check with explicit ID, string, array, vocabulary, dialogue, answer-choice, example, and guidance validation.
- **Verification:** Automated tests confirm valid numeric IDs pass and malformed lesson fields fail. The full course content validator passes.
- **Fix estimate:** Time not recorded.

### SA-005 — Repeatable study actions could award XP repeatedly

- **Status:** Closed (100%)
- **Evidence:** Correct dialogue, builder, listening, and writing answers, along with repeatable study marks, could award XP on every click.
- **Impact:** Resolved: repeat actions no longer inflate XP and activity totals.
- **Resolution:** Added persisted one-time reward keys for words, lessons, kana, kanji, handwriting, and per-day card reviews; correct answer buttons disable after a response. Existing saved progress is retained.
- **Verification:** Automated reward-guard test confirms one claim is accepted and a repeat rejected; browser confirmed a dialogue answer awarded 5 XP and then disabled the response choices.
- **Fix estimate:** Time not recorded.

### SA-006 — Repeated answer clicks could distort lesson accuracy

- **Status:** Closed (100%)
- **Evidence:** Listening, sentence-builder, and typed-writing answers remained active after feedback; duplicate clicks added extra answer records.
- **Impact:** Resolved: a submitted answer is counted once until the learner deliberately begins a new attempt.
- **Resolution:** Locked submitted controls and added explicit retry actions; sentence-builder submissions unlock only when the learner edits the sentence.
- **Verification:** Browser confirmed listening options disable after a correct answer, the retry control is visible, and no console errors occur.
- **Fix estimate:** Time not recorded.

### SA-012 — Non-boolean imported progress can satisfy strict checkpoints

- **Status:** Closed (100%)
- **Evidence:** Import now rejects non-boolean learned/completed flags and malformed answer records. Older local progress drops invalid flags and answers before the app evaluates strict requirements. The checklist uses explicit `=== true` predicates for every milestone.
- **Impact:** Resolved: truthy strings or malformed records cannot unlock strict-mode sections or inflate learned-word progress.
- **Resolution:** Added strict progress validation and startup sanitization, then routed each checklist item through typed milestone checks.
- **Verification:** Regression tests reject string flags and answer correctness, accept valid records, remove malformed stored data, and directly verify strict milestone behavior. The complete focused suite passes.
- **Fix estimate:** Time not recorded.

### SA-011 — Lesson tabs do not show activity status

- **Status:** Closed (100%)
- **Evidence:** Lesson tabs now reflect measured progress: green for completed, amber for active or in-progress, the existing dark style for not started, and red for a failed five-question assessment.
- **Impact:** Resolved: learners can scan lesson sections to see what is complete, underway, untouched, or needs an assessment retry.
- **Resolution:** Added persisted tab visits and a shared status evaluator based on learned vocabulary, correct practice answers, and validated assessment results. Statuses include accessible names and hover labels.
- **Verification:** Four focused tests cover untouched/visited tabs, partial/complete vocabulary, correct/incorrect practice, passing/in-progress/failed assessments, and forged pass flags. The full 27-test focused suite passes.
- **Fix estimate:** Time not recorded.

### SA-010 — Imported assessment flag can bypass strict-mode checklist

- **Status:** Closed (100%)
- **Evidence:** Strict mode now accepts an assessment only when all five skill types are present, two valid lesson vocabulary items are recorded, five boolean results exist, at least four are correct, and the pass flag is true.
- **Impact:** Resolved: an incomplete or malformed imported assessment cannot satisfy the strict-mode assessment requirement.
- **Resolution:** Added a shared passing-assessment validator and used it in the strict checklist.
- **Verification:** Regression tests reject a lone `passed: true` flag, incomplete results, a failing score, invalid type distribution, and unknown vocabulary IDs; a valid 4/5 mixed-skills run passes.
- **Fix estimate:** Time not recorded.

### SA-009 — Imported progress can inject unsafe settings markup

- **Status:** Closed (100%)
- **Evidence:** Backup import now rejects a non-safe or out-of-range goal and any XP value that is not a nonnegative safe integer before asking to replace current progress. Earlier locally stored values are normalized before settings render.
- **Impact:** Resolved: a crafted backup cannot pass markup as the daily goal, and invalid XP cannot poison progress totals.
- **Resolution:** Added shared progress-settings validation and startup sanitization; wired the checks into backup import and added regression coverage.
- **Verification:** 20 content, offline-shell, and backup-validation tests pass. Tests cover markup-like goals, goal bounds, unsafe XP, and stored-progress sanitization.
- **Fix estimate:** Time not recorded.

### SA-008 — Lesson grammar explanations are too brief and generic

- **Status:** Closed (100%)
- **Evidence:** All 12 lesson explanations now describe form and use, all 12 common-mistake notes are specific to their topic, and each grammar panel's interactive tokens and English translation match its displayed Japanese sentence. The earlier 8 mismatched examples have been reconciled.
- **Impact:** Resolved: learners get a worked example, when-to-use guidance, and a relevant pitfall for each core lesson pattern.
- **Resolution:** Expanded all 12 explanations; corrected the eight mismatched builder examples/translations; and updated Lesson 12's worked example to demonstrate both reason-giving and advice. The grammar panel now labels the worked example and explains what the interactive tiles show.
- **Verification:** All 12 course/offline tests pass. The course validator passes. Hosted browser checks confirmed the matching example, translation, explanation, and word tiles in Lessons 1 and 12. Japanese usage was checked against Japan Foundation Irodori grammar notes and Tokyo Metropolitan University mic-J N5 materials.
- **Fix estimate:** Time not recorded.

### SA-007 — Hosted offline refresh/update cycle not fully verified

- **Status:** Closed (100%)
- **Evidence:** The Academy service worker precaches the full 14-file shell and falls back to cached navigation. In isolated headless Chrome against the live GitHub Pages site, v1.5.29 loaded under an active service worker; with browser HTTP cache disabled and network emulation offline, a forced reload still rendered v1.5.29 with the service worker controlling the page. Lesson 1 then opened offline with all seven tabs and eight vocabulary cards.
- **Impact:** Resolved: the hosted Academy reloads and lesson activities remain available after network loss.
- **Implementation:** The Academy-route worker precaches the app shell, provides network-first navigation with a cached fallback, and ties its cache version to the visible app version.
- **Verification:** Real hosted offline reload and Lesson 1 interaction passed in a clean browser profile. The focused suite passes and covers cache population, fallback navigation, failed installation, and version synchronization.
- **Resolution:** Confirmed that offline reload uses the active service worker cache, not the browser HTTP cache.
- **Fix estimate:** Time not recorded.

## Evidence reports

### Closure batch 1 · 2026-11-21 · 4 issues closed

- **Checks passed:** Five Sakura Academy content/reward tests; app and helper syntax checks; static build; browser check of contextual dialogue and one-time XP reward; Pages workflow now runs the content suite.
- **Regressions found:** The dialogue answer was initially shown before the learner responded; the new flow hides Speaker B until an answer and then disables choices.
- **Changes reverted:** None.
- **Remaining risks:** SA-004 usage-note wording still needs a full editorial review. Browser/device coverage remains limited; no automated visual regression suite is configured.

### Closure batch 2 · 2026-11-21 · fifth issue closed

- **Issues covered:** SA-001, SA-002, SA-003, SA-005, and SA-006 (the latest five closures).
- **Checks passed:** Five content/reward tests; syntax checks and standalone build; browser checks for contextual replies, XP awarded once, disabled submitted answers, and explicit retries. GitHub Actions now runs the content/reward suite.
- **Regressions found:** None remaining after the review fix.
- **Changes reverted:** None.
- **Remaining risks:** SA-004 still needs editorial review of the 95 usage notes; user-specific progress migration and broader mobile/browser coverage remain unverified.

### Closure batch 3 · 2026-11-21 · lesson explanation issue closed

- **Issue covered:** SA-008.
- **Checks passed:** 12 content/offline-shell tests; all generated service-worker precache assets exist; live GitHub Pages workflow succeeded.
- **Browser verification:** Hosted Grammar lab rendered the matching Japanese example, translation, explanation, and token sequence in Lessons 1 and 12.
- **Remaining risks:** SA-004 vocabulary usage wording still needs a complete editorial review; SA-007 still needs a real offline refresh/update cycle in a browser with network controls.


### Content review batch · 2026-11-21 · vocabulary guidance issue closed

- **Issue covered:** SA-004.
- **Scope:** Reviewed all 95 usage notes; corrected five misleading or overbroad formulations.
- **Checks passed:** 11 content-quality tests; focused offline-shell checks and version/cache consistency are run for this release.
- **Remaining risks:** SA-007 still needs a real hosted offline-refresh/update cycle; broader device/browser coverage remains limited.


### Security/reliability batch · 2026-11-21 · backup import issue closed

- **Issue covered:** SA-009.
- **Checks passed:** 20 focused tests; app and validator syntax checks; static project build. The Pages workflow now runs the backup-validation tests.
- **Remaining risks:** SA-007 still needs a real hosted offline refresh/update cycle; broader device/browser coverage remains limited.


### Strict assessment batch · 2026-11-21 · imported assessment issue closed

- **Issue covered:** SA-010.
- **Checks passed:** 21 focused content, offline-shell, and progress-validation tests; syntax checks; static build.
- **Remaining risks:** SA-007 still needs a real hosted offline refresh/update cycle; broader device/browser coverage remains limited.


### Lesson progress batch · 2026-11-21 · tab status issue closed

- **Issue covered:** SA-011.
- **Checks passed:** 27 focused tests; JavaScript syntax checks; standalone build with the status helper included.
- **Remaining risks:** SA-007 still needs a real hosted offline refresh/update cycle; browser/device coverage remains limited.


### Strict progress validation batch · 2026-11-21 · malformed flag issue closed

- **Issue covered:** SA-012.
- **Checks passed:** 31 focused tests; JavaScript syntax checks; standalone build.
- **Remaining risks:** SA-007 still needs a real hosted offline refresh/update cycle; broader browser/device coverage remains limited.


### Tracker and lesson-status batch · 2026-11-21 · two issues closed

- **Issues covered:** SA-013 and SA-014.
- **Checks passed:** 35 focused tests; tracker inline JavaScript parsed and executed against a DOM stub; application and helper syntax checks; standalone build.
- **Remaining risks:** SA-007 still needs a real hosted offline refresh/update cycle; broader browser/device coverage remains limited.


### Audit summary reconciliation · 2026-11-21 · tracker counts synchronized

- **Issue covered:** SA-015.
- **Checks passed:** The focused tracker test compares Total, Work in progress, New, Closed, and Timeline gaps with the rendered issue tracker.
- **Remaining risks:** SA-007 still needs a real hosted offline refresh/update cycle; broader browser/device coverage remains limited.


### Practice-progress import validation · 2026-11-21 · one issue closed

- **Issue covered:** SA-016.
- **Checks passed:** Full focused Academy test suite, JavaScript syntax checks, and standalone build.
- **Remaining risks:** SA-007 still needs a real hosted offline refresh/update cycle; broader browser/device coverage remains limited.


### Strict-mode milestone integrity · 2026-11-21 · one issue closed

- **Issue covered:** SA-017.
- **Checks passed:** All six milestone predicates reject lesson-wide completion without their own evidence; 38 focused tests, syntax checks, and standalone build pass.
- **Remaining risks:** SA-007 still needs a real hosted offline refresh/update cycle; broader browser/device coverage remains limited.


### Mixed-assessment evidence integrity · 2026-11-21 · one issue closed

- **Issue covered:** SA-018.
- **Checks passed:** Legacy pass reset, valid current-run preservation, mixed-skills assessment validation, and full focused Academy test suite.
- **Remaining risks:** SA-007 still needs a real hosted offline refresh/update cycle; broader browser/device coverage remains limited.


### Offline update verification · 2026-11-21 · SA-007 advanced evidence

- **Checks passed:** Older open tabs refreshed from v1.5.9 to v1.5.17 and from v1.5.17 to v1.5.23. A separate isolated headless Chrome profile loaded hosted v1.5.29 under its service worker; with HTTP cache disabled and network emulation offline, reload rendered the same app version from the worker cache. Lesson 1 remained interactive offline with seven tabs and eight vocabulary cards.
- **Status:** SA-007 Closed (100%).


### SA-019 — Lesson writing canvas has no target character or stroke guide

- **Status:** Closed (100%)
- **Evidence:** The lesson Writing tab now preserves its typed-answer activity and directs freehand learners to Write characters, where a reference glyph, stroke-order animation, and drawing canvas stay together.
- **Impact:** Resolved: learners are no longer invited to draw arbitrary kana/kanji without a visual target or stroke-order reference.
- **Resolution:** Replaced the empty lesson canvas with a direct link to the guided character practice flow and removed its unused canvas handlers.
- **Verification:** Regression tests confirm the link routes to handwriting practice and all 92 basic kana plus 84 beginner kanji have stroke paths. The live lesson flow is checked after deployment.
- **Fix estimate:** Time not recorded.


### SA-020 — Stroke-order step can carry over to the next character

- **Status:** Closed (100%)
- **Evidence:** Previous, Next, Mark practiced, and script changes now stop any running animation and reset the stroke counter to step zero.
- **Impact:** Resolved: each character’s guide begins at its first stroke after navigation.
- **Resolution:** Centralized script switching and reset the guide state in all character-change handlers.
- **Verification:** Regression tests verify each character change resets the guide before rendering. The complete focused Academy suite passes.
- **Fix estimate:** Time not recorded.


### Guided lesson writing · 2026-11-21 · two issues closed

- **Issues covered:** SA-019 and SA-020.
- **Checks passed:** All 92 basic kana and 84 beginner kanji have stroke paths; lesson writing routes to guided character practice; character navigation resets the stroke guide; 42 focused Academy tests, JavaScript syntax checks, and standalone build pass.
- **Remaining risks:** SA-007 still needs a real hosted offline refresh/update cycle; broader browser/device coverage remains limited.


### SA-021 — Opening a lesson fails on an undefined tab-status helper

- **Status:** Closed (100%)
- **Evidence:** The lesson renderer now calls the exported `lessonTabStatus` helper. A local browser entered Lesson 1 and displayed all seven activity tabs without a runtime error.
- **Impact:** Resolved: learners can open lesson content and use its activity tabs.
- **Resolution:** Corrected the helper name and added a regression check for helper export, app call, and script loading order.
- **Verification:** The app/helper integration test passes; browser smoke check opened Lesson 1 and its Writing tab.
- **Fix estimate:** Time not recorded.


### Lesson navigation integration · 2026-11-21 · one issue closed

- **Issue covered:** SA-021.
- **Checks passed:** Live DOM smoke check opened Lesson 1, rendered all activity tabs, and entered its Writing tab; app/helper wiring test passed.
- **Remaining risks:** SA-007 still needs a real hosted offline refresh/update cycle; broader browser/device coverage remains limited.


### SA-022 — Sakura Academy favicon is missing from the built site

- **Status:** Closed (100%)
- **Evidence:** The static build now copies `favicon.svg` into the Academy project. A regression test builds an isolated project and compares the emitted icon byte-for-byte; the published asset returns HTTP 200 with `image/svg+xml`, and the app index links to it.
- **Impact:** Resolved: Sakura Academy has a branded browser-tab and bookmark icon, and its file is included in the offline shell.
- **Resolution:** Added the self-contained icon, linked it from the app shell, added it to the service-worker precache, and fixed the build script to copy it into the published project.
- **Verification:** The build-output regression test, 44 focused tests, content validation, and GitHub Pages deployment pass; the live icon returns HTTP 200.
- **Fix estimate:** Time not recorded.


### Visual polish release · 2026-11-21 · SA-022 closed

- **Checks passed:** Static build integration test confirms `favicon.svg` is emitted into the published project; live asset responds HTTP 200 with SVG content type; index link and service-worker cache versions match v1.5.28.
- **Issue covered:** SA-022.
- **Remaining risk:** SA-007 still awaits a real hosted offline refresh/update cycle.


### Hosted offline refresh verification · 2026-11-21 · SA-007 closed

- **Checks passed:** Online load populated the v1.5.29 service-worker cache and confirmed the page was controlled. With HTTP cache disabled and the network emulated offline, forced reload stayed on the Academy URL and showed the v1.5.29 footer. Offline navigation to Lesson 1 rendered all seven activity tabs and eight vocabulary cards.
- **Issue covered:** SA-007.
- **Remaining tracked risk:** None in the current issue register.


### SA-023 — Vocabulary search placeholder is clipped on mobile

- **Status:** Closed (100%)
- **Evidence:** Shortened the hint to “Search words.” At a 390px device viewport, the hint measures about 93px with 139px of available input width; it is fully visible beside the category picker and the page has no horizontal overflow.
- **Impact:** Resolved: the complete search hint is legible on a common phone width.
- **Resolution:** Changed the placeholder from “Search Japanese or English” to “Search words.”
- **Verification:** A 390px headless Chrome view confirms the hint fits, all seven lesson tabs remain available, and the document width stays at 390px. The app integration check and full focused suite pass.
- **Fix estimate:** Time not recorded.


### Mobile polish release · 2026-11-21 · SA-023 closed

- **Checks passed:** At 390 × 844, “Search words” measured about 93px within 139px available; the category selector remained visible, the lesson retained seven tabs, and document width matched the viewport.
- **Issue covered:** SA-023.
- **Remaining tracked risk:** None in the current issue register.

### SA-024 — Learners cannot adjust interface text size

- **Status:** Closed (100%)
- **Evidence:** Settings offers Standard, Large, and Extra large interface text. The choice is saved with local progress, persists after reload, and safely defaults older progress to Standard. Backup imports accept only the three known values.
- **Impact:** Resolved: learners can enlarge interface and lesson text to suit their reading needs.
- **Resolution:** Added accessible text-size selection and a shared interface scale for the app typography.
- **Verification:** Browser confirmed Extra large scales a lesson title from 29px to 35.96px, saves to local progress, restores after reload, and creates no horizontal overflow. All focused settings, backup-validation, integration, and full Academy checks pass.
- **Fix estimate:** Time not recorded.

### Font size preference release · 2026-11-21 · SA-024 closed

- **Checks passed:** 47 Academy tests pass; browser verified Standard → Extra large, persisted storage and reload restoration, and no horizontal overflow.
- **Issue covered:** SA-024.
- **Version:** v1.5.34.

### SA-025 — Text size preference misses inline-styled character samples

- **Status:** Closed (100%)
- **Evidence:** Inline Japanese samples use text-size-aware classes. At 390px and 320px, the handwriting model scales to 54px / 60.48px / 66.96px and the reference to 52px / 58.24px / 64.48px at Standard / Large / Extra large. Lesson headings scale consistently; neither width has horizontal overflow.
- **Impact:** Resolved: handwriting and reference characters follow the learner’s text-size preference.
- **Resolution:** Replaced inline font sizes with reusable scaled classes and corrected the mobile important declaration.
- **Verification:** Mobile browser checks covered both phone widths and all three size settings. Full Academy tests pass.
- **Fix estimate:** Time not recorded.

### SA-026 — Mobile navigation labels are clipped at phone widths

- **Status:** Closed (100%)
- **Evidence:** The bottom bar now displays Home, N5, Learn, Kana, Write, Kanji, Cards, and Prefs; each button keeps its full accessible name. At 390px and 320px, labels fit and document width matches the viewport for all three text-size choices.
- **Impact:** Resolved: destinations remain identifiable in the mobile navigation.
- **Resolution:** Restored the zero-size original label rule and shortened visible aliases.
- **Verification:** Mobile browser checks covered all eight navigation buttons and all text settings without horizontal overflow.
- **Fix estimate:** Time not recorded.

### SA-027 — Resolved issues are mixed with active tracker items

- **Status:** Closed (100%)
- **Evidence:** The tracker defaults to Active issues and provides separate Archive and All views. All 27 issues remain searchable; closed items appear in Archive, and summary totals continue to include the full register.
- **Impact:** Resolved: open work is separated from completed history while past fixes remain available.
- **Resolution:** Added keyboard-accessible Active / Archive / All controls with live counts and view-specific headings.
- **Verification:** Regression tests exercise all three scopes and confirm summary values match the register. Mobile browser preview confirms the view controls fit the viewport.
- **Fix estimate:** Time not recorded.

### Mobile audit issue release · 2026-11-21 · v1.5.35

- **Issue recorded:** SA-025 — text size preference misses inline-styled character samples.
- **Status at release:** New.

### Mobile browser audit release · 2026-11-21 · v1.5.36

- **Issue recorded:** SA-026 — mobile navigation labels are clipped at phone widths.
- **SA-025 progress:** Work in progress while mobile text scaling is verified.

### Tracker archive request release · 2026-11-21 · v1.5.37

- **Issue recorded:** SA-027 — resolved issues are mixed with active tracker items.
- **Status at release:** New.

### Mobile readability and archive release · 2026-11-21 · SA-025–SA-027 closed

- **Checks passed:** 49 Academy tests pass. Mobile browser mode verified 390px and 320px at Standard, Large, and Extra large; handwriting samples, lesson text, bottom navigation, and issue archive remain usable without horizontal page overflow.
- **Issues covered:** SA-025, SA-026, SA-027.
- **Version:** v1.5.38.

### SA-028 — Assessment can test lesson vocabulary before it is studied

- **Status:** Closed (100%)
- **Evidence:** Assessment stays locked until at least two words in the current lesson are explicitly marked learned. It selects both target words from that studied set, and a stored run that includes an unlearned word is reset. Strict-mode completion and assessment tab status validate the same studied-word set.
- **Impact:** Resolved: assessment vocabulary questions follow the learner’s demonstrated lesson study.
- **Resolution:** Added a shared studied-word pool, a clear review-first state with a Vocabulary shortcut, safe run regeneration, and learned-word-aware progress checks.
- **Verification:** Regression tests cover filtering, insufficient-study gating, stale runs, strict completion, and tab progress. Full Academy suite: 54 tests passed.
- **Fix estimate:** Time not recorded.

### SA-029 — Lesson example sentences lack nearby audio controls

- **Status:** Closed (100%)
- **Evidence:** Vocabulary example sentences and Grammar Lab worked examples now have nearby Japanese playback. Sentence Builder has a model-sentence control, and the dialogue turns already provide individual playback. Mobile browser preview displayed sentence controls beside vocabulary examples.
- **Impact:** Resolved: learners can hear complete lesson sentences while reviewing their written meaning and usage.
- **Resolution:** Added complete-sentence audio controls to vocabulary examples, the Grammar Lab worked example, and Sentence Builder.
- **Verification:** Renderer regression checks cover vocabulary, grammar, dialogue, and builder sentence playback. Full Academy suite: 54 tests passed.
- **Fix estimate:** Time not recorded.

### SA-030 — Lesson activity tabs disappear while studying long vocabulary lists

- **Status:** Closed (100%)
- **Evidence:** At a 390 × 844 mobile viewport, the activity bar stays pinned at the top after 1,200 pixels of vertical scroll. Tabs use one horizontally scrollable row, the vocabulary examples remain visible beneath it, and the document has no horizontal overflow.
- **Impact:** Resolved: learners can switch lesson sections without returning to the top of long vocabulary lists.
- **Resolution:** Made lesson tabs sticky and compacted them into a one-row horizontal scroller on mobile.
- **Verification:** Mobile browser screenshot and geometry check confirmed pinned tabs at 390px width; responsive CSS regression test passes. Full Academy suite: 54 tests passed.
- **Fix estimate:** Time not recorded.


### Lesson assessment and mobile study flow · 2026-11-21 · v1.5.40

- **Tracker-first record:** SA-028, SA-029, and SA-030 were published as New in v1.5.39 before implementation; all three are now closed.
- **Changes:** Assessment targets are limited to lesson words marked learned; each lesson example has nearby Japanese sentence playback; activity tabs remain pinned and compact on mobile.
- **Verification:** 54 Academy tests pass. On a 390 × 844 viewport, assessment first displays a vocabulary-review gate, then uses only the two learned words; sticky tabs remain visible after scrolling with no page-width overflow.

### SA-031 — Lesson Play controls are silent when the browser has no speech engine

- **Status:** Closed (100%)
- **Evidence:** In the live in-app browser, `window.speechSynthesis` is unavailable. Existing Play controls rely on browser speech and therefore cannot produce Japanese audio in this environment.
- **Impact:** Learners hear nothing when they press Play for lesson vocabulary and sentences in browsers without built-in speech synthesis.
- **Resolution:** Added 211 bundled Japanese Kokoro clips and visible playback failure feedback.
- **Verification:** Offline manifest/content and static build regression checks pass.
- **Fix estimate:** Not recorded.

### SA-032 — Lesson sentences have no microphone pronunciation check

- **Status:** Closed (100%)
- **Evidence:** Lesson sentence cards lacked a mic control, transcript match, and pitch comparison against the bundled model audio.
- **Impact:** Resolved: learners receive a recognized-text match and an approximate pitch-pattern similarity against the lesson model.
- **Resolution:** Added sentence-level microphone controls, Japanese speech recognition, recognized-text similarity, and an approximate pitch-contour comparison against Kokoro references. This is a practice estimate rather than a clinical or authoritative accent grade; learners are asked to compare with the model audio.
- **Verification:** 57 tests pass. Mobile browser preview at 390 × 844 shows mic icons beside the main lesson sentence and vocabulary example; actual microphone capture remains browser permission/device dependent.
- **Fix estimate:** Not recorded.


### Sentence audio and microphone practice · 2026-11-21 · v1.5.43

- **Tracker:** SA-031 and SA-032 closed.
- **Changes:** Bundled 211 Kokoro Japanese clips and 32-point pitch references for offline lesson playback. Added 🎙 sentence practice controls throughout lesson sentences and examples; supported browsers give recognized-text similarity and approximate pitch-pattern similarity, with clear permission and unsupported-browser guidance.
- **Limitation:** Pitch similarity is an approximate practice cue derived from the recorded voice contour; it is not an authoritative Japanese pitch-accent grade. Learners are prompted to compare against the model audio.
- **Verification:** 57 tests pass. At 390 × 844, mobile preview confirms lesson and vocabulary mic controls fit within the viewport; native microphone capture requires supported browser APIs and user permission.


### SA-033 — Cached lesson script can hide the newly released microphone control

- **Status:** Closed (100%)
- **Evidence:** The hosted page showed the v1.5.43 footer but its mobile lesson omitted the Speak control, while a fresh local preview showed it. The unversioned script URL can be served from an older service-worker cache.
- **Impact:** Learners may see a current version label while missing newly released lesson features.
- **Resolution:** Added v1.5.45 query versions to the app and speech-manifest script URLs and precached the same URLs in the service worker.
- **Verification:** 57 automated tests pass; the deployed 390px lesson displays the microphone control after update.
- **Fix estimate:** Not recorded.


### Cache-safe lesson script release · 2026-11-21 · v1.5.45

- **Tracker:** SA-033 closed; counts reconciled at 33 total, 33 closed, 0 new.
- **Fix:** App and Japanese speech-manifest script URLs carry the visible release version, and the service worker precaches the exact versioned URLs.
- **Verification:** Pending final mobile browser check and release deployment.


### SA-034 — Microphone check discards the transcript from a low-confidence result

- **Status:** Closed (100%)
- **Evidence:** The app always shows “I could not match that sentence” from `onnomatch`, but the Web Speech API allows that event to contain a below-threshold transcript. The current handler ignores its event argument.
- **Impact:** Learners receive no useful feedback even when the browser produced a transcript of what they said.
- **Resolution:** The `nomatch` handler now uses its best transcript alternative, computes a similarity score, and shows the words heard. Matching normalizes kana script, spaces, and punctuation.
- **Verification:** 62 tests pass, including low-confidence event transcripts and Japanese text normalization.
- **Fix estimate:** Not recorded.

### Low-confidence speech feedback · 2026-11-21 · v1.5.47

- **Tracker:** SA-034 closed; 34 issues tracked, all 34 closed.
- **Fix:** Use low-confidence transcripts returned with `nomatch` events instead of discarding them. Show the words heard and a Japanese sentence similarity score; normalize kana script and punctuation.
- **Verification:** 62 tests pass. Device microphone recognition remains dependent on the phone browser's Japanese speech service.

### SA-035 — Mobile speech recognition captures audio but returns no Japanese transcript

- **Status:** Closed (100%)
- **Evidence:** Recognition now requests interim results, combines transcript chunks, and keeps the latest words until the browser session ends. When the device returns no Japanese text at all, the message clarifies that recognition failed to produce a transcript and offers relevant device checks.
- **Impact:** Resolved: mobile learners receive feedback from interim speech transcripts or an accurate explanation when the device speech service supplies no text.
- **Resolution:** Preserve interim Japanese transcripts and use them when final results are absent; report network and unsupported-language failures separately.
- **Verification:** 64 tests pass, including interim chunk collection and mobile fallback integration coverage.
- **Fix estimate:** Not recorded.

### Mobile speech recognition issue intake · 2026-11-21 · v1.5.48

- **Tracker:** SA-035 opened; 35 issues tracked, 34 closed, 1 new.
- **Evidence:** On mobile Edge and Chrome, audio capture succeeds but Japanese recognition returns no text.
- **Next:** Investigate interim transcripts and improve fallback guidance for device speech-service limitations.
- **Verification:** 62 tests pass; tracker archive and active counts match this register.

### Mobile Japanese transcript fallback · 2026-11-21 · v1.5.49

- **Tracker:** SA-035 closed; 35 issues tracked, all closed.
- **Fix:** Keep interim Japanese transcript chunks and use them if final recognition results are absent. If the phone returns no words, explain that the device speech service returned no transcript and give connectivity/language-setting guidance. Network and unsupported-language errors are reported separately.
- **Verification:** 64 tests pass, including interim chunk capture and mobile fallback coverage.

### SA-036 — Unreliable sentence microphone controls should be removed

- **Status:** Closed (100%)
- **Evidence:** All microphone buttons and browser speech-recognition code have been removed from lessons, including vocabulary, grammar, conversation, and sentence builder. Bundled Listen controls remain.
- **Impact:** Resolved: the unreliable mic option is no longer visible or active, while lesson listening remains available.
- **Resolution:** Removed microphone UI, speech recognition/pitch analysis logic, helper assets, offline precache entries, and standalone build embedding.
- **Verification:** Automated tests confirm the app, service worker, and generated standalone page omit microphone controls while retaining audio Listen controls.
- **Fix estimate:** Not recorded.

### Microphone removal issue intake · 2026-11-21 · v1.5.50

- **Tracker:** SA-036 opened; 36 issues tracked, 35 closed, 1 new.
- **Next:** Remove microphone controls and related recognition logic; retain sentence playback.

### Sentence microphone removal · 2026-11-21 · v1.5.51

- **Tracker:** SA-036 closed; 36 issues tracked, all closed.
- **Fix:** Removed every lesson mic control and all browser speech-recognition code. Kept bundled Japanese Listen audio. Removed the now-unused recognition helper from online/offline/standalone builds.
- **Verification:** Automated tests confirm the app and standalone build contain no mic controls, while sentence Listen controls and bundled audio remain.

### Audio-only lesson footer · 2026-11-21 · v1.5.52

- **Update:** Replaced the generic speech-features footer with a clear note that Japanese examples include bundled audio for offline listening.
- **Tracker:** SA-036 remains closed; all 36 tracked issues are closed.

### SA-037 — Strict lesson checklist items cannot open the next activity

- **Status:** Closed (100%)
- **Evidence:** Mobile verification exposed `ReferenceError: strictChecklistTab is not defined` because the app helper was cached at an unversioned URL. The page, offline cache, and build now use a versioned `lesson-progress.js` URL.
- **Impact:** Resolved: a stale helper script can no longer break strict-mode progress checks and checklist navigation after an update.
- **Resolution:** Added the app version to the lesson-progress script URL consistently in the page shell, service-worker precache, and standalone build.
- **Verification:** 61 Academy tests pass, including version synchronization, offline precache, checklist activity routing, and standalone build checks.
- **Fix estimate:** Not recorded.

### Strict checklist navigation issue intake · 2026-11-21 · v1.5.53

- **Tracker:** SA-037 opened; 37 issues tracked, 36 closed, 1 new.
- **Next:** Add touch-friendly links from checklist rows to their corresponding activity tabs.

### Strict checklist activity shortcuts · 2026-11-21 · v1.5.54

- **Tracker:** SA-037 closed; 37 issues tracked, all closed.
- **Update:** Checklist items open the corresponding lesson activity. The next incomplete step is enabled, completed items remain reviewable, and later incomplete activities unlock in sequence. Opening a step scrolls its tabs into view.
- **Verification:** All 60 Academy tests pass, including checklist sequencing, routes, accessible scrolling, and offline/standalone build checks.

### Cached checklist helper issue intake · 2026-11-21 · v1.5.55

- **Tracker:** SA-037 reopened for a cache-loading regression; 37 issues tracked, 36 closed, 1 in progress.
- **Evidence:** Live 390px mobile check reproduced an undefined helper because the service worker cached an unversioned lesson-progress script.
- **Next:** Version that script URL consistently in online/offline/standalone builds and verify strict mode.

### Checklist helper cache correction · 2026-11-21 · v1.5.56

- **Tracker:** SA-037 closed; 37 issues tracked, all closed.
- **Fix:** Versioned `lesson-progress.js` consistently in the online shell, service-worker precache, and standalone builder so the app and helper refresh together.
- **Verification:** All 61 Academy tests pass, including explicit online/offline helper URL synchronization and standalone build coverage. Mobile reload verification is next.

### SA-038 — Checklist shortcut leaves the lesson scrolled near the bottom

- **Status:** Closed (100%)
- **Evidence:** Reproduced the 1,415px scroll-position failure. After the fix, a 390 × 844 mobile run completed vocabulary to 8/8, tapped Grammar sentence built correctly, opened Sentence Builder, and measured `window.scrollY` at 0 with the lesson heading visible.
- **Impact:** Resolved: the checklist shortcut now opens the activity at the top of the lesson page.
- **Resolution:** Scroll the document to `top: 0` on the next animation frame after rendering the chosen activity. This handles the large layout-height change that made the sticky tab bar an unreliable anchor.
- **Verification:** Mobile browser screenshot confirms the lesson heading, sentence card, activity tabs, and Sentence Builder are visible in the expected order. The regression test asserts the page-top scroll is scheduled.
- **Fix estimate:** Time not recorded.

### Checklist shortcut scroll correction · 2026-11-21 · v1.5.58

- **Tracker:** SA-038 closed; 38 issues tracked, all closed.
- **Changes:** Checklist shortcuts now scroll the document to the lesson’s top after switching activities, avoiding a stale lower scroll position after short content rerenders.
- **Verification:** 61 Academy tests pass. In mobile browser mode at 390 × 844, Vocabulary marked learned (8/8) → Grammar sentence built correctly opens Sentence Builder with the lesson heading visible and `scrollY = 0`.

### SA-039 — Daily routine audio pronounces 7 o’clock as ななじ

- **Status:** Closed (100%)
- **Evidence:** Regenerated the Kokoro clip using explicit kana あさ しちじに おきます。 while keeping the displayed sentence unchanged. The original manifest key and offline asset path remain stable; the audio and reference pitch contour were refreshed. Regression coverage validates the override and generator behavior.
- **Impact:** Resolved: learners hear the standard beginner reading しちじ for 7 o’clock.
- **Resolution:** Added a pronunciation-override file consumed by the audio generator; overridden phrases are regenerated even when their hash-named file already exists.
- **Verification:** All Academy tests pass, including the new pronunciation-override regression and the bundled-audio/pitch checks.
- **Fix estimate:** Time not recorded.

### Seven o’clock audio pronunciation · 2026-11-21 · v1.5.60

- **Tracker:** SA-039 closed; 39 issues tracked, all closed.
- **Changes:** The sentence still displays あさ 7じに おきます。; its offline Kokoro model speech explicitly uses しちじ.
- **Verification:** All 62 Academy tests pass; the audio manifest and pitch contour rebuild successfully.

### Strict mode default and footer contact · 2026-11-21 · v1.5.61

- **Tracker:** SA-040 closed; 40 issues tracked, all closed.
- **Changes:** Strict mode starts enabled for fresh progress; a saved explicit opt-out remains respected. Added densanchez@gmail.com as a footer mail link and removed the irrelevant GENKI affiliation disclaimer.
- **Verification:** 63 Academy tests pass. Standalone build and `git diff --check` pass. A fresh mobile view at 390 × 844 shows Strict mode checked, the contact link present, and the disclaimer absent.
