// JLPT N5 curriculum browser and original practice activities.
let n5Tab='overview', n5Search='', n5PageIndex=0, n5SelectedKanji=0;
let n5Question=null, n5PracticeSection='vocabulary', n5Correct=0, n5Attempted=0;
let n5Mock=null, n5MockTimer=null;

function n5Set(tab){n5Tab=tab;n5PageIndex=0;n5Question=null;render()}
function n5VocabularyList(){
 const q=n5Search.trim().toLowerCase();
 const list=N5_VOCAB.filter(w=>!q||[w.word,w.reading,w.romaji,...w.meanings].join(' ').toLowerCase().includes(q));
 const start=n5PageIndex*24, page=list.slice(start,start+24);
 return `<div class="row"><input id="n5Search" class="field" placeholder="Search word, reading, or meaning" value="${esc(n5Search)}"><button class="btn" onclick="n5Search=$('n5Search').value;n5PageIndex=0;render()">Search</button><span class="pill">${list.length} entries</span></div><p class="notice">Community example sentences are optional reading aids and may include vocabulary beyond N5; English translations are shown when available.</p><div class="wordgrid" style="margin-top:14px">${page.map(w=>`<article class="word"><div class="row between"><b class="jp">${esc(w.word)}</b><button class="btn ghost small" onclick="speak('${w.word}')">▶</button></div><div>${esc(w.reading)} · ${esc(w.romaji)}</div><p>${esc(w.meanings.join('; '))}</p>${w.examples?.[0]?`<details class="n5-example"><summary>Example sentence</summary><p class="notice jp">${esc(w.examples[0].ja)}</p>${w.examples[0].en?`<p class="notice">${esc(w.examples[0].en)}</p>`:''}${w.examples[0].tatoeba_id?`<a class="notice" href="https://tatoeba.org/en/sentences/show/${w.examples[0].tatoeba_id}" target="_blank" rel="noopener">Tatoeba sentence ${w.examples[0].tatoeba_id}</a>`:''}</details>`:''}</article>`).join('')}</div><div class="row between" style="margin-top:14px"><button class="btn secondary" ${n5PageIndex===0?'disabled':''} onclick="n5PageIndex--;render()">← Previous</button><span class="notice">${start+1}–${Math.min(start+24,list.length)} of ${list.length}</span><button class="btn secondary" ${start+24>=list.length?'disabled':''} onclick="n5PageIndex++;render()">Next →</button></div>`
}
function n5GrammarList(){
 const q=n5Search.trim().toLowerCase();
 const list=N5_GRAMMAR.filter(g=>!q||[g.pattern,g.romaji,g.meaning,g.formation,...g.tags].join(' ').toLowerCase().includes(q));
 const start=n5PageIndex*12,page=list.slice(start,start+12);
 return `<div class="row"><input id="n5Search" class="field" placeholder="Search pattern or meaning" value="${esc(n5Search)}"><button class="btn" onclick="n5Search=$('n5Search').value;n5PageIndex=0;render()">Search</button><span class="pill">${list.length} points</span></div><div class="grid">${page.map(g=>`<article class="card"><div class="eyebrow">${esc(g.tags.join(' · '))}</div><h3 class="jp">${esc(g.pattern)} <small class="muted">${esc(g.romaji)}</small></h3><b>${esc(g.meaning)}</b><p class="notice">${esc(g.formation)}</p>${g.examples?.[0]?`<p class="jp">${esc(g.examples[0].ja)}</p><p class="notice">${esc(g.examples[0].en)}</p>`:''}${g.notes?`<details><summary>Usage note</summary><p>${esc(g.notes)}</p></details>`:''}</article>`).join('')}</div><div class="row between"><button class="btn secondary" ${n5PageIndex===0?'disabled':''} onclick="n5PageIndex--;render()">← Previous</button><span class="notice">${start+1}–${Math.min(start+12,list.length)} of ${list.length}</span><button class="btn secondary" ${start+12>=list.length?'disabled':''} onclick="n5PageIndex++;render()">Next →</button></div>`
}
function n5KanjiList(){
 const k=N5_KANJI[n5SelectedKanji];
 return `<div class="kana-grid">${N5_KANJI.map((x,i)=>`<button class="kana" onclick="n5SelectedKanji=${i};render()"><strong>${x.character}</strong><small>${esc(x.meanings[0])} · ${x.strokes} strokes</small></button>`).join('')}</div><article class="card" style="margin-top:14px"><div class="row between"><div><div class="bigjp jp" style="margin:0">${k.character}</div><h2>${esc(k.meanings.join(' / '))}</h2><p><b>On:</b> ${esc(k.onyomi.join(' · ')||'—')} · <b>Kun:</b> ${esc(k.kunyomi.join(' · ')||'—')}</p><p><b>Stroke count:</b> ${k.strokes} · <b>Example words:</b> ${esc(k.words.slice(0,5).join('、'))}</p><button class="btn" onclick="practiceScript='Kanji';practiceIndex=KANJI.findIndex(x=>x.ch==='${k.character}');nav('handwriting')">Practice writing →</button></div><div>${strokeOrderSvg(k.character)}</div></div></article>`
}
function n5Practice(){
 const sec=n5PracticeSection;
 return `<div class="tabs">${[['vocabulary','Vocabulary'],['grammar','Grammar'],['reading','Reading'],['listening','Listening']].map(x=>`<button class="tab ${sec===x[0]?'active':''}" onclick="n5PracticeSection='${x[0]}';n5Question=null;render()">${x[1]}</button>`).join('')}</div><div class="card"><div class="row between"><div><h2>${sec[0].toUpperCase()+sec.slice(1)} practice</h2><p class="notice">Original practice items modeled on JLPT N5 question formats.</p></div><span class="pill">${n5Correct}/${n5Attempted} correct</span></div>${n5Question?`<div class="feedback"><b>${esc(n5Question.type)}</b></div>${n5Question.audio?`<button class="btn secondary" onclick="speak(n5Question.audio)">▶ Play listening prompt</button>`:''}${n5Question.text?`<div class="word jp" style="white-space:pre-line">${esc(n5Question.text)}</div>`:''}<p>${esc(n5Question.prompt)}</p>${n5Question.options.map((o,i)=>`<button class="option" ${n5Question.answered?'disabled':''} onclick="answerN5Question(${i})">${esc(o)}</button>`).join('')}${n5Question.answered?`<div class="feedback ${n5Question.correct===n5Question.selected?'good':'bad'}">${n5Question.correct===n5Question.selected?'Correct.':'Answer: '+esc(n5Question.options[n5Question.correct])}</div>`:''}<button class="btn" onclick="newN5Question('${sec}')">${n5Question.answered?'Next question':'New question'}</button>`:`<p>Practice the N5 ${esc(sec)} section. Questions are original and not taken from JLPT exams.</p><button class="btn" onclick="newN5Question('${sec}')">Start practice</button>`}</div>`
}
function buildN5Question(section,forced=null,forcedType=null){
 let q,question;
 if(section==='reading'){
  q=forced||N5_READINGS[Math.floor(Math.random()*N5_READINGS.length)];question={...q,type:q.type,prompt:q.question,correct:q.answer};
 }else if(section==='listening'){
  q=forced||N5_LISTENING[Math.floor(Math.random()*N5_LISTENING.length)];question={...q,prompt:q.question,correct:q.answer};
 }else if(section==='grammar'){
  if(forced){q=forced;question={type:q.type,text:q.text,prompt:'Choose the answer that makes a natural sentence or passage.',options:q.options,correct:q.answer}}else if(Math.random()<.65){q=Math.random()<.5?N5_GRAMMAR_FORM_ITEMS[Math.floor(Math.random()*N5_GRAMMAR_FORM_ITEMS.length)]:N5_TEXT_FLOW_ITEMS[Math.floor(Math.random()*N5_TEXT_FLOW_ITEMS.length)];question={type:q.type,text:q.text,prompt:'Choose the answer that makes a natural sentence or passage.',options:q.options,correct:q.answer}}else{q=N5_GRAMMAR[Math.floor(Math.random()*N5_GRAMMAR.length)];const options=[q,...shuffle(N5_GRAMMAR.filter(x=>x.id!==q.id)).slice(0,3)];const shuffled=shuffle(options);question={type:'Grammar point · choose the meaning',prompt:`What does ${q.pattern} express?`,options:shuffled.map(x=>x.meaning),correct:shuffled.indexOf(q)}}
 }else{
  q=forced||N5_VOCAB[Math.floor(Math.random()*N5_VOCAB.length)];const type=forcedType??Math.floor(Math.random()*4),pool=shuffle(N5_VOCAB.filter(x=>x.id!==q.id));let answer,prompt,text='';
  if(type===0){answer=q.reading;prompt=`Choose the reading of ${q.word}.`}
  else if(type===1){answer=q.word;prompt=`Which spelling matches ${q.reading}?`}
  else if(type===2){answer=q.meanings[0];text=q.examples?.[0]?.ja||q.word;prompt='Choose the meaning that best fits this expression.'}
  else{answer=q.meanings[0];prompt=`Choose the closest meaning for ${q.word} (${q.reading}).`}
  const raw=[answer,...pool.map(x=>type===0?x.reading:type===1?x.word:x.meanings[0])].filter((x,i,a)=>x&&a.indexOf(x)===i).slice(0,4);
  const options=shuffle(raw);question={type:['Kanji reading','Orthography','Contextually-defined expression','Paraphrase'][type],prompt,text,options,correct:options.indexOf(answer)};
 }
 return {...question,answered:false,selected:-1};
}
function newN5Question(section){n5Question=buildN5Question(section);render()}
function answerN5Question(i){if(!n5Question||n5Question.answered)return;n5Question.selected=i;n5Question.answered=true;n5Attempted++;if(i===n5Question.correct)n5Correct++;render()}
function n5Page(){
 const tabs=[['overview','Overview'],['vocabulary','Vocabulary'],['grammar','Grammar'],['kanji','Kanji'],['practice','Practice'],['mock','Timed mock']];
 let body;
 if(n5Tab==='vocabulary')body=n5VocabularyList();
 else if(n5Tab==='grammar')body=n5GrammarList();
 else if(n5Tab==='kanji')body=n5KanjiList();
 else if(n5Tab==='practice')body=n5Practice();
 else if(n5Tab==='mock')body=n5MockPage();
 else body=`<div class="grid"><div class="card"><div class="stat">${N5_VOCAB.length}</div><div>approximate vocabulary entries</div></div><div class="card"><div class="stat">${N5_GRAMMAR.length}</div><div>grammar reference points</div></div><div class="card"><div class="stat">${N5_KANJI.length}</div><div>approximate N5 kanji</div></div><div class="card"><div class="stat">${N5_READINGS.length+N5_LISTENING.length}</div><div>${N5_READINGS.length} reading · ${N5_LISTENING.length} listening practice items</div></div></div><div class="card"><div class="row between"><div><h2>Ready for a timed run?</h2><p>Try a 60-question practice mock across all three N5 sections.</p></div><button class="btn" onclick="startN5Mock()">Start timed mock →</button></div><p class="notice">Practice questions are original. The score is a raw practice result, not a JLPT scaled score or pass prediction.</p></div><h2 class="section">Official N5 test structure</h2><div class="grid"><article class="card"><h3>Vocabulary · 20 min</h3><p>Kanji reading · orthography · contextual expressions · paraphrases</p></article><article class="card"><h3>Grammar & reading · 40 min</h3><p>Sentence grammar · sentence composition · text grammar · short and mid-size passages · information retrieval</p></article><article class="card"><h3>Listening · 30 min</h3><p>Task-based comprehension · key points · verbal expressions · quick response</p></article></div><div class="card"><h3>What this alignment means</h3><p>The JLPT describes N5 reading as understanding typical expressions and sentences in hiragana, katakana, and basic kanji; listening focuses on short, slowly spoken everyday and classroom conversations.</p><p>This app maps practice to the JLPT’s published level summary and question types. It does not claim endorsement. JLPT vocabulary, kanji, and grammar lists are not published as a current official specification; the counts here are a community approximation.</p><p class="notice">References: <a href="https://www.jlpt.jp/e/about/levelsummary.html" target="_blank" rel="noopener">N5 level summary</a> · <a href="https://www.jlpt.jp/e/guideline/testsections.html" target="_blank" rel="noopener">test sections and item types</a> · <a href="https://www.jlpt.jp/e/faq/" target="_blank" rel="noopener">why vocabulary/kanji/grammar lists are not published</a></p><p class="notice">Community-derived study list: OpenJLPT · CC BY-SA 4.0. Word and kanji levels follow Jonathan Waller’s lists; example sentences link to Tatoeba. <a href="DATA_SOURCES.md">Data sources and licenses</a>.</p></div>`;
 return `${header('JLPT N5 preparation','An N5-focused study hub mapped to published JLPT abilities and item formats. Approximate lists are clearly labeled.','N5 COURSE')}<div class="tabs">${tabs.map(x=>`<button class="tab ${n5Tab===x[0]?'active':''}" onclick="n5Set('${x[0]}')">${x[1]}</button>`).join('')}</div>${body}`;
}
const N5_MOCK_SECTIONS=[['Vocabulary','vocabulary',20],['Grammar & reading','grammar-reading',40],['Listening','listening',30]];
function startN5Mock(){
 stopN5MockTimer();
 const vocab=shuffle(N5_VOCAB).slice(0,20).map((w,i)=>buildN5Question('vocabulary',w,i%4));
 const forms=shuffle(N5_GRAMMAR_FORM_ITEMS.filter(q=>q.type.includes('select the form'))),composition=N5_GRAMMAR_FORM_ITEMS.filter(q=>q.type==='Sentence composition');
 const grammar=shuffle([...forms,...shuffle(composition),shuffle(composition)[0],...shuffle(N5_TEXT_FLOW_ITEMS)]).map(q=>buildN5Question('grammar',q));
 const reading=[...shuffle(N5_READINGS.filter(q=>q.type.startsWith('Short passage'))).slice(0,4),...shuffle(N5_READINGS.filter(q=>q.type.startsWith('Mid-size passage'))).slice(0,4),...shuffle(N5_READINGS.filter(q=>q.type.startsWith('Information retrieval'))).slice(0,2)].map(q=>buildN5Question('reading',q));
 const listening=Array.from({length:20},(_,i)=>buildN5Question('listening',N5_LISTENING[i%N5_LISTENING.length]));
 const pools=[vocab,[...grammar,...reading],listening];
 n5Mock={sections:N5_MOCK_SECTIONS.map((s,i)=>({name:s[0],minutes:s[2],questions:pools[i],answers:Array(pools[i].length).fill(null)})),sectionIndex:0,questionIndex:0,complete:false};
 beginN5MockSection();n5Tab='mock';render();
}
function beginN5MockSection(){n5Mock.endAt=Date.now()+n5Mock.sections[n5Mock.sectionIndex].minutes*60000;stopN5MockTimer();n5MockTimer=setInterval(n5MockTick,1000)}
function stopN5MockTimer(){if(n5MockTimer){clearInterval(n5MockTimer);n5MockTimer=null}}
function n5MockTick(){if(!n5Mock||n5Mock.complete)return;if(Date.now()>=n5Mock.endAt){finishN5MockSection();return}if(view==='n5'&&n5Tab==='mock'){const clock=$('n5MockClock');if(clock)clock.textContent=n5MockClock()}}
function finishN5MockSection(){
 if(!n5Mock||n5Mock.complete)return;
 if(n5Mock.sectionIndex<N5_MOCK_SECTIONS.length-1){n5Mock.sectionIndex++;n5Mock.questionIndex=0;beginN5MockSection();render()}
 else{n5Mock.complete=true;stopN5MockTimer();render()}
}
function n5MockMove(delta){const s=n5Mock.sections[n5Mock.sectionIndex];n5Mock.questionIndex=Math.max(0,Math.min(s.questions.length-1,n5Mock.questionIndex+delta));render()}
function n5MockAnswer(i){if(!n5Mock)return;const s=n5Mock.sections[n5Mock.sectionIndex];s.answers[n5Mock.questionIndex]=i;render()}
function n5MockPlayAudio(){const q=n5Mock?.sections[n5Mock.sectionIndex]?.questions[n5Mock.questionIndex];if(q?.audio)speak(q.audio)}
function n5MockClock(){const left=Math.max(0,Math.ceil((n5Mock.endAt-Date.now())/1000));return `${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`}
function n5MockPage(){
 if(!n5Mock)return `<div class="card"><h2>Timed N5 practice mock</h2><p>Work through 60 original practice questions across timed sections. Each section has its own countdown; finishing early moves you forward.</p><div class="grid">${N5_MOCK_SECTIONS.map(s=>`<article class="card"><h3>${s[0]} · ${s[2]} minutes</h3></article>`).join('')}</div><p class="notice">Listening prompts are available with the play button. This is an original practice set, not an official JLPT paper. Raw results cannot predict the JLPT’s scaled score.</p><button class="btn" onclick="startN5Mock()">Begin mock exam</button></div>`;
 if(n5Mock.complete)return `<div class="card"><div class="eyebrow">MOCK COMPLETE</div><h2>Your practice results</h2><div class="grid">${n5Mock.sections.map(s=>{const correct=s.answers.reduce((n,a,i)=>n+(a===s.questions[i].correct?1:0),0),done=s.answers.filter(a=>a!==null).length;return `<article class="card"><h3>${esc(s.name)}</h3><div class="stat">${correct} / ${s.questions.length}</div><p>${done} answered · ${s.questions.length-done} unanswered</p></article>`}).join('')}</div><div class="feedback"><b>Total:</b> ${n5Mock.sections.reduce((n,s)=>n+s.answers.reduce((m,a,i)=>m+(a===s.questions[i].correct?1:0),0),0)} / 60 correct</div><p class="notice">These three practice totals are study categories, not official score sections. JLPT N5 combines Language Knowledge (Vocabulary/Grammar) and Reading into one score, with Listening scored separately. JLPT results use scaled scoring; this raw score does not predict a pass or fail.</p><button class="btn" onclick="startN5Mock()">Try another mock</button></div>`;
 const s=n5Mock.sections[n5Mock.sectionIndex],q=s.questions[n5Mock.questionIndex],selected=s.answers[n5Mock.questionIndex],answered=s.answers.filter(a=>a!==null).length;
 return `<div class="card"><div class="row between"><div><div class="eyebrow">SECTION ${n5Mock.sectionIndex+1} OF 3</div><h2>${esc(s.name)}</h2><span class="pill">${answered}/${s.questions.length} answered</span></div><div class="stat" id="n5MockClock" aria-label="Time remaining">${n5MockClock()}</div></div><div class="row between"><button class="btn secondary" ${n5Mock.questionIndex===0?'disabled':''} onclick="n5MockMove(-1)">← Previous</button><b>Question ${n5Mock.questionIndex+1} of ${s.questions.length}</b><button class="btn secondary" ${n5Mock.questionIndex===s.questions.length-1?'disabled':''} onclick="n5MockMove(1)">Next →</button></div><article class="feedback" style="margin-top:16px"><b>${esc(q.type)}</b>${q.audio?`<div><button class="btn secondary" onclick="n5MockPlayAudio()">▶ Play listening prompt</button></div>`:''}${q.text?`<div class="word jp" style="white-space:pre-line">${esc(q.text)}</div>`:''}<p>${esc(q.prompt)}</p>${q.options.map((o,i)=>`<button class="option ${selected===i?'selected':''}" aria-pressed="${selected===i}" onclick="n5MockAnswer(${i})">${esc(o)}</button>`).join('')}</article><div class="row between" style="margin-top:14px"><span class="notice">Unanswered questions count as incorrect.</span><button class="btn" onclick="finishN5MockSection()">${n5Mock.sectionIndex===2?'Finish exam':'Finish section →'}</button></div></div>`;
}
const N5_GRAMMAR_FORM_ITEMS=[
 {type:'Sentential grammar · select the form',text:'わたし ___ 学生です。',options:['は','を','で','に'],answer:0},
 {type:'Sentential grammar · select the form',text:'毎朝 7時 ___ 起きます。',options:['を','に','へ','が'],answer:1},
 {type:'Sentential grammar · select the form',text:'図書館 ___ 日本語を 勉強します。',options:['を','に','で','と'],answer:2},
 {type:'Sentential grammar · select the form',text:'友だち ___ 映画を 見ました。',options:['と','で','を','が'],answer:0},
 {type:'Sentence composition',text:'Choose the natural sentence.',options:['私は毎日学校へ行きます。','毎日私は行きます学校へ。','学校へ行きます私は毎日。'],answer:0},
 {type:'Sentence composition',text:'Choose the natural sentence.',options:['きのう本を買いました。','買いました本きのうを。','本きのうを買いました。'],answer:0}
];
const N5_TEXT_FLOW_ITEMS=[
 {type:'Text grammar · choose the connector',text:'きょうは 日曜日です。午前中は そうじを しました。［　］、午後は 友だちと 公園へ 行きました。',options:['それから','でも','だから','しかし'],answer:0},
 {type:'Text grammar · choose the connector',text:'きのうは 雨でした。［　］、きょうは いい天気です。',options:['でも','それから','そして','だから'],answer:0},
 {type:'Text grammar · choose the connector',text:'朝ごはんを 食べました。［　］、学校へ 行きました。',options:['それから','でも','しかし','だから'],answer:0}
];
