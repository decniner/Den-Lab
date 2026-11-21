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
    if (line.jp && line.en) queue.push({ ...conversationItem(lesson, line), section: `Conversation · Speaker ${line.who}` });
  }
  return queue;
}

function lessonAudioSpeaker(item) {
  const match = /^Conversation · Speaker ([AB])$/.exec(item?.section || '');
  return match ? match[1] : null;
}

Object.assign(globalThis, { buildLessonAudioQueue, lessonAudioSpeaker });

function phraseAudioKey(text) { return String(text || '').normalize('NFC').replace(/\s+/g, ''); }
function conversationItem(lesson, line, lineIndex=0) {
  const speaker = line.who === 'B' ? 'B' : 'A';
  const base = phraseAudioKey(line.jp);
  return { section: `Conversation · Speaker ${speaker}`, jp: line.jp, en: line.en, speaker, voice: speaker === 'A' ? 'jf_alpha' : 'jm_kumo', audioKey: speaker === 'B' ? `dialogue:B:${base}` : base, lessonId: lesson.id, lessonTitle: lesson.title, lineIndex };
}
function buildLessonConversationQueue(lesson) {
  if (!lesson) return [];
  return (lesson.dialogue || []).filter(line => line.jp && line.en).map((line, index) => conversationItem(lesson, line, index));
}
function buildCourseConversationQueue(lessons, startLessonId=1) {
  if (!Array.isArray(lessons)) return [];
  const start = Math.max(0, lessons.findIndex(lesson => lesson.id === Number(startLessonId)));
  return lessons.slice(start).flatMap(lesson => buildLessonConversationQueue(lesson));
}
Object.assign(globalThis, { buildLessonConversationQueue, buildCourseConversationQueue });

function audioMouthLevel(samples) {
  if (!samples?.length) return 0;
  let sum = 0;
  for (const sample of samples) {
    const centered = (sample - 128) / 128;
    sum += centered * centered;
  }
  const rms = Math.sqrt(sum / samples.length);
  return Math.max(0, Math.min(1, (rms - 0.012) * 9));
}
Object.assign(globalThis, { audioMouthLevel });

function audioKanaToRomaji(text) {
  const basic = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ';
  const sounds = 'a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa o n ga gi gu ge go za ji zu ze zo da ji zu de do ba bi bu be bo pa pi pu pe po'.split(' ');
  const map = Object.fromEntries([...basic].map((kana, i) => [kana, sounds[i]]));
  const pairs = {きゃ:'kya',きゅ:'kyu',きょ:'kyo',しゃ:'sha',しゅ:'shu',しょ:'sho',ちゃ:'cha',ちゅ:'chu',ちょ:'cho',にゃ:'nya',にゅ:'nyu',にょ:'nyo',ひゃ:'hya',ひゅ:'hyu',ひょ:'hyo',みゃ:'mya',みゅ:'myu',みょ:'myo',りゃ:'rya',りゅ:'ryu',りょ:'ryo',ぎゃ:'gya',ぎゅ:'gyu',ぎょ:'gyo',じゃ:'ja',じゅ:'ju',じょ:'jo',ぢゃ:'ja',ぢゅ:'ju',ぢょ:'jo',びゃ:'bya',びゅ:'byu',びょ:'byo',ぴゃ:'pya',ぴゅ:'pyu',ぴょ:'pyo'};
  const hira = c => { const n = c.codePointAt(0); return n >= 0x30a1 && n <= 0x30f6 ? String.fromCodePoint(n - 0x60) : c; };
  let out = '', lastVowel = '';
  for (let i = 0; i < String(text).length; i++) {
    const c = hira(String(text)[i]), next = hira(String(text)[i + 1] || ''), pair = c + next;
    if (c === 'っ') { const upcoming = pairs[pair.slice(1)] || map[next] || ''; out += upcoming.startsWith('ch') ? 't' : /^[bcdfghjklmnpqrstvwxyz]/.test(upcoming) ? upcoming[0] : 't'; continue; }
    if (c === 'ん') { out += /[あいうえおやゆよ]/.test(next) ? "n'" : 'n'; lastVowel = ''; continue; }
    if (c === 'ー') { out += lastVowel; continue; }
    const raw = String(text)[i];
    if (raw === '。' || raw === '．') { out += '.'; continue; }
    if (raw === '、' || raw === '，') { out += ','; continue; }
    if (c === 'は' && (!next || /[\s。、.!?]/.test(String(text)[i + 1] || ''))) { if (/\s/.test(String(text)[i + 1] || '')) out += ' '; out += 'wa'; continue; }
    if (c === 'で' && next === 'す') { out += ' desu'; i++; lastVowel = 'u'; continue; }
    let value = pairs[pair];
    if (value) i++;
    else value = map[c];
    if (!value) { out += String(text)[i]; continue; }
    out += value;
    const vowels = value.match(/[aeiou](?!.*[aeiou])/);
    lastVowel = vowels ? vowels[0] : lastVowel;
  }
  return out;
}
Object.assign(globalThis, { audioKanaToRomaji });
