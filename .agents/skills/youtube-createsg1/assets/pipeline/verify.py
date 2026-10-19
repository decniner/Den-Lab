"""Audit the actual encoded film, narration coverage, sound drift and frame samples."""
from config import ROOT, FFMPEG
from PIL import Image, ImageDraw, ImageFont
import subprocess, json, re, hashlib, wave, array, math

video=ROOT/'output/ai-takeover-ghibli-inspired.mp4'
data=json.loads((ROOT/'scene-timing.json').read_text())
result=subprocess.run([FFMPEG,'-hide_banner','-v','info','-i',str(video),'-progress','pipe:1','-nostats','-f','null','NUL'],capture_output=True,text=True)
(ROOT/'logs/final-full-decode.log').write_text(result.stderr+'\n'+result.stdout,encoding='utf-8')
assert result.returncode==0,result.stderr
frames=[int(x) for x in re.findall(r'^frame=(\d+)',result.stdout,re.M)]
assert frames and frames[-1]==round(data['duration']*30),frames
for required in ['Video: h264','1920x1080','30 fps','yuv420p','Audio: aac','48000 Hz']:
    assert required in result.stderr,required

script=(ROOT/'narration.txt').read_text(encoding='utf-8').strip()
events=json.loads((ROOT/'narration/word_timings.json').read_text())
expected=re.findall(r"[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*[.,!?;:]*",script)
assert expected==[e['text'] for e in events], 'Exact word coverage mismatch'
assert all(0<=e['start']<e['end']<=data['narration_end'] for e in events)
assert all(a['start']<=b['start'] for a,b in zip(events,events[1:]))
voice_meta=json.loads((ROOT/'narration/voice-settings.json').read_text())
assert voice_meta['script_sha256']==hashlib.sha256((ROOT/'narration.txt').read_bytes()).hexdigest()

def stamp(t):
    v=round(t*1000); return f'{v//3600000:02d}:{v//60000%60:02d}:{v//1000%60:02d},{v%1000:03d}'
chunks=[]
for i in range(0,len(events),6):
    words=events[i:i+6]; start=words[0]['start']; end=words[-1]['end']
    if i+6<len(events): end=min(end,events[i+6]['start'])
    chunks.append(f'{len(chunks)+1}\n{stamp(start)} --> {stamp(end)}\n'+ ' '.join(e['text'] for e in words))
(ROOT/'output/narration.srt').write_text('\n\n'.join(chunks)+'\n',encoding='utf-8')

def read_audio(path):
    with wave.open(str(path),'rb') as w:
        assert w.getframerate()==48000 and w.getnchannels()==1 and w.getsampwidth()==2
        samples=array.array('h',w.readframes(w.getnframes()))
    return samples
subprocess.run([FFMPEG,'-y','-hide_banner','-loglevel','error','-i',str(video),'-vn','-ac','1','-ar','48000','-c:a','pcm_s16le',str(ROOT/'review/decoded-export-audio.wav')],check=True)
source=read_audio(ROOT/'narration/mixed-master.wav'); decoded=read_audio(ROOT/'review/decoded-export-audio.wav')
def rms_env(samples):
    return [math.sqrt(sum(float(v)*v for v in samples[i:i+480])/480) for i in range(0,len(samples)-479,480)]
a=rms_env(source); b=rms_env(decoded)
def corr(x,y):
    mx=sum(x)/len(x); my=sum(y)/len(y)
    dx=[v-mx for v in x]; dy=[v-my for v in y]
    return sum(u*v for u,v in zip(dx,dy))/max(1e-20,math.sqrt(sum(u*u for u in dx)*sum(v*v for v in dy)))
align=[]
for start in [100,1050,2050]:
    scores=[]
    for shift in range(-2,3): scores.append((corr(a[start:start+400],b[start+shift:start+shift+400]),shift))
    value,lag=max(scores)
    align.append(dict(start_seconds=start/100,lag_ms=lag*10,correlation=value))
    assert abs(lag)<=1 and value>.99,align[-1]
peak=max(abs(v) for v in decoded)/32768
assert peak<.98,peak

sample_times=[1.5,5.5,8.0,12.5,15.8,19.0,23.5,26.0,29.0]
sheet=Image.new('RGB',(1920,1080),'#faf9f5'); sheet_draw=ImageDraw.Draw(sheet)
label=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',18)
for i,t in enumerate(sample_times):
    path=ROOT/'review'/f'export-{t:05.1f}.png'
    subprocess.run([FFMPEG,'-y','-hide_banner','-loglevel','error','-ss',str(t),'-i',str(video),'-frames:v','1',str(path)],check=True)
    im=Image.open(path).convert('RGB').resize((640,360),Image.Resampling.LANCZOS)
    x=(i%3)*640; y=(i//3)*360; sheet.paste(im,(x,y))
    sheet_draw.rectangle((x+8,y+8,x+81,y+36),fill='#faf9f5')
    sheet_draw.text((x+14,y+11),f'{t:.1f}s',fill='#252525',font=label)
sheet.save(ROOT/'output/contact-sheet.png')
subprocess.run([FFMPEG,'-y','-hide_banner','-loglevel','error','-ss',str(data['duration']-1/30),'-i',str(video),'-frames:v','1',str(ROOT/'review/final-frame.png')],check=True)
last=Image.open(ROOT/'review/final-frame.png').convert('RGB')
assert max(last.getextrema()[0]+last.getextrema()[1]+last.getextrema()[2])<8,'Final frame not black'

info=dict(technical_checks='PASS',full_decode_exit_code=result.returncode,video_frames=frames[-1],duration_seconds=data['duration'],video='H.264 / yuv420p / 1920x1080 / 30 fps',audio='AAC / 48000 Hz',narration_words=len(events),exact_source_word_coverage=True,script_sha256=voice_meta['script_sha256'],audio_envelope_alignment=align,decoded_audio_peak_dbfs=20*math.log10(peak),final_frame_black=True,bytes=video.stat().st_size,sha256=hashlib.sha256(video.read_bytes()).hexdigest(),premium_artwork_gate='Sampled visual review: detailed coherent generated painterly artwork; exact Studio Ghibli studio identity not established',realistic_hand='Unavailable; tiny virtual pencil only',drawing_physics='Faint pre-existing underdrawing, accelerated derived contour reveal and separate soft color finish; not original artist brush strokes or fully articulated character animation',subjective_listening='UNVERIFIED',full_human_playback='UNVERIFIED',independent_acoustic_word_alignment='UNVERIFIED',real_device_review='UNVERIFIED')
(ROOT/'review/verification.json').write_text(json.dumps(info,indent=2))
print(json.dumps(info,indent=2))
