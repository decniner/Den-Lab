from pathlib import Path
import json,subprocess,math,hashlib,concurrent.futures,re,sys
from PIL import Image,ImageFont,ImageDraw
import imageio_ffmpeg
P=Path(__file__).resolve().parent;ROOT=P.parent;CFG=json.loads((P/'project.json').read_text());FPS=24;FF=imageio_ffmpeg.get_ffmpeg_exe();FONT=CFG.get('sans_font','/System/Library/Fonts/Supplemental/Arial.ttf')
def read(p):return json.loads(p.read_text())
def stamp(t):
 n=round(t*100);return f'{n//360000}:{n//6000%60:02d}:{n//100%60:02d}.{n%100:02d}'
def captions():
 t=read(P/'timing.json');ws=t['words'];f=ImageFont.truetype(FONT,42);phr=[];buf=[]
 for i,w in enumerate(ws):
  buf.append(w)
  if len(buf)>=9 or f.getlength(' '.join(z['text'] for z in buf))>1440 or re.search(r'[.!?][”\"]?$',w['text']) or i==len(ws)-1 or ws[i+1]['scene']!=w['scene']:
   phr.append(dict(words=buf,start=buf[0]['start'],end=buf[-1]['end']+.12));buf=[]
 for a,b in zip(phr,phr[1:]):a['end']=min(a['end'],b['start'])
 ass='''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,42,&H00433D23,&H00433D23,&H00D3E7F3,&H00D3E7F3,0,0,0,0,100,100,0,0,1,1,0,7,0,0,0,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
''';layouts=[];srt=[]
 for j,cap in enumerate(phr):
  width=sum(f.getlength(w['text']) for w in cap['words'])+12*(len(cap['words'])-1);assert width<1710;width=float(width);x=(1920-width)/2
  for w in cap['words']:
   ww=f.getlength(w['text']);layouts.append(dict(w,x=x,y=941,width=ww));assert x>=80 and x+ww<=1840
   for a,b,c in [(cap['start'],w['start'],'433D23'),(w['start'],w['end'],'3E59BB'),(w['end'],cap['end'],'433D23')]:
    if round(b*100)>round(a*100):ass+=f'Dialogue: 0,{stamp(a)},{stamp(b)},Default,,0,0,0,,'+'{'+f'\\pos({x:.2f},941)\\1c&H{c}&'+'}'+w['text']+'\n'
   x+=ww+12
  def sr(t):
   n=round(t*1000);return f'{n//3600000:02d}:{n//60000%60:02d}:{n//1000%60:02d},{n%1000:03d}'
  srt.append(f"{j+1}\n{sr(cap['start'])} --> {sr(cap['end'])}\n"+' '.join(w['text'] for w in cap['words'])+'\n')
 ass=ass.replace('Style: Default,Arial,42,','Style: Default,'+f.getname()[0]+',42,');(P/'captions.ass').write_text(ass);(P/'caption-layout.json').write_text(json.dumps(layouts,indent=2));(P/'phrases.json').write_text(json.dumps(phr,indent=2));(ROOT/'outputs/captions.srt').write_text('\n'.join(srt))
def renderone(s,proof=False):
 n=round(min(s['duration'],5 if proof else s['duration'])*FPS);artdir=P/CFG.get('asset_dir','assets');assets=[artdir/f"{s['id']:02d}-{name}.png" for name in ['base','middle','front','waves','type']];motion=artdir/f"{s['id']:02d}-motion.json";key=hashlib.sha256((motion.read_bytes() if motion.exists() else b'')+b''.join(p.read_bytes() for p in assets)+(P/'captions.ass').read_bytes()+json.dumps([s,n,'v6-noticeable-waves']).encode()).hexdigest()[:14];cache=P/'segments';cache.mkdir(exist_ok=True);out=cache/f"{s['id']:02d}-{key}.mp4"
 if out.exists():return out
 cmd=[FF,'-v','error','-y']
 for p in assets:cmd+=['-loop','1','-framerate',str(FPS),'-i',str(p)]
 # Distinct motion planes: a noticeable push, sailing cutouts, rolling waves,
 # and an itinerary cursor registered to the moving map plane.
 u=f"min(t/{max(s['duration']-.7,1)},1)"
 kind=s['kind'];is_map=kind in ['atlantic','crossing','islands','indian']
 if is_map:dx="10*sin(t*0.7)";dy="5*sin(t*0.8)"
 elif kind=='mactan':dx="0";dy="0"
 elif kind in ['opening','closing','legacy']:dx="45*sin(t*0.26)";dy="8*sin(t*0.75)"
 else:dx=f"80-160*{u}";dy="8*sin(t*0.75)"
 filt=f"[1:v]scale=3840:2160,zoompan=z='1+0.045*on/{max(n-1,1)}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1920x1080:fps=24[mid];[0:v][mid]overlay=0:0[a];[a][2:v]overlay=x='{dx}':y='{dy}':eval=frame[b];[3:v]scale=2100:1080[wave];[b][wave]overlay=x='90*sin(t*0.6)-90':y='4*sin(t*1.1)':eval=frame[c];[c][4:v]overlay=0:0[d]"
 motion=artdir/f"{s['id']:02d}-motion.json"
 if is_map and motion.exists():
  points=read(motion)['route_points'];lengths=[math.dist(a,b) for a,b in zip(points,points[1:])];total=sum(lengths);run=0;parts=[]
  for j,L in enumerate(lengths):
   begin=.7+run/total*(s['duration']-1.6);finish=.7+(run+L)/total*(s['duration']-1.6);parts.append((begin,finish,points[j],points[j+1]));run+=L
  def expr(axis):
   e=str(points[-1][axis])
   for a,b,p1,p2 in reversed(parts):e=f"if(lt(t,{b}),{p1[axis]}+({p2[axis]-p1[axis]})*max(0,min((t-{a})/{b-a},1)),{e})"
   # Map zoom is applied about the frame centre. Keep cursor on that plane.
   center=960 if axis==0 else 540
   return f"{center}+(({e})-{center})*(1+0.045*min(t/{s['duration']},1))-15"
  pin=P/'route-pin.png'
  if not pin.exists():
   im=Image.new('RGBA',(30,30));dr=ImageDraw.Draw(im);dr.ellipse((1,1,28,28),fill='#fff8e8');dr.ellipse((6,6,23,23),fill='#bb593e');im.save(pin)
  cmd+=['-loop','1','-framerate','24','-i',str(pin)]
  filt+=f";[d][5:v]overlay=x='{expr(0)}':y='{expr(1)}':eval=frame[e]"
 else:filt+=';[d]null[e]'
 filt+=f";color=c=0xf1e6cd:s=1920x1080:r=24,format=rgba[p];[e][p]overlay=x='-1920*min(t/0.6,1)':y=0:enable='lt(t,0.6)'[f];[f]setpts=PTS+{s['start']}/TB,ass={P/'captions.ass'},setpts=PTS-STARTPTS,format=yuv420p[v]"
 cmd+=['-filter_complex',filt,'-map','[v]','-frames:v',str(n),'-an','-c:v','libx264','-preset','veryfast','-crf','19','-threads','2','-filter_complex_threads','1','-r','24',str(out)]
 subprocess.run(cmd,check=True);print('Rendered',s['id'],flush=True);return out
if __name__=='__main__':
 captions();t=read(P/'timing.json');proof='--proof' in sys.argv
 if proof:
  out=renderone(t['scenes'][min(2,len(t['scenes'])-1)],True);subprocess.run([FF,'-v','error','-y','-i',str(out),'-ss',str(t['scenes'][min(2,len(t['scenes'])-1)]['start']),'-i',str(P/'master.wav'),'-map','0:v','-map','1:a','-t','5','-c:v','copy','-c:a','aac',str(P/'proof.mp4')],check=True);print(P/'proof.mp4');sys.exit()
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:outs=list(ex.map(renderone,t['scenes']))
 (P/'concat.txt').write_text(''.join("file '"+str(x)+"'\n" for x in outs));out=ROOT/'outputs'/(CFG['output_basename']+'.mp4')
 subprocess.run([FF,'-v','error','-y','-f','concat','-safe','0','-i',str(P/'concat.txt'),'-i',str(P/'master.wav'),'-map','0:v','-map','1:a','-c:v','copy','-af','loudnorm=I=-18:TP=-1.5:LRA=7','-c:a','aac','-b:a','160k','-movflags','+faststart',str(out)],check=True);print(out)
