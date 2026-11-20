# Sakura Academy issue tracker

This page is the source of truth for the Sakura Academy reliability audit. Counts and statuses on `issue-tracker.html` mirror this register. Progress is updated in 10% steps; New is 0%, Closed is 100%. Discovery times are marked `Not recorded` when they were not captured at discovery. Fix duration is recorded only after resolution.

## Summary

- Total tracked: 3
- Work in progress: 0
- New: 3
- Closed: 0
- Timeline gaps: 3

## Issue register

| Issue | Owner | Status | Progress | Discovered | Time to fix |
|---|---|---|---:|---|---|
| SA-001 — Speaker B repeats the same reply in every lesson | Codex | New | 0% | Not recorded | Not recorded |
| SA-002 — Vocabulary examples often do not demonstrate the target word | Codex | New | 0% | Not recorded | Not recorded |
| SA-003 — Content validator falsely reports numeric lesson IDs missing | Codex | New | 0% | Not recorded | Not recorded |

### SA-001 — Speaker B repeats the same reply in every lesson

- **Status:** New (0%)
- **Evidence:** `src/content.js` gives Speaker B the identical Japanese and English response in all 12 lesson dialogue arrays, regardless of context.
- **Impact:** Dialogue practice teaches unnatural and contextually incorrect responses and makes the comprehension assessment reuse misleading content.
- **Why open:** Needs lesson-specific natural replies with accurate translations, followed by dialogue and assessment verification.
- **Fix estimate:** Not recorded.

### SA-002 — Vocabulary examples often do not demonstrate the target word

- **Status:** New (0%)
- **Evidence:** Lesson 1 uses `わたしは りなです。` (“I am Rina.”) as the example for all eight vocabulary items, including `がくせい` (student), `せんせい` (teacher), and `にほん` (Japan). Initial scan shows the same pattern throughout lessons.
- **Impact:** Learners can memorize an unrelated sentence as an example of a word; the bilingual example may not validate meaning or usage.
- **Why open:** Audit the full vocabulary set, then write and cross-check target-specific Japanese and English example pairs.
- **Fix estimate:** Not recorded.

### SA-003 — Content validator falsely reports numeric lesson IDs missing

- **Status:** New (0%)
- **Evidence:** `validate()` checks every field with `!l[f].length`; numeric `id` values have no `length`, so all 12 valid lessons are flagged as missing an ID.
- **Impact:** Console diagnostics are misleading and can hide real content defects in the validation output.
- **Why open:** Correct field-specific validation and verify it against lesson and vocabulary data.
- **Fix estimate:** Not recorded.

## Evidence reports

No closures yet. Add a concise report after every five issues are closed: checks passed, regressions found, changes reverted, and remaining risks.
