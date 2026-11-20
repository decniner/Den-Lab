(function exposeLessonTabProgress(root) {
  const isValidPassingAssessment = root.isValidPassingAssessment ||
    (typeof require === 'function' ? require('./content-validation.js').isValidPassingAssessment : () => false);

  function lessonTabStatus(tab, lesson, state, assessmentTypes) {
    if (!lesson || !state) return 'not-started';
    if (state.completed?.[lesson.id] === true) return 'complete';

    const answers = Array.isArray(state.answers) ? state.answers.filter(answer => answer?.lesson === lesson.id) : [];
    const visited = Array.isArray(state.tabVisits?.[lesson.id]) && state.tabVisits[lesson.id].includes(tab);
    const hasAnswer = format => answers.some(answer => answer.format === format);
    const hasCorrect = format => answers.some(answer => answer.format === format && answer.correct === true);

    if (tab === 'vocab') {
      const total = lesson.vocab.length;
      const learned = lesson.vocab.filter(word => state.learned?.[word.id] === true).length;
      if (total > 0 && learned === total) return 'complete';
      if (learned > 0) return 'in-progress';
    } else if (tab === 'grammar' || tab === 'builder') {
      if (hasCorrect('ordering')) return 'complete';
      if (hasAnswer('ordering')) return 'in-progress';
    } else if (tab === 'dialogue' || tab === 'listening' || tab === 'writing') {
      const format = { dialogue: 'dialogue', listening: 'listening', writing: 'typing' }[tab];
      if (hasCorrect(format)) return 'complete';
      if (hasAnswer(format)) return 'in-progress';
    } else if (tab === 'quiz') {
      const run = state.assessments?.[lesson.id];
      if (isValidPassingAssessment(run, assessmentTypes, lesson.vocab.map(word => word.id))) return 'complete';
      const results = run?.results;
      if (Array.isArray(results) && results.length === 5 && results.every(result => typeof result === 'boolean') && results.filter(Boolean).length < 4) return 'needs-review';
      if (Array.isArray(results) && results.length > 0) return 'in-progress';
    }

    return visited ? 'in-progress' : 'not-started';
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { lessonTabStatus };
  else root.lessonTabStatus = lessonTabStatus;
})(typeof globalThis === 'undefined' ? this : globalThis);
