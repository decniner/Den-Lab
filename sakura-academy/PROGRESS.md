# Sakura Academy issue tracker

Every published app change must bump the small footer version and its update date, and keep the service-worker cache version in sync. This page is the source of truth for the Sakura Academy reliability audit. Counts and statuses on `issue-tracker.html` mirror this register. Progress is updated in 10% steps; New is 0%, Closed is 100%. Discovery times are marked `Not recorded` when they were not captured at discovery. Fix duration is recorded only after resolution.

## Summary

- Total tracked: 9
- Work in progress: 1
- New: 0
- Closed: 8
- Timeline gaps: 8

## Issue register

| Issue | Owner | Status | Progress | Discovered | Time to fix |
|---|---|---|---:|---|---|
| SA-001 — Speaker B replies were identical across lessons | Codex | Closed | 100% | Not recorded | Not recorded |
| SA-002 — Vocabulary examples often did not demonstrate the target word | Codex | Closed | 100% | Not recorded | Not recorded |
| SA-003 — Content validator falsely reported numeric lesson IDs missing | Codex | Closed | 100% | Not recorded | Not recorded |
| SA-004 — Vocabulary cards lack practical usage and context guidance | Codex | Closed | 100% | 2026-11-20 | Not recorded |
| SA-005 — Repeatable study actions could award XP repeatedly | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-006 — Repeated answer clicks could distort lesson accuracy | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-007 — Hosted app shell is not cached for offline use | Codex | Work in progress | 90% | 2026-11-21 | Not recorded |
| SA-008 — Lesson grammar explanations are too brief and generic | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-009 — Imported progress can inject unsafe settings markup | Codex | Closed | 100% | 2026-11-21 | Not recorded |

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

### SA-007 — Hosted app shell is not cached for offline use

- **Status:** Work in progress (90%)
- **Evidence:** The Academy service worker precaches the app/tracker, uses network-first navigation with an offline app fallback, and versions its cache with the footer. The hosted app loads in the browser; GitHub Pages serves the worker with JavaScript content type and all 13 precached URLs return HTTP 200. Automated tests cover precaching, offline navigation fallback, route registration, and cache version alignment.
- **Impact:** Without a proven offline refresh cycle, learners could still lose access to lessons when disconnected.
- **Implementation:** Added an Academy-route service worker, precached the app and tracker shell, provided network-first navigation with offline app fallback, and tied cache version to the visible app version.
- **Verification:** 16 content/offline-shell tests pass; service-worker syntax and hosted asset checks pass. Browser controls available in this session block access to internal offline/network controls, so an actual offline refresh/update cycle has not been observed.
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
