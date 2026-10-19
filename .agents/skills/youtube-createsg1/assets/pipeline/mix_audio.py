"""Original procedural sound design. Runs in the local Python 3.12 voice runtime."""
from config import ROOT, VOICE_SETUP, FFMPEG
import sys, json, subprocess
for dep in ['deps312','deps-torch','deps-compat']: sys.path.insert(0,str(VOICE_SETUP/dep))
import numpy as np, soundfile as sf
data=json.loads((ROOT/'scene-timing.json').read_text())
sr=24000; n=round(data['duration']*sr); t=np.arange(n)/sr
voice,rate=sf.read(ROOT/'narration/george-narration.wav'); assert rate==sr
v=np.zeros(n); v[:len(voice)]=voice
v*=.80/max(.01,float(abs(v).max()))
rng=np.random.default_rng(27)
noise=rng.normal(0,1,n)
room=np.convolve(noise,np.ones(24)/24,mode='same')*.0015
tension=(np.sin(2*np.pi*55*t)+.5*np.sin(2*np.pi*82.41*t)+.25*np.sin(2*np.pi*110.1*t))*.006
fx=np.zeros(n)
def add_alert(when):
    count=int(.22*sr); a=np.arange(count)/sr
    beep=np.sin(2*np.pi*(490+240*a)*a)*np.sin(np.pi*a/.22)**2*.018
    idx=int(when*sr); end=min(n,idx+count); fx[idx:end]+=beep[:end-idx]
for s in data['scenes']:
    if s['name']=='scene04-final': continue
    a=int((s['start']+.1)*sr); b=min(n,int((s['start']+s['drawing_duration'])*sr))
    m=b-a; local=np.arange(m)/sr
    scratch=rng.normal(0,1,m); scratch=np.convolve(scratch,np.ones(6)/6,mode='same')
    scratch-=np.convolve(scratch,np.ones(90)/90,mode='same')
    gate=(np.sin(2*np.pi*7.3*local+.4)>.1).astype(float)
    gate=np.convolve(gate,np.ones(120)/120,mode='same')
    fx[a:b]+=scratch*gate*.005
    add_alert(s['start']+.08) if s['name']=='scene03-takeover' else None
    if s['name']=='scene02-boardroom': add_alert(s['start']+s['duration']*.7)
    # short original felt-marker tap at scene opening
    idx=int(s['start']*sr); count=int(.028*sr)
    tap=rng.normal(0,1,count)*np.exp(-np.arange(count)/(sr*.004))*.008
    fx[idx:idx+count]+=tap[:min(count,n-idx)]
# Envelope-based ducking keeps narration clear.
window=480; padded=np.pad(v,(0,(-len(v))%window)); rms=np.sqrt(np.mean(padded.reshape(-1,window)**2,axis=1))
envelope=np.interp(np.arange(n),np.arange(len(rms))*window,rms)
duck=1/(1+18*envelope)
mix=v+(room+tension+fx)*duck
fade=np.minimum(1,t/.4)*np.minimum(1,np.maximum(0,(data['duration']-t)/.8))
mix*=fade
sf.write(ROOT/'narration/mix-24k.wav',mix,sr,subtype='PCM_24')
subprocess.run([FFMPEG,'-y','-hide_banner','-loglevel','error','-i',str(ROOT/'narration/mix-24k.wav'),'-af','loudnorm=I=-16:TP=-1.5:LRA=7','-ar','48000',str(ROOT/'narration/mixed-master.wav')],check=True)
(ROOT/'narration/sound-design.json').write_text(json.dumps(dict(original_procedural_audio=True,seed=27,marker_noise='Filtered noise gated into short strokes',room_tone='Filtered low-level noise',tension='Original 55/82.41/110.1 Hz drone',ducking='Voice-RMS based',master='FFmpeg loudnorm -16 LUFS / -1.5 dBTP / 48 kHz'),indent=2))
print('Mixed narration and original sound design',data['duration'],'seconds',flush=True)
