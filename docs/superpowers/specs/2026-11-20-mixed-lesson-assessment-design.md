# Mixed lesson assessment

## Intent

Make each lesson assessment test a small, representative range of the lesson rather than repeatedly sampling vocabulary. The strict-mode pass rule remains four correct answers out of five.

## Approaches

- Keep a vocabulary-only quiz, correct its labels, and prevent repeated words. This is the smallest change but does not test the lesson's grammar or comprehension.
- Use five lesson-specific question types: vocabulary, grammar sentence meaning, dialogue comprehension, listening comprehension, and typed Japanese. This matches the course activities and was selected because the user asked for mixed lesson skills.

## Design

- Use each of the five skill types once per assessment attempt, in shuffled order.
- Draw answer keys and distractors from the current lesson and existing lesson data; never reuse another lesson's correct answer as the current lesson's answer.
- Require at least four correct answers to pass. A failed attempt can be retried with a fresh vocabulary and writing target.
- Use the same five-question assessment when strict mode is off; only strict mode uses the pass result to gate progression.
- Keep the single-file build and offline behavior. Keep existing local progress and older backups compatible.
- Display a small release version and update date in the app footer so the live page is identifiable.

## Not in scope

Rewriting lesson dialogues, adding new curriculum content, or changing strict-mode checklist requirements.
