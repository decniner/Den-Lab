# Sakura Academy issue tracker

Every published app change must bump the small footer version and its update date, and keep the service-worker cache version in sync. This page is the source of truth for the Sakura Academy reliability audit. Counts and statuses on `issue-tracker.html` mirror this register. Progress is updated in 10% steps; New is 0%, Closed is 100%. Discovery times are marked `Not recorded` when they were not captured at discovery. Fix duration is recorded only after resolution.

## Summary

- Total tracked: 20
- Work in progress: 1
- New: 2
- Closed: 17
- Timeline gaps: 20

## Issue register

| Issue | Owner | Status | Progress | Discovered | Time to fix |
|---|---|---|---:|---|---|
| SA-001 — Speaker B replies were identical across lessons | Codex | Closed | 100% | Not recorded | Not recorded |
| SA-002 — Vocabulary examples often did not demonstrate the target word | Codex | Closed | 100% | Not recorded | Not recorded |
| SA-003 — Content validator falsely reported numeric lesson IDs missing | Codex | Closed | 100% | Not recorded | Not recorded |
| SA-004 — Vocabulary cards lack practical usage and context guidance | Codex | Closed | 100% | 2026-11-20 | Not recorded |
| SA-005 — Repeatable study actions could award XP repeatedly | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-006 — Repeated answer clicks could distort lesson accuracy | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-007 — Hosted offline refresh/update cycle not fully verified | Codex | Work in progress | 90% | 2026-11-21 | Not recorded |
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
| SA-019 — Lesson writing canvas has no target character or stroke guide | Codex | New | 0% | 2026-11-21 | Not recorded |
| SA-020 — Stroke-order step can carry over to the next character | Codex | New | 0% | 2026-11-21 | Not recorded |

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

- **Status:** Work in progress (90%)
- **Evidence:** The Academy service worker precaches the app/tracker, uses network-first navigation with an offline app fallback, and versions its cache with the footer. GitHub Pages serves the worker with JavaScript content type and all 13 precached URLs return HTTP 200. In the live browser, a previously open v1.5.9 tab loaded v1.5.17 after refresh. Local lifecycle tests cover online navigation being cached and then served after network loss, offline fallback, and failed shell installation not activating.
- **Impact:** Without a proven offline refresh cycle, learners could still lose access to lessons when disconnected.
- **Implementation:** Added an Academy-route service worker, precached the app and tracker shell, provided network-first navigation with offline app fallback, and tied cache version to the visible app version.
- **Verification:** Focused content, offline-shell, progress-validation, and lesson-progress tests pass; service-worker syntax and hosted asset checks pass. The live refresh confirms an old open tab obtains the current online version. Browser controls available in this session do not expose offline/network emulation, so an actual offline refresh/update cycle has not been observed.
- **Why open:** Run the remaining real offline refresh/update cycle in a browser with network controls.
- **Fix estimate:** Not recorded.

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

- **Checks passed:** An existing hosted tab showing v1.5.9 was refreshed and rendered v1.5.17. The live online update path works for a previously open tab.
- **Still unverified:** Refreshing the hosted app while offline and confirming the cached shell renders.
- **Status:** SA-007 remains Work in progress at 90%.


### SA-019 — Lesson writing canvas has no target character or stroke guide

- **Status:** New (0%)
- **Evidence:** The lesson Writing tab provides an unlabelled freehand canvas and says verified stroke-order diagrams are not included; it does not show a character to copy. The separate Write characters page has reference glyphs and stroke-order steps.
- **Impact:** Learners can draw without a clear target or the correct stroke order, weakening the lesson's writing practice.
- **Why open:** Connect lesson writing practice to the guided character workflow and retain the typing assessment.
- **Fix estimate:** Not recorded.


### SA-020 — Stroke-order step can carry over to the next character

- **Status:** New (0%)
- **Evidence:** The handwriting screen re-renders the next character at step 0, but `stepPractice` and `finishPractice` do not reset the shared `strokeStep`. Pressing Step afterward can jump into a later stroke instead of starting at stroke 1.
- **Impact:** Learners can miss the beginning of a character's stroke order after moving between characters.
- **Why open:** Reset and stop the guide animation whenever the learner changes characters or scripts.
- **Fix estimate:** Not recorded.
