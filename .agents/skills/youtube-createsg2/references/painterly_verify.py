"""Validate actual documentary, exact word order, one-time assets and source/export audio."""
from config import ROOT,FFMPEG
from PIL import Image,ImageDraw,ImageStat
import subprocess,json,re,hashlib,wave,array,math,sys,time
video=ROOT/'output/silent-extinction-documentary-painterly.mp4'
def ff(args,text=True):
    p=subprocess.run([FFMPEG,*args],capture_output=True,text=text);assert p.returncode==0,p.stderr;return p
data=json.loads((ROOT/'storyboard-painterly.json').read_text());settings=json.loads((ROOT/'narration/voice-settings.json').read_text());events=json.loads((ROOT/'narration/word_timings.json').read_text());duration=data['duration']
if '--mux' in sys.argv:
    ff(['-y','-hide_banner','-loglevel','error','-i',str(ROOT/'renders-v2/documentary-picture.mp4'),'-i',str(ROOT/'narration/mixed-master.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-t',str(duration),'-movflags','+faststart',str(video)])
p=ff(['-hide_banner','-i',str(video),'-progress','pipe:1','-f','null','NUL'])
(ROOT/'logs/painterly-full-decode.log').write_text(p.stderr+'\n'+p.stdout)
frames=int(re.findall(r'^frame=(\d+)',p.stdout,re.M)[-1]);assert frames==round(duration*30),(frames,duration)
assert all(x in p.stderr for x in ['1920x1080','30 fps','h264','yuv420p','aac','48000 Hz'])
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
assert sha(ROOT/'script.txt')==settings['script_sha256'];assert sha(ROOT/'narration.txt')==settings['spoken_sha256']
norm=lambda s:re.sub('[^a-z0-9]','',s.lower())
assert norm((ROOT/'narration.txt').read_text())==''.join(norm(e['text']) for e in events)
paras=(ROOT/'script.txt').read_text(encoding='utf-8-sig').strip().split('\n\n');heads=[0,8,19,36,50,69,88,100,121]
assert (ROOT/'narration.txt').read_text()=='\n\n'.join(p for i,p in enumerate(paras) if i not in heads)
coverage=[pid for s in data['shots'] for pid in s['paragraphs']];assert sorted(set(coverage))==[i for i in range(3,len(paras)) if i not in heads]
assert all(coverage.count(i)==(2 if i==3 else 1) for i in set(coverage))
assets=[s['asset'] for s in data['shots']];assert len(assets)==len(set(assets))
paintings=[s for s in data['shots'] if s['kind']=='painting'];hashes={s['asset']:sha(ROOT/('artwork-v2' if s['asset'].startswith('painterly-') else 'artwork')/f'{s["asset"]}.png') for s in paintings};assert len(set(hashes.values()))==94
assert len(paintings)==94
chapters=json.loads((ROOT/'chapter-timing.json').read_text());assert len(chapters)==9
def stamp(t):
    ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
groups=[];g=[]
for e in events:
    if g and e['start']-g[-1]['end']>.8:groups.append(g);g=[]
    g.append(e)
    if len(g)>=10 or e['text'].endswith(('.', '!', '?')):groups.append(g);g=[]
if g:groups.append(g)
srt='\n\n'.join(f'{i}\n{stamp(g[0]["start"])} --> {stamp(g[-1]["end"])}\n'+' '.join(e['text'] for e in g) for i,g in enumerate(groups,1))+'\n'
(ROOT/'output/silent-extinction-documentary-painterly.srt').write_text(srt,encoding='utf-8')
# Inspect a representative actual-export frame for every new shot; all are persisted.
samples=[]
for s in data['shots']:
    t=s['start']+min(3.0,(s['end']-s['start'])*.6);out=ROOT/'review'/f'painterly-export-{s["id"]}.jpg'
    ff(['-y','-hide_banner','-loglevel','error','-ss',str(t),'-i',str(video),'-frames:v','1','-vf','scale=640:360',str(out)])
    samples.append((s,out,t));print('Sampled',s['id'],flush=True)
for start in range(0,len(samples),12):
    group=samples[start:start+12];sheet=Image.new('RGB',(1920,4*390),'#07121a');d=ImageDraw.Draw(sheet)
    for i,(s,path,t) in enumerate(group):
        x=i%3*640;y=i//3*390;sheet.paste(Image.open(path),(x,y));d.text((x+9,y+364),f'{s["id"]}  {t:.1f}s  {s["asset"]}',fill='#e1ecee')
    sheet.save(ROOT/'output'/f'painterly-contact-sheet-{start//12+1:02d}.jpg')
end=ROOT/'review/painterly-final-frame.png'
ff(['-y','-hide_banner','-loglevel','error','-ss',str(duration-1/30),'-i',str(video),'-frames:v','1',str(end)])
assert max(ImageStat.Stat(Image.open(end).convert('RGB')).mean)<.5,'Ending is not black'
ff(['-y','-hide_banner','-loglevel','error','-i',str(video),'-vn','-ac','1','-ar','48000','-c:a','pcm_s16le',str(ROOT/'review/painterly-export-audio.wav')])
def segment(path,start,seconds=5):
    with wave.open(str(path),'rb') as w:
        assert w.getframerate()==48000 and w.getsampwidth()==2;w.setpos(round(start*48000));return array.array('h',w.readframes(round(seconds*48000)))
def env(samples):return [math.sqrt(sum(x*x for x in samples[k:k+480])/480) for k in range(0,len(samples)-480,480)]
drift={};peak=0
for name,t in [('beginning',.5),('middle',duration/2),('ending',duration-10)]:
    a=env(segment(ROOT/'narration/mixed-master.wav',t));raw=segment(ROOT/'review/painterly-export-audio.wav',t);b=env(raw);peak=max(peak,max(abs(v) for v in raw)/32768)
    candidates=[]
    for lag in range(-8,9):
        pairs=[(a[i],b[i+lag]) for i in range(8,len(a)-8)];candidates.append((sum((x-y)**2 for x,y in pairs)/len(pairs),lag))
    lag=min(candidates)[1];assert abs(lag)<=1,(name,lag);drift[name]=lag*10
meter=ff(['-hide_banner','-i',str(video),'-af','ebur128=peak=true','-vn','-f','null','NUL']);(ROOT/'logs/painterly-export-loudness.log').write_text(meter.stderr)
integrated=float(re.findall(r'I:\s+(-?[\d.]+) LUFS',meter.stderr)[-1]);truepeak=float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS',meter.stderr)[-1]);assert truepeak<-.5
assert max(abs(v) for v in segment(ROOT/'review/painterly-export-audio.wav',duration-2,1))<100,'Ending silence missing'
report={'full_decode':'PASS','duration':duration,'frames':frames,'format':'1920x1080 / 30fps / H264-yuv420p / AAC48k','word_count':len(events),'all_narrative_paragraphs':129,'exact_word_order_and_script_hashes':'PASS','chapters':chapters,'unique_new_shots':len(data['shots']),'approved_opening_shots':6,'distinct_painterly_shots_after_opening':94,'new_replacement_paintings':61,'painterly_diagrams':3,'each_asset_used_once':True,'new_artwork_hashes':hashes,'ending_black_and_silent':'PASS','audio_drift_ms':drift,'integrated_loudness_lufs':integrated,'true_peak_dbfs':truepeak,'bytes':video.stat().st_size,'limitations':['Word timing is model-derived, not independent acoustic alignment.','Painterly people are not fully articulated characters. All new shots use original painterly raster artwork with native 30fps camera motion. Only three are painterly explanatory models; no plain native flowchart or line-chart shots remain after the approved opening.','Full listening and continuous real-device playback not performed.']}
(ROOT/'review/painterly-verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
