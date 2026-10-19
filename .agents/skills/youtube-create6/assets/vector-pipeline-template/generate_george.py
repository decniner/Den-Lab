"""Free local British George narration; preserve timestamps through acoustic tail trims."""
from pathlib import Path
import os,sys,json,re
R=Path(__file__).resolve().parent
SETUP=R.parent/'brutal-truth-money-kokoro-v4'
os.environ['HF_HOME']=str(R/'cache')
sys.path.insert(0,str(SETUP/'deps-torch'))
sys.path.append(str(SETUP/'deps312'))
sys.path.insert(0,str(SETUP/'deps-compat'))
import torch,numpy as np,soundfile as sf
torch.set_num_threads(4)
from kokoro import KModel,KPipeline
print('Loading local British George',flush=True)
m=KModel(repo_id='hexgrad/Kokoro-82M',config=str(SETUP/'models/config.json'),model=str(SETUP/'models/kokoro-v1_0.pth')).eval()
p=KPipeline(lang_code='b',repo_id='hexgrad/Kokoro-82M',model=m,device='cpu')
base_speed=float(sys.argv[1]) if len(sys.argv)>1 else .95
script=(R/'narration.txt').read_text(encoding='utf-8-sig')
paragraphs=script.strip().split('\n\n')
norm=lambda s:re.sub('[^a-z0-9]','',s.lower())
pieces=[];events=[];offset=0;sections=[]
(R/'takes').mkdir(exist_ok=True)
for index,paragraph in enumerate(paragraphs):
    # Debt and model amounts receive deliberate native slower synthesis.
    speed=max(.92,base_speed-.02) if index in [2,4] else base_speed
    tokens=[];audio=[];local=0
    for result in p(paragraph,voice=str(SETUP/'models/voices/bm_george.pt'),speed=speed):
        for t in result.tokens:
            if norm(t.text) and t.start_ts is not None:
                tokens.append(dict(text=t.text,start=local+t.start_ts,end=local+t.end_ts))
        a=result.audio.numpy();audio.append(a);local+=len(a)/24000
    raw=np.concatenate(audio)
    sf.write(R/'takes'/f'george-{base_speed:.2f}-section-{index+1}.wav',raw,24000,subtype='PCM_24')
    # Remove only outer model padding. Preserve quiet consonants with a low
    # threshold and protective margins; internal punctuation pauses stay intact.
    n=len(raw)//240
    rms=np.sqrt(np.mean(raw[:n*240].reshape(n,240)**2,axis=1))
    energetic=np.flatnonzero(rms>.0005)
    assert len(energetic)>0,'Empty speech take'
    first=int(energetic[0]*240);last=int((energetic[-1]+1)*240)
    left=max(0,first-1440);right=min(len(raw),last+2880)
    trimmed=raw[left:right]
    authored=re.findall(r"[A-Za-z0-9]+(?:['\u2019-][A-Za-z0-9]+)*[.,!?;:]*",paragraph)
    assert ''.join(map(norm,authored))==''.join(norm(t['text']) for t in tokens),(paragraph,tokens)
    spans=[];pos=0
    for t in tokens:
        end=pos+len(norm(t['text']));spans.append((pos,end,t));pos=end
    pos=0
    for word in authored:
        end=pos+len(norm(word));hits=[t for lo,hi,t in spans if lo<end and hi>pos]
        start=max(0,hits[0]['start']-left/24000)
        finish=min((last-left)/24000,hits[-1]['end']-left/24000)
        assert finish>start,(word,start,finish)
        events.append(dict(text=word,start=offset+start,end=offset+finish))
        pos=end
    duration=len(trimmed)/24000
    sections.append(dict(start=offset,end=offset+duration,text=paragraph,speed=speed,raw_duration=len(raw)/24000,trim_left_seconds=left/24000,trim_right_seconds=(len(raw)-right)/24000,acoustic_threshold_dbfs=20*np.log10(.0005),pause_after_seconds=.25 if index<len(paragraphs)-1 else 0))
    pieces.append(trimmed);offset+=duration
    if index<len(paragraphs)-1:
        pieces.append(np.zeros(6000,dtype=np.float32));offset+=.25
    print('Section',index+1,'end',round(offset,3),'speed',speed,flush=True)
a=np.concatenate(pieces)
sf.write(R/'george-narration.wav',a,24000,subtype='PCM_24')
(R/'word_timings.json').write_text(json.dumps(events,indent=2))
(R/'narration-sections.json').write_text(json.dumps(sections,indent=2))
(R/'voice-settings.json').write_text(json.dumps(dict(engine='Kokoro native PyTorch CPU',voice='bm_george',language='British English',base_speed=base_speed,amount_sections_speed=max(.92,base_speed-.02),duration=len(a)/24000,peak=float(abs(a).max()),timing_source='Native predicted phoneme durations shifted after logged outer-padding trims; ends capped to acoustic section end',subjective_listening_verified=False,new_spending=0),indent=2))
print('Complete George take:',len(a)/24000,'seconds;',len(events),'words',flush=True)
