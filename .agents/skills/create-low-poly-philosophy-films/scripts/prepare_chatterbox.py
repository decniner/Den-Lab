import json,os,random,time
from pathlib import Path
import numpy as np
import soundfile as sf
import torch
from chatterbox.tts_turbo import ChatterboxTurboTTS
from common import load_project
from narration import speech_key,file_digest
from setup_chatterbox import prepare

P=Path(os.environ['PHILOSOPHY_FILM_PROJECT']).resolve();cfg,rows=load_project(P)
torch.set_num_threads(cfg.get('tts_threads',2));torch.set_num_interop_threads(1)
model_dir,refs,manifest=prepare(P)
model_digest=json.dumps(manifest,sort_keys=True)
cache=P/'chatterbox_audio';cache.mkdir(exist_ok=True)
model=ChatterboxTurboTTS.from_local(model_dir,device='cpu')
voices={};conditionals={}
with torch.inference_mode():
    for speaker,default in [('HUMAN','peter_yearsley.wav'),('AI','caro_davy.wav')]:
        prefix=speaker.lower();reference=P/Path(cfg.get(prefix+'_reference',str(refs/default)))
        voices[speaker]=reference
        model.prepare_conditionals(str(reference),exaggeration=0.0);conditionals[speaker]=model.conds
    metadata=[]
    for i,row in enumerate(rows):
        reference=voices[row['who']]
        seed=int(cfg.get('chatterbox_seeds',{}).get(str(i),cfg.get('chatterbox_seed',107)+i))
        key=speech_key(row,model_digest,file_digest(reference),seed)
        out=cache/f'{i:02d}.wav';sidecar=out.with_suffix('.json')
        if not(out.exists() and sidecar.exists() and json.loads(sidecar.read_text()).get('fingerprint')==key and json.loads(sidecar.read_text()).get('sha256')==file_digest(out)):
            random.seed(seed);np.random.seed(seed);torch.manual_seed(seed)
            model.conds=conditionals[row['who']]
            wav=model.generate(row['text']).squeeze().detach().cpu().numpy()
            assert np.isfinite(wav).all() and np.sqrt(np.mean(wav**2))>.002
            if np.abs(wav).max()>.95:wav*=.95/np.abs(wav).max()
            sf.write(out,wav,model.sr,subtype='PCM_16')
            sidecar.write_text(json.dumps({'fingerprint':key,'sha256':file_digest(out),'seed':seed,'text':row['text'],'speaker':row['who'],'reference':str(reference)}))
        metadata.append(json.loads(sidecar.read_text()))
        print(f'Chatterbox turn {i+1}/{len(rows)} ready',flush=True)
(cache/'metadata.json').write_text(json.dumps(metadata,indent=2))
