"""Audit actual export: decode, bounds, glyph colours, motion, audio and contact sheets."""
import bootstrap,json,subprocess,re,hashlib,math,bisect
from functools import lru_cache
from PIL import Image,ImageDraw,ImageStat,ImageChops
import numpy as np
import render as m
R=m.R;V=m.OUTPUT;O=R/'review';O.mkdir(exist_ok=True)
frames=round(m.DURATION*30);meta=subprocess.run([m.FF,'-hide_banner','-i',str(V)],capture_output=True,text=True).stderr
assert '1080x1920' in meta and '30 fps' in meta and '48000 Hz' in meta
h,mi,s=map(float,re.search(r'Duration: (\d+):(\d+):([\d.]+)',meta).groups());duration=h*3600+mi*60+s;assert abs(duration-m.DURATION)<=1/30
(O/'metadata.txt').write_text(meta)
geometry=json.loads((R/'geometry-audit.json').read_text());assert len(geometry)==frames
from captions import audit
for row in geometry:audit(row['boxes'])

@lru_cache(maxsize=80)
def masks(gi):
 out=[]
 for row,line in enumerate(m.CAP.lines(m.CAP.groups[gi])):
  x=80
  for w in line:
   tile=Image.new('L',(1080,1920));ImageDraw.Draw(tile).text((x,1380+row*92),w['text'],font=m.CAP.f,fill=255)
   mask=np.asarray(tile.resize((360,640),Image.Resampling.LANCZOS).crop((23,459,306,519)))>=200
   out.append((w,mask));x+=m.CAP.f.getlength(w['text']+' ')
 return out

samples={};times=set([.1,m.DURATION-.1])
for sc in m.SCENES:
 for q in [.2,.5,.9]:times.add(sc['start']+(sc['end']-sc['start'])*q)
for t in [s['start'] for s in m.SCENES[1:]]+m.CAP.starts[1:]:
 times.update([max(0,t-1/30),min(m.DURATION-1/30,t+1/30)])
indices={min(frames-1,round(t*30)) for t in times};issues=[];active_frames=0;blank_frames=[]
p=subprocess.Popen([m.FF,'-v','error','-xerror','-i',str(V),'-an','-vf','scale=360:640','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
for n in range(frames):
 raw=p.stdout.read(360*640*3);assert len(raw)==360*640*3,(n,'truncated frame')
 im=Image.frombytes('RGB',(360,640),raw);t=n/30;gi=max(0,bisect.bisect_right(m.CAP.starts,t)-1)
 ar=np.asarray(im.crop((23,459,306,519))).astype(np.int16)
 if np.mean(np.asarray(im))<1:blank_frames.append(n)
 active=False
 for w,mask in masks(gi):
  px=ar[mask];rr,gg,bb=px[:,0],px[:,1],px[:,2];is_active=w['start']<=t<w['end'];active|=is_active
  ok=(rr>170)&(gg>140)&(bb>75)&(rr-gg>12)&(gg-bb>25) if is_active else (rr>170)&(gg>165)&(bb>155)&(abs(rr-gg)<28)&(abs(gg-bb)<30)
  if np.mean(ok)<.7:issues.append(dict(frame=n,word=w['text'],active=is_active,colour_fraction=float(np.mean(ok))))
 if active:active_frames+=1
 if n in indices:samples[n]=im.copy()
assert p.wait()==0,p.stderr.read();assert not issues and not blank_frames,(issues[:5],blank_frames)
decode=subprocess.run([m.FF,'-v','error','-xerror','-i',str(V),'-progress','pipe:1','-f','null','-'],capture_output=True,text=True,check=True)
assert int(re.findall(r'frame=(\d+)',decode.stdout)[-1])==frames
levels=subprocess.run([m.FF,'-hide_banner','-i',str(V),'-vn','-af','volumedetect,silencedetect=noise=-40dB:d=0.7','-f','null','-'],capture_output=True,text=True,check=True).stderr
peak=float(re.search(r'max_volume: ([\-\d.]+) dB',levels)[1]);assert peak<0;(O/'audio-checks.txt').write_text(levels)
for silence_end, silence_duration in re.findall(r'silence_end: ([\d.]+) \| silence_duration: ([\d.]+)',levels):
 assert float(silence_end)>=m.DURATION-.05 or float(silence_duration)<=.7,'Unexpected internal audio gap'
def audio(path,normalized=False):
 cmd=[m.FF,'-v','error','-i',str(path)]+(['-af',f'atrim=duration={m.DURATION},loudnorm=I=-16:TP=-1.5:LRA=10'] if normalized else [])+['-ac','1','-ar','16000','-f','f32le','pipe:1']
 a=np.frombuffer(subprocess.run(cmd,capture_output=True,check=True).stdout,dtype='<f4');return np.sqrt(np.mean(a[:len(a)//160*160].reshape(-1,160)**2,axis=1))
a=audio(R/'mixed-audio.wav',True);b=audio(V);n=min(len(a),len(b));cor=float(np.corrcoef(a[:n],b[:n])[0,1]);assert cor>.98
motion=[]
for sc in m.SCENES:
 ims=[]
 for q in [.2,.75]:
  t=sc['start']+(sc['end']-sc['start'])*q;out=O/f'motion-{sc["index"]}-{q}.png'
  subprocess.run([m.FF,'-y','-v','error','-ss',str(t),'-i',str(V),'-frames:v','1','-vf','crop=816:1060:100:240,scale=300:390',str(out)],check=True);ims.append(Image.open(out).convert('RGB'))
 diff=sum(ImageStat.Stat(ImageChops.difference(*ims)).mean)/3;assert diff>1,(sc['index'],'no meaningful image-region motion')
 motion.append(dict(scene=sc['index'],imagery_only_pixel_change=diff))
# Contact sheets consist of actual decoded export frames, not design previews.
ids=sorted(samples)
for page in range(math.ceil(len(ids)/12)):
 sheet=Image.new('RGB',(1440,2010),'#132133');d=ImageDraw.Draw(sheet)
 for j,n in enumerate(ids[page*12:page*12+12]):
  x=j%4*360;y=j//4*670;sheet.paste(samples[n],(x,y+30));d.text((x+10,y+8),f'{n/30:.3f}s',fill='white')
 sheet.save(O/f'contact-{page+1:02}.jpg',quality=94)
words=json.loads((R/'word_timings.json').read_text());script=(R/'narration.txt').read_text();norm=lambda s:re.sub('[^a-z0-9]','',s.lower())
assert norm(script)==norm(''.join(w['text'] for w in words));assert words[-1]['end']<m.DURATION
result=dict(export_sha256=hashlib.sha256(V.read_bytes()).hexdigest(),duration=duration,width=1080,height=1920,fps=30,decoded_frames=frames,caption_colour_issues=issues,blank_frames=blank_frames,active_word_frames_checked=active_frames,every_frame_text_bounds_and_overlap_checked=True,every_frame_vector_shape_bounds_checked_during_render=True,peak_dbfs=peak,mixed_source_to_export_audio_correlation=cor,script_word_coverage=True,meaningful_scene_motion=motion,contact_sheets=math.ceil(len(ids)/12),new_spending=0,technical_checks_passed=True,full_quality_gate_passed=False,unperformed=['Continuous subjective audiovisual playback/listening','Independent phonetic word alignment','Physical phone and older-viewer testing'])
(R/'verification.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
