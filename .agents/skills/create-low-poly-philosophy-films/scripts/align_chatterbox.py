"""Align the authored words to the generated speech using acoustic CTC alignment."""
import json,re,sys,wave,subprocess
from pathlib import Path
import torch,torchaudio
from torchaudio import functional as F
from common import load_project

import os
P=Path(os.environ['PHILOSOPHY_FILM_PROJECT']).resolve()
AUDIO=P/'chatterbox_audio'
torch.set_num_threads(2);torch.set_num_interop_threads(1)
torch.hub.set_dir(str(P/'alignment'))
bundle=torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H
model=bundle.get_model().eval();labels=bundle.get_labels();vocab={c:i for i,c in enumerate(labels)}
cfg,rows=load_project(P)
(P/'audio').mkdir(exist_ok=True)
scenes=[];checks=[];cursor=cfg['lead_in_seconds']
for i,row in enumerate(rows):
    source=AUDIO/f'{i:02d}.wav'
    samples,sr=torchaudio.load(str(source));samples=samples.mean(0,keepdim=True)
    dur=samples.shape[1]/sr
    audio=F.resample(samples,sr,bundle.sample_rate)
    tokens=row['text'].split()
    clean=[re.sub('[^A-Z\']','',w.upper()) for w in tokens]
    transcript='|'.join(clean)
    targets=torch.tensor([[vocab[c] for c in transcript]],dtype=torch.int32)
    with torch.inference_mode():emission,_=model(audio)
    logp=emission.log_softmax(-1)
    path,scores=F.forced_align(logp,targets,blank=0)
    spans=F.merge_tokens(path[0],scores[0].exp(),blank=0)
    assert [s.token for s in spans]==targets[0].tolist(),'Unexpected acoustic token alignment'
    scale=audio.shape[1]/bundle.sample_rate/logp.shape[1]
    words=[];pos=0
    for token,letters in zip(tokens,clean,strict=True):
        group=spans[pos:pos+len(letters)];assert group
        start=group[0].start*scale
        end=min(dur,group[-1].end*scale+.08)
        words.append({'text':token,'t':start,'dur':end-start,'confidence':sum(s.score for s in group)/len(group)})
        pos+=len(letters)+1
    for current,nxt in zip(words,words[1:]):
        current['dur']=min(current['dur'],nxt['t']-current['t'])
    assert ' '.join(w['text'] for w in words)==row['text']
    assert all(w['t']>=0 and 0<w['dur'] and w['t']+w['dur']<=dur+1e-6 for w in words)
    greedy=''.join(labels[t] for t in torch.unique_consecutive(logp[0].argmax(-1)).tolist() if t!=0).replace('|',' ')
    dest=P/'audio'/f'{i:02d}.wav'
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-ar','48000','-ac','1',str(dest)],check=True)
    with wave.open(str(dest)) as f:dur=f.getnframes()/f.getframerate()
    speaker=row['who'];voice=cfg.get(speaker.lower()+'_voice_label','Peter Yearsley' if speaker=='HUMAN' else 'Caro Davy')
    scene={'speaker':speaker,'text':row['text'],'scene':row['scene'],'start':cursor,'end':cursor+dur+row['pause'],'dur':dur,'pause':row['pause'],'words':words,'file':str(dest),'voice':voice}
    scenes.append(scene);cursor=scene['end']
    checks.append({'turn':i,'greedy_transcript':greedy,'authored_text':row['text'],'mean_word_confidence':sum(w['confidence'] for w in words)/len(words)})
    print(f'Aligned turn {i+1}/{len(rows)}: {greedy}',flush=True)
duration=cursor+cfg['tail_seconds']
with wave.open(str(P/'dialogue.wav'),'wb') as out:
    out.setparams((1,2,48000,0,'NONE','not compressed'))
    out.writeframes(bytes(round(cfg['lead_in_seconds']*48000)*2))
    for scene in scenes:
        with wave.open(scene['file']) as f:out.writeframes(f.readframes(f.getnframes()))
        out.writeframes(bytes(round(scene['pause']*48000)*2))
    out.writeframes(bytes(round(cfg['tail_seconds']*48000)*2))
(P/'scenes.json').write_text(json.dumps({'duration':duration,'engine':'Chatterbox Turbo','voice_service_cost':0,'word_timing':'Wav2Vec2 CTC forced acoustic alignment','scenes':scenes},indent=2))
(P/'alignment_report.json').write_text(json.dumps(checks,indent=2))
print(f'Preview runtime {duration:.3f}s',flush=True)
