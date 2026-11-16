from pathlib import Path
import json,subprocess,re,math,hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageOps
import imageio_ffmpeg
P=Path(__file__).resolve().parent;O=P.parent/'outputs';CFG=json.loads((P/'project.json').read_text());V=O/(CFG['output_basename']+'.mp4');FF=imageio_ffmpeg.get_ffmpeg_exe();T=json.loads((P/'timing.json').read_text());VIDEO_HASH=hashlib.sha256(V.read_bytes()).hexdigest();C=P/'checks'/VIDEO_HASH[:16];C.mkdir(parents=True,exist_ok=True)
# Decode every frame, retaining ffmpeg's authoritative stream metadata and count.
r=subprocess.run([FF,'-hide_banner','-i',str(V),'-map','0:v','-vf','blackdetect=d=0.04:pix_th=0.10','-an','-f','null','-'],stderr=subprocess.PIPE,text=True);assert r.returncode==0
log=r.stderr;assert 'black_start:' not in log;frames=int(re.findall(r'frame=\s*(\d+)',log)[-1]);expected=round(T['duration']*24);assert frames==expected,(frames,expected);assert '1920x1080' in log and '24 fps' in log and 'h264' in log and 'aac' in log
layouts=json.loads((P/'caption-layout.json').read_text());words=T['words'];assert [w['text'] for w in words]==[w for s in T['scenes'] for w in s['narration'].split()];assert [w['text'] for w in layouts]==[w['text'] for w in words]
assert all(0<=w['start']<w['end']<=T['duration'] for w in words);assert all(a['end']<=b['start']+.000001 for a,b in zip(words,words[1:]));assert all(w['x']>=80 and w['x']+w['width']<=1840 and w['y']+52<=1005 for w in layouts)
# Actual exported audio, not just source WAV.
r=subprocess.run([FF,'-v','error','-i',str(V),'-map','0:a','-f','f32le','-ac','1','-ar','24000','-'],stdout=subprocess.PIPE,check=True);audio=np.frombuffer(r.stdout,np.float32);assert abs(len(audio)/24000-T['duration'])<.1
r=subprocess.run([FF,'-v','error','-i',str(P/'master.wav'),'-f','f32le','-ac','1','-ar','24000','-'],stdout=subprocess.PIPE,check=True);src=np.frombuffer(r.stdout,np.float32)
correlations=[]
for f in [.07,.28,.52,.79,.94]:
 a=round(f*len(src));n=24000*3;aa=audio[a:a+n];bb=src[a:a+n];corr=float(np.corrcoef(aa,bb)[0,1]);assert corr>.98,corr;correlations.append(corr)
peak=float(np.max(np.abs(audio)));assert peak<1
# Actual encoded scene frames: middle/end pair tests motion without captions/header changing pixels.
entries=[];motions=[];highlights=[]
def sample(tm,name):
 path=C/(name+'-'+str(round(tm*1000))+'.png')
 if not path.exists():subprocess.run([FF,'-v','error','-y','-ss',str(tm),'-i',str(V),'-frames:v','1',str(path)],check=True)
 return Image.open(path).convert('RGB')
for s in T['scenes']:
 im=sample(s['start']+s['duration']*.34,f"scene-{s['id']:02d}-a");im2=sample(s['start']+s['duration']*.77,f"scene-{s['id']:02d}-b");a=np.asarray(im.crop((90,270,1830,875)),np.float32);b=np.asarray(im2.crop((90,270,1830,875)),np.float32);delta=float(np.mean(abs(a-b)));assert delta>.04,(s['id'],delta);motions.append(dict(scene=s['id'],mean_absolute_artwork_difference=delta));entries.append((s,im))
 # Pick a sufficiently long word and sample inside its quantized highlight.
 ww=[w for w in words if w['scene']==s['id'] and w['end']-w['start']>.2];w=ww[len(ww)//2];tm=(w['start']+w['end'])/2;cap=sample(tm,f"highlight-{s['id']:02d}");a=np.asarray(cap)[938:1000,80:1840];mask=(a[:,:,0]>120)&(a[:,:,0]>a[:,:,1]*1.35)&(a[:,:,1]>a[:,:,2]*1.1);n=int(mask.sum());assert n>12,(s['id'],n);highlights.append(dict(scene=s['id'],word=w['text'],warm_highlight_pixels=n))
for page in range(math.ceil(len(entries)/12)):
 canvas=Image.new('RGB',(1600,4*330),'#e6d8bd');draw=ImageDraw.Draw(canvas)
 for j,(s,im) in enumerate(entries[page*12:(page+1)*12]):
  x=j%3*533;y=j//3*330;im=im.resize((533,300));canvas.paste(im,(x,y));draw.text((x+8,y+305),f"{s['id']:02d} {s['kind']}",fill='#233d43')
 canvas.save(C/f'encoded-scenes-{page+1}.jpg',quality=94)
report=dict(status='passed',duration_seconds=T['duration'],frame_count=frames,dimensions=[1920,1080],fps=24,video_codec='H264',audio_codec='AAC',voice=T['voice'],tts_speed=T['speed'],scenes=len(T['scenes']),spoken_caption_words=len(words),exact_caption_coverage=True,text_and_caption_bounds=True,audio_duration=len(audio)/24000,audio_sample_peak=peak,audio_waveform_correlations=correlations,scene_motion_samples=motions,active_word_samples=highlights,full_video_decode=True,no_black_frames=True,sha256=hashlib.sha256(V.read_bytes()).hexdigest(),credit_based_generation_services_used=False,limitations='Simplified route/period representations. Technical timing follows Kokoro tokens; not independent phonetic alignment or full subjective listening. Encoded scene contact sheets require visual inspection.')
(O/'verification.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k not in ['scene_motion_samples','active_word_samples']}))
