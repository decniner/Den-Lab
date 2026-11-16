from pathlib import Path
import os,json,re,hashlib
os.environ.pop('HF_HUB_OFFLINE',None);os.environ['TOKENIZERS_PARALLELISM']='false'
import torch,numpy as np,soundfile as sf
from kokoro import KPipeline
P=Path(__file__).parent;CFG=json.loads((P/'project.json').read_text());VOICE=CFG['voice'];SPEED=CFG['speed'];MODEL=CFG['model_id'];torch.set_num_threads(4);pipe=KPipeline(lang_code=CFG['language'],repo_id=MODEL,device='cpu');scenes=json.loads((P/'scenes.json').read_text());cache=P/'narration-cache';cache.mkdir(exist_ok=True)
def norm(s):return ''.join(c.lower() for c in s if c.isalnum())
words=[];parts=[];offset=0
for s in scenes:
 text=s['narration'];key=hashlib.sha256(json.dumps([text,VOICE,SPEED,MODEL,CFG['language']]).encode()).hexdigest()[:18];wav=cache/(key+'.wav');tim=cache/(key+'.json')
 if not wav.exists():
  aa=[];tokens=[];off=0
  for r in pipe(text,voice=VOICE,speed=SPEED,split_pattern=None):
   a=r.audio.numpy();aa.append(a)
   for t in r.tokens:
    if t.start_ts is not None and t.end_ts is not None:tokens.append(dict(text=t.text,start=off+t.start_ts,end=off+t.end_ts))
    elif tokens and not t.phonemes:tokens[-1]['text']+=t.text
   off+=len(a)/24000
  a=np.concatenate(aa);chars=[]
  for t in tokens:
   n=norm(t['text'])
   for j,c in enumerate(n):chars.append((c,t['start']+(t['end']-t['start'])*j/len(n),t['start']+(t['end']-t['start'])*(j+1)/len(n)))
  assert ''.join(c[0] for c in chars)==norm(text)
  ww=[];pos=0
  for raw in text.split():
   n=len(norm(raw));ww.append(dict(text=raw,start=chars[pos][1],end=chars[pos+n-1][2]));pos+=n
  sf.write(wav,a,24000,subtype='FLOAT');tim.write_text(json.dumps(ww))
 a,sr=sf.read(wav,dtype='float32');ww=json.loads(tim.read_text());assert [w['text'] for w in ww]==text.split()
 lead=.7;tail=.9;raw=np.concatenate([np.zeros(round(lead*24000),np.float32),a,np.zeros(round(tail*24000),np.float32)]);raw=np.pad(raw,(0,(-len(raw))%1000))
 s.update(start=offset,end=offset+len(raw)/24000,duration=len(raw)/24000,first_word=len(words));words.extend(dict(w,start=w['start']+offset+lead,end=w['end']+offset+lead,scene=s['id']) for w in ww);parts.append(raw);offset=s['end'];print('Narrated',s['id'],round(s['duration'],2),flush=True)
master=np.concatenate(parts);sf.write(P/'master.wav',master,24000,subtype='PCM_16');(P/'timing.json').write_text(json.dumps(dict(scenes=scenes,words=words,duration=offset,voice=VOICE,speed=SPEED),ensure_ascii=False,indent=2));print('Complete',offset,len(words),flush=True)
