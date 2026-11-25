# JLPT N5 data and alignment notes

Sakura Academy maps its N5 preparation activities to the JLPT’s published level summary and test item descriptions:

- [N1–N5 linguistic competence summary](https://www.jlpt.jp/e/about/levelsummary.html)
- [Test sections, timing, and item types](https://www.jlpt.jp/e/guideline/testsections.html)
- [JLPT FAQ: why vocabulary, kanji, and grammar specifications are no longer published](https://www.jlpt.jp/e/faq/)

JLPT N5 item families represented in the app: vocabulary kanji reading, orthography, contextual meaning, paraphrase; grammar form selection, sentence construction, and text grammar; short and mid-size reading plus information retrieval; listening task-based comprehension, key points, verbal expressions, and quick response. The app includes 24 original reading questions and 32 original listening questions across the N5 item families. N5 has three timed test sections, while its score report combines Language Knowledge (Vocabulary/Grammar) and Reading into one scoring section and scores Listening separately; see the [JLPT FAQ](https://www.jlpt.jp/e/faq/). The overview lists official section times. Study drills are untimed. The timed mock has 20 questions in each section, guarantees practice across the listed item families, and uses the official section times; its question count and raw score are for study only and do not reproduce the official paper or predict a scaled score. All questions are original, not copied from JLPT test items.

The JLPT does not publish a current exhaustive vocabulary, kanji, or grammar checklist. The app’s 674 vocabulary entries, 81 grammar points, and 84 kanji are approximate study coverage drawn from [OpenJLPT](https://github.com/evanclan/OpenJLPT), whose word and kanji level assignments follow Jonathan Waller’s community lists. They are not official JLPT lists. The OpenJLPT-derived study data is licensed CC BY-SA 4.0.

OpenJLPT upstream attribution: JMdict and KANJIDIC2 (EDRDG), Jonathan Waller’s JLPT lists, and Tatoeba. Vocabulary example sentences retain their Tatoeba IDs; the app links to the individual source sentence wherever an example is displayed and shows the English translation when available. These community examples are optional reading aids and may contain words beyond N5. See [`src/data/NOTICE.md`](src/data/NOTICE.md) and the [OpenJLPT source notice](https://github.com/evanclan/OpenJLPT/blob/main/NOTICE.md) for details and source licenses.

The 250 ordered character paths in `src/content.js` are from [KanjiVG](https://kanjivg.tagaini.net/) by Ulrich Apel and contributors, licensed CC BY-SA 3.0. The bundled paths remain under CC BY-SA 3.0.

The bundled `src/data/kanji-explorer-supplemental.js` contains the course characters not limited to the curated 84-card N5 list. Dictionary meanings, readings, and stroke counts are derived from OpenJLPT level data and EDRDG KANJIDIC2; ordered SVG paths are from KanjiVG and remain under CC BY-SA 3.0. Source and license details are recorded in [`src/data/NOTICE.md`](src/data/NOTICE.md). Memory cues are learner-facing visual associations, not etymological claims.

Sakura Academy is independent and is not endorsed by or affiliated with the JLPT organizers.

## Grammar explanation references

The 12 original lesson explanations are written for Sakura Academy and cross-checked against beginner instructional references: the [Japan Foundation Irodori grammar notes](https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf) and [Tokyo Metropolitan University mic-J N5 materials](https://nihongo.hum.tmu.ac.jp/mic-j/N5/index.html). These references inform grammar accuracy; the app's examples and practice items are independently authored.

## Vocabulary usage editorial references

The audited vocabulary notes were cross-checked against [Tokyo Metropolitan University mic-J N5 grammar materials](https://nihongo.hum.tmu.ac.jp/mic-j/N5/index.html) for いくら (price/fare) and いくつ (count), and the [Japan Foundation Irodori beginner grammar notes](https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf) for 好き patterns. Family honorific forms were checked against the [Agency for Cultural Affairs learner vocabulary reference](https://www.bunka.go.jp/seisaku/kokugo_nihongo/kyoiku/seikatsusha/h25_nihongo_program_a/pdf/a_28.pdf). These references inform original learner-facing explanations; the app text is independently written.


The guided course uses the approximate N5 reference catalogs across 12 units. Each unit teaches usage and a common pitfall, practices selected vocabulary and grammar, reviews assigned kanji, and includes original graded reading/listening. Original Sakura Academy content is authored for learning; counts describe this app, not an official JLPT specification. Kokoro narration is bundled for offline playback.
