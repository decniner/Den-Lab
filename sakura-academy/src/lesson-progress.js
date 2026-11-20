(function exposeLessonTabProgress(root) {
  const isValidPassingAssessment = root.isValidPassingAssessment ||
    (typeof require === 'function' ? require('./content-validation.js').isValidPassingAssessment : () => false);
  const isValidAssessmentRun = root.isValidAssessmentRun ||
    (typeof require === 'function' ? require('./content-validation.js').isValidAssessmentRun : () => false);

  function lessonTabStatus(tab, lesson, state, assessmentTypes) {
    if (!lesson || !state) return 'not-started';

    const answers = Array.isArray(state.answers) ? state.answers.filter(answer => answer?.lesson === lesson.id) : [];
    const visited = Array.isArray(state.tabVisits?.[lesson.id]) && state.tabVisits[lesson.id].includes(tab);
    const hasAnswer = format => answers.some(answer => answer.format === format);
    const hasCorrect = format => answers.some(answer => answer.format === format && answer.correct === true);

    if (tab === 'vocab') {
      const total = lesson.vocab.length;
      const learned = lesson.vocab.filter(word => state.learned?.[word.id] === true).length;
      if (total > 0 && learned === total) return 'complete';
      if (learned > 0) return 'in-progress';
    } else if (tab === 'grammar') {
      const rawReviewed = state.grammarParts?.[lesson.id];
      const reviewed = Array.isArray(rawReviewed)
        ? new Set(rawReviewed.filter(index => Number.isInteger(index) && index >= 0 && index < lesson.builder.length))
        : new Set();
      if (lesson.builder.length > 0 && reviewed.size === lesson.builder.length) return 'complete';
      if (reviewed.size > 0) return 'in-progress';
    } else if (tab === 'builder') {
      if (hasCorrect('ordering')) return 'complete';
      if (hasAnswer('ordering')) return 'in-progress';
    } else if (tab === 'dialogue' || tab === 'listening' || tab === 'writing') {
      const format = { dialogue: 'dialogue', listening: 'listening', writing: 'typing' }[tab];
      if (hasCorrect(format)) return 'complete';
      if (hasAnswer(format)) return 'in-progress';
    } else if (tab === 'quiz') {
      const run = state.assessments?.[lesson.id];
      const studiedIds = lesson.vocab.filter(word => state.learned?.[word.id] === true).map(word => word.id);
      const validRun = studiedIds.length >= 2 && isValidAssessmentRun(run, assessmentTypes, studiedIds);
      if (validRun && isValidPassingAssessment(run, assessmentTypes, studiedIds)) return 'complete';
      const results = validRun ? run.results : null;
      if (Array.isArray(results) && results.length === 5 && results.every(result => typeof result === 'boolean') && results.filter(Boolean).length < 4) return 'needs-review';
      if (Array.isArray(results) && results.length > 0) return 'in-progress';
    }

    return visited ? 'in-progress' : 'not-started';
  }

  function sanitizeGrammarParts(progress, lessons) {
    const sanitized = {};
    if (!progress || typeof progress !== 'object' || Array.isArray(progress)) return sanitized;
    for (const [id, indexes] of Object.entries(progress)) {
      const lesson = lessons.find(item => String(item.id) === id);
      if (!lesson || !Array.isArray(indexes)) continue;
      sanitized[id] = [...new Set(indexes.filter(index => Number.isInteger(index) && index >= 0 && index < lesson.builder.length))];
    }
    return sanitized;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { lessonTabStatus, sanitizeGrammarParts };
  else Object.assign(root, { lessonTabStatus, sanitizeGrammarParts });
})(typeof globalThis === 'undefined' ? this : globalThis);
