import bootstrap,json,subprocess,math,sys
from pathlib import Path
from PIL import Image,ImageDraw
import imageio_ffmpeg
from scenes import load_timeline,scene
from captions import Captions,audit
from audio import mix
R=Path(__file__).resolve().parent;FF=imageio_ffmpeg.get_ffmpeg_exe();OUTPUT=R/'vector-finance-demo.mp4';FPS=30
SCENES,CUES,DURATION=load_timeline();CAP=Captions(json.loads((R/'word_timings.json').read_text()))

def frame(t):
 c,i=scene(t,SCENES,CUES)
 for box in c.shape_boxes:
  x,y,x2,y2=box;assert 64<=x<=x2<=916 and 70<=y<=y2<=1300,(i,t,box,'unsafe artwork')
 if i>0 and t-SCENES[i]['start']<.18:
  previous,_=scene(SCENES[i]['start']-1/30,SCENES,CUES)
  q=(t-SCENES[i]['start'])/.18
  paper=Image.new('RGB',c.im.size,'#ede7d9')
  from core import ease
  c.im=Image.blend(previous.im,paper,ease(q*2)) if q<.5 else Image.blend(paper,c.im,ease((q-.5)*2))
  c.d=ImageDraw.Draw(c.im,'RGBA')
 gi=CAP.draw(c,t);audit(c.text_boxes)
 return c,gi,i

def render():
 (R/'review').mkdir(exist_ok=True);mix(DURATION,CUES);CAP.sidecars(R,DURATION)
 geometry=[];frames=round(DURATION*FPS)
 cmd=[FF,'-y','-v','warning','-f','rawvideo','-pix_fmt','rgb24','-s','1080x1920','-r','30','-i','pipe:0','-i',str(R/'mixed-audio.wav'),'-map','0:v','-map','1:a','-af',f'atrim=duration={DURATION},loudnorm=I=-16:TP=-1.5:LRA=10','-frames:v',str(frames),'-c:v','libx264','-preset','veryfast','-crf','18','-threads','4','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',str(OUTPUT)]
 with (R/'render-log.txt').open('w') as log:
  p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=log)
  try:
   for n in range(frames):
    c,gi,i=frame(n/FPS);p.stdin.write(c.im.tobytes());geometry.append(dict(frame=n,scene=i,caption_group=gi,boxes=c.text_boxes))
    if n%150==149:print('Rendered',n+1,'of',frames,flush=True)
  finally:p.stdin.close()
  assert p.wait()==0,'FFmpeg render failed'
 (R/'geometry-audit.json').write_text(json.dumps(geometry));print(str(OUTPUT),flush=True)

if __name__=='__main__':
 if '--preview' in sys.argv:
  review=R/'review';review.mkdir(exist_ok=True);sheet=Image.new('RGB',(1080,2000),'#132133');d=ImageDraw.Draw(sheet)
  for j,s in enumerate(SCENES):
   t=s['start']+.65*(s['end']-s['start']);c,_,_=frame(t);im=c.im.resize((360,640));x=j%3*360;y=j//3*670;sheet.paste(im,(x,y+30));d.text((x+10,y+8),f'Scene {j+1} {t:.1f}s',fill='white')
  sheet.crop((0,0,1080,1340)).save(review/'design.jpg')
 else:render()
