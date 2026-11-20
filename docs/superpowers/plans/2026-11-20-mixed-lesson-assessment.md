# Mixed Lesson Assessment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the vocabulary-only lesson quiz with a five-skill assessment that accurately tests the current lesson.

**Architecture:** Keep the static app and localStorage progress model. Store assessment attempt order and answers in the existing assessment state; generate every question from the current lesson or existing course data. The same assessment runs in either mode, while only Strict mode gates lesson progression on a 4/5 pass.

**Tech Stack:** Vanilla JavaScript, HTML/CSS, Node build script, browser smoke check.

**Spec:** `docs/superpowers/specs/2026-11-20-mixed-lesson-assessment-design.md`

## Global Constraints

- Keep the app offline-capable and dependency-free.
- Keep the single-file standalone build working.
- Keep existing local progress and older backup files compatible.
- Use five distinct skills once each: vocabulary, grammar, dialogue, listening, and typed Japanese.
- Pass at 4 correct answers out of 5; allow retry after a failed attempt.

## Review Focus

- Reload during an incomplete assessment: resume at the next unanswered skill without reusing an item.
- Retry after a failed attempt: start a new shuffled set and reset the score.
- Distractor data: no question marks the current lesson's correct answer as wrong.
- Older backups without assessment fields: import successfully with default empty assessment state.
- Strict mode off: show results without gating Next; Strict mode on: only unlock after a pass.

---

### Task 1: Mixed assessment flow

**Files:**
- Modify: `sakura-academy/src/app.js`
- Modify: `sakura-academy/index.html` for the small version/date footer stamp
- Modify: `sakura-academy/styles.css` only if the revised question controls need a small style adjustment
- Regenerate: `genki-interactive-academy.html`
- Test: local browser through the app’s existing UI and `node --check`

**Interfaces:**
- Assessment state remains `state.assessments[lessonId]`, extended with a shuffled `questionTypes` list and the selected vocabulary IDs needed to resume an attempt.
- Question types: `vocabulary`, `grammar`, `dialogue`, `listening`, `writing`.
- `makeQuiz(l)` selects or resumes the current attempt question; `checkQuiz(answer, typed)` records one result; `retryAssessment(id)` clears the failed attempt and starts a new one.

- [x] **Step 1: Add a failing focused check** that asserts five distinct question types are used once per attempt, typed writing checks Japanese, and typed meaning checks English.
- [x] **Step 2: Run the check and verify it fails** against the current vocabulary-only question generator.
- [x] **Step 3: Implement the five lesson-specific question types** using lesson vocabulary, builder sentences, dialogue A lines, lesson listening sentence, and a typed vocabulary target. Use distractors whose correct labels match their answer values.
- [x] **Step 4: Persist attempt order and selected word IDs** so reload resumes at the next unanswered question; reset both on retry.
- [x] **Step 5: Render accurate question labels and feedback**, preserve the 4/5 threshold, and keep Next progression dependent on pass only in Strict mode.
- [x] **Step 6: Run the focused check, `node --check sakura-academy/src/app.js`, build to a temporary output directory, verify the generated footer version stamp, and run `git diff --check`.**
- [x] **Step 7: Smoke-check both modes in a browser:** answer five distinct skills, verify 4/5 pass, verify retry resets, and verify Next is only gated in Strict mode.
- [x] **Step 8: Regenerate the standalone HTML and commit the source and generated app.**
