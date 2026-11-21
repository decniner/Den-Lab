// Transcript helpers for the browser's Japanese speech-recognition events.
(function (root) {
  function getRecognitionTranscript(event) {
    const results = event?.results;
    if (!results?.length) return '';
    let bestText = '';
    let bestConfidence = -1;
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      for (let j = 0; j < (result?.length || 0); j++) {
        const alternative = result[j];
        const transcript = String(alternative?.transcript || '').trim();
        const confidence = Number.isFinite(alternative?.confidence) ? alternative.confidence : 0;
        if (transcript && confidence > bestConfidence) {
          bestText = transcript;
          bestConfidence = confidence;
        }
      }
    }
    return bestText;
  }

  function normalizeJapanese(text) {
    return Array.from(String(text).normalize('NFKC').toLowerCase())
      .map(character => {
        const code = character.codePointAt(0);
        return code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : character;
      })
      .join('')
      .replace(/[\s。、，,.!?！？「」『』・:：;；]/g, '');
  }

  function sentenceMatchScore(expected, recognized) {
    const target = Array.from(normalizeJapanese(expected));
    const heard = Array.from(normalizeJapanese(recognized));
    if (!target.length || !heard.length) return 0;
    let previous = Array.from({ length: heard.length + 1 }, (_, index) => index);
    for (let row = 1; row <= target.length; row++) {
      const current = [row];
      for (let column = 1; column <= heard.length; column++) {
        current[column] = Math.min(
          previous[column] + 1,
          current[column - 1] + 1,
          previous[column - 1] + (target[row - 1] === heard[column - 1] ? 0 : 1),
        );
      }
      previous = current;
    }
    return Math.max(0, Math.round(100 * (1 - previous[heard.length] / Math.max(target.length, heard.length))));
  }

  const api = Object.freeze({ getRecognitionTranscript, sentenceMatchScore });
  root.SAKURA_SPEECH_PRACTICE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
