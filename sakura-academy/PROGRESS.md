# Sakura Academy issue tracker

Every published app change must bump the small footer version and its update date, and keep the service-worker cache version in sync. This page is the source of truth for the Sakura Academy reliability audit. Counts and statuses on `issue-tracker.html` mirror this register. Progress is updated in 10% steps; New is 0%, Closed is 100%. Discovery times are marked `Not recorded` when they were not captured at discovery. Fix duration is recorded only after resolution.

## Summary

- Total tracked: 8
- Work in progress: 3
- New: 0
- Closed: 5
- Timeline gaps: 8

## Issue register

| Issue | Owner | Status | Progress | Discovered | Time to fix |
|---|---|---|---:|---|---|
| SA-001 — Speaker B replies were identical across lessons | Codex | Closed | 100% | Not recorded | Not recorded |
| SA-002 — Vocabulary examples often did not demonstrate the target word | Codex | Closed | 100% | Not recorded | Not recorded |
| SA-003 — Content validator falsely reported numeric lesson IDs missing | Codex | Closed | 100% | Not recorded | Not recorded |
| SA-004 — Vocabulary cards lack practical usage and context guidance | Codex | Work in progress | 80% | 2026-11-20 | Not recorded |
| SA-005 — Repeatable study actions could award XP repeatedly | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-006 — Repeated answer clicks could distort lesson accuracy | Codex | Closed | 100% | 2026-11-21 | Not recorded |
| SA-007 — Hosted app shell is not cached for offline use | Codex | Work in progress | 80% | 2026-11-21 | Not recorded |
| SA-008 — Lesson grammar explanations are too brief and generic | Codex | Work in progress | 90% | 2026-11-21 | Not recorded |

### SA-001 — Speaker B replies were identical across lessons

- **Status:** Closed (100%)
- **Evidence:** All 12 lessons now have different context-specific Speaker B replies, with matching answer choices and translations.
- **Impact:** Resolved: dialogue practice now models varied, relevant responses.
- **Resolution:** The learner sees Speaker A, chooses a fitting response, then sees and can hear Speaker B’s reply.
- **Verification:** Automated test confirms all replies differ and each correct choice matches Speaker B; browser flow confirmed the reply and disabled choices after answering.
- **Fix estimate:** Time not recorded.

### SA-004 — Vocabulary cards lack practical usage and context guidance

- **Status:** Work in progress (80%)
- **Evidence:** All 95 unique vocabulary items now include expandable guidance on when and how to use the word, with particles, common pairings, register, or meaning distinctions where relevant.
- **Impact:** The core gap is addressed; inaccurate or overly broad notes could still mislead learners until an editorial review is complete.
- **Why open:** Coverage, rendering, and a phone-width layout are verified. Review the usage wording for accuracy and learner-level fit before closure.
- **Fix estimate:** Not recorded.

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

### SA-008 — Lesson grammar explanations are too brief and generic

- **Status:** Work in progress (90%)
- **Evidence:** All 12 lesson explanations are one sentence. All 12 lessons repeat the same generic common-mistake warning about particles, verb endings, and polite/plain speech, regardless of the lesson topic. In 8 lessons, the grammar panel shows an example sentence that differs from the sentence represented by its interactive word tiles and English translation. Learners do not consistently get a worked example, when-to-use guidance, or a topic-specific pitfall.
- **Impact:** Beginners can memorize a translation or pattern without understanding how to form it, when it sounds natural, or which common error to avoid.
- **Why open:** Review the 12 N5 lesson targets, then write and verify learner-level explanations with a worked example, usage conditions, and a relevant pitfall for each topic.
- **Fix estimate:** Not recorded.

### SA-007 — Hosted app shell is not cached for offline use

- **Status:** Work in progress (80%)
- **Evidence:** The Sakura Academy route advertised “OFFLINE FIRST,” but had no service-worker registration or cache; only browser storage was local. Opening or refreshing the hosted app with no network was not guaranteed to load its HTML, styles, or scripts.
- **Impact:** Learners may lose access to lessons when offline even though their saved progress remains on the device.
- **Implementation:** Added an Academy-route service worker, precached the app and tracker shell, provided network-first navigation with offline app fallback, and tied cache version to the visible app version.
- **Verification:** All 10 content/offline-shell tests pass; service-worker syntax checks; generated project contains every precached runtime asset. A local CUA browser check was unavailable because its browser could not reach the local preview, so hosted registration and offline refresh still need confirmation.
- **Why open:** Confirm the published service worker installs at the GitHub Pages route and test a real offline refresh/update cycle.
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
