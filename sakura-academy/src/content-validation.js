(function exposeCourseContentValidator(root) {
  function validateCourseContent(lessons, wordGuidance = {}) {
    const errors = [];
    if (!Array.isArray(lessons)) return ['Lessons must be an array'];
    const lessonIds = new Set();
    const wordIds = new Set();

    for (const lesson of lessons) {
      const id = lesson?.id;
      if (!Number.isInteger(id) || id < 1) errors.push(`Invalid lesson id ${String(id)}`);
      else if (lessonIds.has(id)) errors.push(`Duplicate lesson id ${id}`);
      else lessonIds.add(id);

      for (const field of ['title', 'description', 'jp', 'en', 'rule', 'explain', 'builderEn', 'mistake']) {
        if (typeof lesson?.[field] !== 'string' || !lesson[field].trim()) errors.push(`Missing ${field} lesson ${String(id)}`);
      }
      if (!Array.isArray(lesson?.builder) || !lesson.builder.length || lesson.builder.some(part => typeof part !== 'string' || !part.trim())) errors.push(`Invalid builder lesson ${String(id)}`);
      if (!Array.isArray(lesson?.vocab) || !lesson.vocab.length) errors.push(`Invalid vocab lesson ${String(id)}`);
      if (!Array.isArray(lesson?.dialogue) || !lesson.dialogue.some(line => line?.who === 'A') || !lesson.dialogue.some(line => line?.who === 'B')) errors.push(`Invalid dialogue lesson ${String(id)}`);
      if (!Array.isArray(lesson?.responseOptions) || lesson.responseOptions.length !== 3 || new Set(lesson.responseOptions).size !== 3) errors.push(`Invalid response options lesson ${String(id)}`);
      if (!Number.isInteger(lesson?.responseAnswer) || lesson.responseAnswer < 0 || lesson.responseAnswer >= (lesson.responseOptions?.length || 0)) errors.push(`Invalid response answer lesson ${String(id)}`);
      else if (lesson.responseOptions?.[lesson.responseAnswer] !== lesson.dialogue?.find(line => line.who === 'B')?.jp) errors.push(`Response answer does not match Speaker B lesson ${String(id)}`);

      for (const word of Array.isArray(lesson?.vocab) ? lesson.vocab : []) {
        if (typeof word?.id !== 'string' || !word.id.trim()) errors.push(`Missing word id lesson ${String(id)}`);
        else if (wordIds.has(word.id)) errors.push(`Duplicate word id ${word.id}`);
        else wordIds.add(word.id);
        for (const field of ['jp', 'en', 'romaji', 'example', 'exampleEn']) {
          if (typeof word?.[field] !== 'string' || !word[field].trim()) errors.push(`Missing ${field} ${word?.id || String(id)}`);
        }
        const headword = typeof word?.jp === 'string' ? word.jp.replace(/\s/g, '') : '';
        const example = typeof word?.example === 'string' ? word.example.replace(/\s/g, '') : '';
        if (headword && !example.includes(headword)) errors.push(`Example does not include ${word.id || word.jp}`);
        if (typeof word?.jp === 'string' && (typeof wordGuidance[word.jp] !== 'string' || !wordGuidance[word.jp].trim())) errors.push(`Missing usage guidance ${word.jp}`);
      }
    }
    return errors;
  }

  function validateProgressBackupSettings(state) {
    const errors = [];
    if (!state || typeof state !== 'object' || Array.isArray(state)) return ['Invalid state'];
    if (!Number.isSafeInteger(state.xp) || state.xp < 0) errors.push('Invalid XP value');
    if (state.goal !== undefined && (!Number.isSafeInteger(state.goal) || state.goal < 1 || state.goal > 200)) {
      errors.push('Invalid daily goal');
    }
    return errors;
  }

  function sanitizeStoredProgressSettings(state, defaults = { goal: 15, xp: 0 }) {
    const errors = validateProgressBackupSettings(state);
    if (errors.includes('Invalid XP value')) state.xp = defaults.xp;
    if (errors.includes('Invalid daily goal')) state.goal = defaults.goal;
    return state;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { validateCourseContent, validateProgressBackupSettings, sanitizeStoredProgressSettings };
  else Object.assign(root, { validateCourseContent, validateProgressBackupSettings, sanitizeStoredProgressSettings });
})(typeof globalThis === 'undefined' ? this : globalThis);
