"""Local-only exact-text Kokoro synthesis. No previous-film audio is reused."""
from config import ROOT, VOICE_SETUP
import os, sys, json, re, hashlib
os.environ['HF_HOME'] = str(ROOT / 'cache')
os.environ['HF_HUB_OFFLINE'] = '1'
for dep in ['deps312','deps-torch','deps-compat']:
    sys.path.insert(0, str(VOICE_SETUP / dep))
import torch, numpy as np, soundfile as sf
from kokoro import KModel, KPipeline
torch.set_num_threads(4)
script = (ROOT/'narration.txt').read_text(encoding='utf-8').strip()
speed = float(sys.argv[1]) if len(sys.argv)>1 else 1.08
model = KModel(repo_id='hexgrad/Kokoro-82M', config=str(VOICE_SETUP/'models/config.json'), model=str(VOICE_SETUP/'models/kokoro-v1_0.pth')).eval()
pipeline = KPipeline(lang_code='b',repo_id='hexgrad/Kokoro-82M',model=model,device='cpu')
norm = lambda s: re.sub('[^a-z0-9]','',s.lower())
parts, sections, events = [], [], []
offset = .3
parts.append(np.zeros(7200,dtype=np.float32))
for i, paragraph in enumerate(script.split('\n\n')):
    arrays, tokens, local = [], [], 0
    for result in pipeline(paragraph,voice=str(VOICE_SETUP/'models/voices/bm_george.pt'),speed=speed):
        for token in result.tokens:
            if norm(token.text) and token.start_ts is not None:
                tokens.append(dict(text=token.text,start=local+token.start_ts,end=local+token.end_ts))
        a=result.audio.numpy(); arrays.append(a); local += len(a)/24000
    raw=np.concatenate(arrays)
    sf.write(ROOT/'narration'/f'raw-take-{i+1:02d}.wav',raw,24000,subtype='PCM_24')
    n=len(raw)//240; rms=np.sqrt(np.mean(raw[:n*240].reshape(n,240)**2,axis=1))
    nz=np.flatnonzero(rms>.0005)
    assert len(nz), 'Empty speech'
    left=max(0,int(nz[0]*240)-1440); right=min(len(raw),int((nz[-1]+1)*240)+2880)
    a=raw[left:right]
    words=re.findall(r"[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*[.,!?;:]*",paragraph)
    assert ''.join(map(norm,words)) == ''.join(norm(t['text']) for t in tokens), 'Narration word mismatch'
    spans=[]; pos=0
    for t in tokens:
        end=pos+len(norm(t['text'])); spans.append((pos,end,t)); pos=end
    pos=0
    for word in words:
        end=pos+len(norm(word)); hits=[t for lo,hi,t in spans if lo<end and hi>pos]
        start=max(0,hits[0]['start']-left/24000)
        finish=min(len(a)/24000,hits[-1]['end']-left/24000)
        assert finish>start, (word,start,finish)
        events.append(dict(text=word,start=offset+start,end=offset+finish)); pos=end
    dur=len(a)/24000
    sections.append(dict(index=i,text=paragraph,start=offset,end=offset+dur,trim_left_samples=left,trim_right_samples=len(raw)-right))
    parts.append(a); offset+=dur
    if i<4:
        parts.append(np.zeros(4800,dtype=np.float32)); offset+=.2
    print('paragraph',i+1,'ends',round(offset,2),flush=True)
audio=np.concatenate(parts)
sf.write(ROOT/'narration/george-narration.wav',audio,24000,subtype='PCM_24')
(ROOT/'narration/word_timings.json').write_text(json.dumps(events,indent=2))
(ROOT/'narration/sections.json').write_text(json.dumps(sections,indent=2))
(ROOT/'narration/voice-settings.json').write_text(json.dumps(dict(engine='Kokoro 82M / local PyTorch CPU',voice='bm_george',speed=speed,sample_rate=24000,duration=len(audio)/24000,script_sha256=hashlib.sha256((ROOT/'narration.txt').read_bytes()).hexdigest(),timings='Model-derived, not independent acoustic alignment',new_spending=0),indent=2))
print('Narration duration',len(audio)/24000,'words',len(events),flush=True)
