// Build the audio-only listen-through sequence from the same lesson content used in study mode.
function buildLessonAudioQueue(lesson) {
  if (!lesson) return [];
  const queue = [];
  if (lesson.jp && lesson.en) queue.push({ section: 'Lesson sentence', jp: lesson.jp, en: lesson.en });
  for (const word of lesson.vocab || []) {
    if (word.jp && word.en) queue.push({ section: 'Vocabulary', jp: word.jp, en: word.en });
    if (word.example && word.exampleEn) queue.push({ section: 'Example', jp: word.example, en: word.exampleEn });
  }
  for (const line of lesson.dialogue || []) {
    if (line.jp && line.en) queue.push({ section: `Conversation · Speaker ${line.who}`, jp: line.jp, en: line.en });
  }
  return queue;
}

function lessonAudioSpeaker(item) {
  const match = /^Conversation · Speaker ([AB])$/.exec(item?.section || '');
  return match ? match[1] : null;
}

Object.assign(globalThis, { buildLessonAudioQueue, lessonAudioSpeaker });
