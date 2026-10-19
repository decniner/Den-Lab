"""Subtle original synthesized drawing, transfer and reveal effects; no licensed music."""
import bootstrap,json,wave,subprocess,math
import numpy as np
from pathlib import Path
import imageio_ffmpeg
R=Path(__file__).resolve().parent;FF=imageio_ffmpeg.get_ffmpeg_exe()

def mix(duration,cues):
 sr=48000
 raw=subprocess.run([FF,'-v','error','-i',str(R/'george-narration.wav'),'-ac','1','-ar',str(sr),'-f','f32le','pipe:1'],capture_output=True,check=True).stdout
 voice=np.frombuffer(raw,dtype='<f4');a=np.zeros(round(duration*sr),np.float64);a[:len(voice)]=voice
 rng=np.random.default_rng(821);events=[]
 for key in ['loan','rate','interest','growth','call','basis','nickname']:
  start=cues[key];seconds=.26 if key!='loan' else .38;n=round(seconds*sr);t=np.arange(n)/sr
  # Drawing texture/soft sine ping; peak kept far below the narrator.
  noise=rng.normal(0,1,n);smooth=np.convolve(noise,np.ones(12)/12,mode='same')
  tone=np.sin(2*np.pi*(410 if key in ['loan','interest'] else 680)*t)
  fx=(smooth*.002+tone*.002)*np.sin(np.pi*t/seconds)**2
  i=round(start*sr);a[i:i+n]+=fx[:max(0,min(n,len(a)-i))]
  events.append(dict(cue=key,start=start,duration=seconds,peak=float(abs(fx).max())))
 assert abs(a).max()<1,'Pre-encode clipping'
 with wave.open(str(R/'mixed-audio.wav'),'wb') as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr);f.writeframes((np.clip(a,-1,1)*32767).astype('<i2').tobytes())
 (R/'sound-events.json').write_text(json.dumps(dict(original_procedural_effects=True,music=False,events=events),indent=2))
