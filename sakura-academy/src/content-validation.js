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
    if (state.fontSize !== undefined && !['standard', 'large', 'extra-large'].includes(state.fontSize)) errors.push('Invalid text size');
    if (state.japaneseVoice !== undefined && !['jf_alpha', 'jf_gongitsune', 'jf_tebukuro'].includes(state.japaneseVoice)) errors.push('Invalid Japanese voice');
    if (state.showGuides !== undefined && typeof state.showGuides !== 'boolean') errors.push('Invalid guide visibility');
    if (state.showDescriptions !== undefined && typeof state.showDescriptions !== 'boolean') errors.push('Invalid description visibility');
    if (state.guideChoiceMade !== undefined && typeof state.guideChoiceMade !== 'boolean') errors.push('Invalid guide choice state');
    return errors;
  }

  function sanitizeStoredProgressSettings(state, defaults = { goal: 15, xp: 0, fontSize: 'standard', japaneseVoice: 'jf_alpha', showGuides: true, showDescriptions: true, guideChoiceMade: false }) {
    const errors = validateProgressBackupSettings(state);
    if (errors.includes('Invalid XP value')) state.xp = defaults.xp;
    if (errors.includes('Invalid daily goal')) state.goal = defaults.goal;
    if (errors.includes('Invalid text size') || state.fontSize === undefined) state.fontSize = defaults.fontSize;
    if (errors.includes('Invalid Japanese voice') || state.japaneseVoice === undefined) state.japaneseVoice = defaults.japaneseVoice;
    if (errors.includes('Invalid guide visibility') || state.showGuides === undefined) state.showGuides = defaults.showGuides;
    if (errors.includes('Invalid description visibility') || state.showDescriptions === undefined) state.showDescriptions = defaults.showDescriptions;
    if (errors.includes('Invalid guide choice state') || state.guideChoiceMade === undefined) state.guideChoiceMade = defaults.guideChoiceMade;
    return state;
  }

  const practiceFlagMaps = ['kana', 'kanji', 'kanjiStudy', 'handwriting', 'rewarded', 'n5Study'];

  function validatePracticeProgressData(state) {
    const errors = [];
    if (!state || typeof state !== 'object' || Array.isArray(state)) return ['Invalid state'];
    for (const key of practiceFlagMaps) {
      const flags = state[key];
      if (flags === undefined && (key === 'rewarded' || key === 'kanjiStudy' || key === 'n5Study')) continue;
      if (!flags || typeof flags !== 'object' || Array.isArray(flags)) {
        errors.push(`Invalid ${key} progress`);
        continue;
      }
      if (Object.values(flags).some(value => typeof value !== 'boolean')) errors.push(`Invalid ${key} flag`);
    }
    return errors;
  }

  function sanitizePracticeProgressData(state) {
    for (const key of practiceFlagMaps) {
      if (!state[key] || typeof state[key] !== 'object' || Array.isArray(state[key])) state[key] = {};
      else for (const [id, value] of Object.entries(state[key])) if (typeof value !== 'boolean') delete state[key][id];
    }
    return state;
  }

  function countKnownFlags(flags, knownKeys) {
    return knownKeys.filter(key => flags?.[key] === true).length;
  }

  const strictAnswerFormats = new Set(['ordering', 'dialogue', 'listening', 'typing', 'assessment-vocabulary', 'assessment-grammar', 'assessment-dialogue', 'assessment-listening', 'assessment-writing']);

  function isValidStrictAnswer(answer) {
    return !!answer && typeof answer === 'object' && !Array.isArray(answer) &&
      Number.isInteger(answer.lesson) && answer.lesson >= 1 && answer.lesson <= 12 &&
      strictAnswerFormats.has(answer.format) && typeof answer.correct === 'boolean';
  }

  function validateStrictProgressData(state) {
    const errors = [];
    if (!state || typeof state !== 'object' || Array.isArray(state)) return ['Invalid state'];
    for (const key of ['learned', 'completed']) {
      const flags = state[key];
      if (!flags || typeof flags !== 'object' || Array.isArray(flags)) {
        errors.push(`Invalid ${key} progress`);
        continue;
      }
      if (Object.values(flags).some(value => typeof value !== 'boolean')) errors.push(`Invalid ${key} flag`);
    }
    if (!Array.isArray(state.answers) || state.answers.some(answer => !isValidStrictAnswer(answer))) errors.push('Invalid answer record');
    return errors;
  }

  function sanitizeStrictProgressData(state) {
    for (const key of ['learned', 'completed']) {
      if (!state[key] || typeof state[key] !== 'object' || Array.isArray(state[key])) state[key] = {};
      else for (const [id, value] of Object.entries(state[key])) if (typeof value !== 'boolean') delete state[key][id];
    }
    state.answers = Array.isArray(state.answers) ? state.answers.filter(isValidStrictAnswer) : [];
    return state;
  }

  function isValidAssessmentRun(run, requiredTypes, allowedWordIds) {
    if (!run || typeof run !== 'object' || Array.isArray(run)) return false;
    const types = run.questionTypes;
    const words = run.wordIds;
    const results = run.results;
    const validTypes = Array.isArray(types) && types.length === requiredTypes.length &&
      new Set(types).size === requiredTypes.length && types.every(type => requiredTypes.includes(type));
    const validWords = Array.isArray(words) && words.length === 2 && new Set(words).size === 2 &&
      words.every(id => allowedWordIds.includes(id));
    const validResults = Array.isArray(results) && results.length <= 5 && results.every(result => typeof result === 'boolean');
    const shouldPass = validResults && results.length === 5 && results.filter(Boolean).length >= 4;
    return validTypes && validWords && validResults && typeof run.passed === 'boolean' && run.passed === shouldPass;
  }

  function assessmentWordPool(lesson, learned = {}) {
    return Array.isArray(lesson?.vocab) ? lesson.vocab.filter(word => learned?.[word.id] === true) : [];
  }

  function assessmentOptionCandidates(lesson, type, learned = {}) {
    if (!lesson) return [];
    if (type === 'vocabulary') return assessmentWordPool(lesson, learned).map(word => word.en).filter(Boolean);
    if (type === 'dialogue') return (lesson.dialogue || []).map(line => line?.en).filter(Boolean);
    if (type === 'listening') return [lesson.en, ...(lesson.dialogue || []).map(line => line?.en)].filter(Boolean);
    if (type === 'grammar') {
      const parts = lesson.builder || [], candidates = [];
      for (let i = 1; i < parts.length; i++) candidates.push([...parts.slice(i), ...parts.slice(0, i)].join(' '));
      candidates.push([...parts].reverse().join(' '));
      return [...new Set(candidates)].filter(Boolean);
    }
    if (type === 'writing') return assessmentWordPool(lesson, learned).map(word => word.jp).filter(Boolean);
    return [];
  }

  function ensureAssessmentRun(run, lesson, requiredTypes, createAssessment, learned = {}) {
    const allowedWordIds = assessmentWordPool(lesson, learned).map(word => word.id);
    if (allowedWordIds.length >= 2 && isValidAssessmentRun(run, requiredTypes, allowedWordIds)) return run;
    return createAssessment(lesson);
  }

  function isValidPassingAssessment(run, requiredTypes, allowedWordIds) {
    return isValidAssessmentRun(run, requiredTypes, allowedWordIds) && run.passed === true &&
      run.results.filter(Boolean).length >= 4;
  }

  function strictMilestoneDone(state, lesson, milestone, assessmentTypes = []) {
    if (!state || !lesson) return false;
    if (milestone === 'vocabulary') {
      return lesson.vocab.length > 0 && lesson.vocab.every(word => state.learned?.[word.id] === true);
    }
    if (milestone === 'assessment') {
      const studiedIds = assessmentWordPool(lesson, state.learned).map(word => word.id);
      return studiedIds.length >= 2 && isValidPassingAssessment(state.assessments?.[lesson.id], assessmentTypes, studiedIds);
    }
    const format = { grammar: 'ordering', conversation: 'dialogue', listening: 'listening', writing: 'typing' }[milestone];
    return !!format && Array.isArray(state.answers) && state.answers.some(answer =>
      answer?.lesson === lesson.id && answer.format === format && answer.correct === true);
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { validateCourseContent, validateProgressBackupSettings, sanitizeStoredProgressSettings, validateStrictProgressData, sanitizeStrictProgressData, validatePracticeProgressData, sanitizePracticeProgressData, countKnownFlags, assessmentWordPool, assessmentOptionCandidates, isValidAssessmentRun, ensureAssessmentRun, isValidPassingAssessment, strictMilestoneDone };
  else Object.assign(root, { validateCourseContent, validateProgressBackupSettings, sanitizeStoredProgressSettings, validateStrictProgressData, sanitizeStrictProgressData, validatePracticeProgressData, sanitizePracticeProgressData, countKnownFlags, assessmentWordPool, assessmentOptionCandidates, isValidAssessmentRun, ensureAssessmentRun, isValidPassingAssessment, strictMilestoneDone });
})(typeof globalThis === 'undefined' ? this : globalThis);
