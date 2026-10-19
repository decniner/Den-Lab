"""Painterly illustration reveal: derived pencil contours, then a color finish."""
from config import ROOT, FFMPEG
from prepare_artwork import fit_art, NAMES
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import json, math, random, bisect, subprocess, argparse

SIZE=(1920,1080); FPS=30; TIP=(4,43)
OUTPUT=ROOT/'output/ai-takeover-ghibli-inspired.mp4'
HEADINGS=['THE DAY AI TOOK CONTROL','THE BOARDROOM','NO SOLDIERS. NO WEAPONS. NO WARNING.','HUMAN AUTHORITY: REVOKED']
def smooth(q):
    q=max(0,min(1,q)); return q*q*(3-2*q)
def font(size,bold=False):
    return ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf' if bold else 'C:/Windows/Fonts/georgia.ttf',size)
def centered(d,text,y,size=32,color='#4d4234',bold=False,x=960):
    f=font(size,bold); b=d.textbbox((0,0),text,font=f); left=x-(b[2]-b[0])/2
    d.text((left,y),text,font=f,fill=color)
    return [left,y,left+b[2]-b[0],y+b[3]-b[1]]
def pencil_sprite():
    s=4; im=Image.new('RGBA',(24*s,48*s)); d=ImageDraw.Draw(im)
    def poly(points,c): d.polygon([(round(x*s),round(y*s)) for x,y in points],fill=c)
    poly([(5,36),(16,5),(20,6),(9,38)],'#a78448')
    poly([(6,36),(17,6),(18.3,6.3),(7.3,36.8)],'#d9b86a')
    poly([(5,36),(9,38),TIP],'#ddc49b'); poly([TIP,(4.5,40),(6.2,40.5)],'#30302e')
    poly([(16,5),(17,2),(21,3),(20,6)],'#a7807a')
    poly([(15.5,6.5),(16,5),(20,6),(19.5,7.5)],'#a9aaa3')
    im=im.resize((24,48),Image.Resampling.LANCZOS); im.save(ROOT/'artwork/pencil-no-hand.png'); return im
def prepare(name,duration):
    paths=json.loads((ROOT/'paths'/f'{name}.json').read_text()); rng=random.Random(NAMES.index(name)+719)
    weight=0
    for p in paths:
        cumulative=[0.]
        for a,b in zip(p['points'],p['points'][1:]): cumulative.append(cumulative[-1]+math.dist(a,b))
        p['cumulative']=cumulative; p['length']=cumulative[-1]
        p['weight']=max(p['length'],3)**.72*rng.uniform(.85,1.22)
        p['lift_weight']=rng.uniform(.6,1.6); weight+=p['weight']+p['lift_weight']
    scale=duration/weight; now=0
    for p in paths:
        p['start']=now; p['end']=now+p['weight']*scale; now=p['end']+p['lift_weight']*scale
    (ROOT/'paths'/f'{name}-schedule.json').write_text(json.dumps([{k:p[k] for k in ['start','end','length','group']} for p in paths],indent=2))
    return paths
def partial(p,q):
    distance=p['length']*smooth(q); i=min(len(p['points'])-2,bisect.bisect_right(p['cumulative'],distance)-1)
    a=p['points'][i]; b=p['points'][i+1]; span=p['cumulative'][i+1]-p['cumulative'][i]
    u=0 if span==0 else (distance-p['cumulative'][i])/span
    tip=(a[0]+u*(b[0]-a[0]),a[1]+u*(b[1]-a[1]))
    return [tuple(v) for v in p['points'][:i+1]]+[tip],tip
def line(image,p,points=None):
    ImageDraw.Draw(image).line(points or [tuple(v) for v in p['points']],fill=p['color'],width=2,joint='curve')
def camera(image,scale):
    if abs(scale-1)<.0001: return image
    scaled=image.resize((round(1920*scale),round(1080*scale)),Image.Resampling.BICUBIC)
    x=(scaled.width-1920)//2; y=(scaled.height-1080)//2
    return scaled.crop((x,y,x+1920,y+1080))

def render_scene(name,duration,out,prototype=False):
    index=NAMES.index(name); painting=fit_art(name); paper=painting.getpixel((0,0))
    # A very faint complete underdrawing preserves delicate facial detail;
    # only the darker pencil contours advance with the visible tool.
    edge=painting.convert('L').filter(ImageFilter.GaussianBlur(.55)).filter(ImageFilter.FIND_EDGES)
    edge=edge.point(lambda value:min(70,max(0,value-30)))
    ink=Image.composite(Image.new('RGB',SIZE,'#625746'),Image.new('RGB',SIZE,paper),edge)
    pencil=pencil_sprite(); drawing_end=duration*.47
    paths=prepare(name,drawing_end) if index<3 else []
    previous=fit_art(NAMES[0]) if index==3 else None
    done=0; n=round(duration*FPS); geometry=[]
    cmd=[FFMPEG,'-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgb24','-video_size','1920x1080','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out)]
    with (ROOT/'logs'/f'{name}{"-prototype" if prototype else ""}.log').open('wb') as log:
        proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=log)
        try:
            for frame in range(n):
                t=frame/FPS; tip=None; lift=False
                if index<3:
                    while done<len(paths) and paths[done]['end']<=t:
                        line(ink,paths[done])
                        done+=1
                    im=ink.copy()
                    if done<len(paths):
                        p=paths[done]
                        if t>=p['start']:
                            pts,tip=partial(p,(t-p['start'])/(p['end']-p['start'])); line(im,p,pts)
                        elif done>0:
                            a=paths[done-1]['points'][-1]; b=p['points'][0]
                            q=smooth((t-paths[done-1]['end'])/(p['start']-paths[done-1]['end']))
                            tip=(a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q-5*math.sin(math.pi*q)); lift=True
                    color=smooth((t-duration*.48)/(duration*.18))
                    if color: im=Image.blend(im,painting,color)
                    if tip: im.paste(pencil,(round(tip[0]-TIP[0]),round(tip[1]-TIP[1]-(2 if lift else 0))),pencil)
                    scale=1+.018*smooth((t-duration*.66)/(duration*.34)); im=camera(im,scale)
                else:
                    im=Image.blend(previous,painting,smooth(t/1.4))
                    im=camera(im,1.028-.028*smooth(t/duration))
                # Headings are native text over blank paper, separate from the painting.
                d=ImageDraw.Draw(im); d.rectangle((0,0,1919,73),fill=paper)
                box=centered(d,HEADINGS[index],22,28 if index==2 else 32,color='#7c3033' if index==3 else '#4d4234')
                assert 60<=box[0] and box[2]<=1860,box
                if index==1 and not prototype and t>duration*.7:
                    centered(d,'ACCESS DENIED',284,31,color='#f5dcd3',bold=True,x=1355)
                if index==2 and not prototype and t>duration*.7:
                    centered(d,'CONTROL',218,30,color='#f5dcd3',bold=True,x=1635)
                    centered(d,'REVOKED',265,30,color='#f5dcd3',bold=True,x=1635)
                if index==3:
                    d.rectangle((0,982,1919,1079),fill=paper)
                    if t>.65: box=centered(d,'WHAT HAPPENS WHEN AI NO LONGER OBEYS?',1007,35,color='#7c3033',bold=True)
                    assert box[0]>=60 and box[2]<=1860,box
                    fade=smooth((t-(duration-.75))/.75)
                    if frame==n-1: fade=1
                    if fade: im=Image.blend(im,Image.new('RGB',SIZE,'black'),fade)
                if prototype and frame in [0,30,60,90,120,149]: im.save(ROOT/'review'/f'prototype-{frame:03d}.png')
                proc.stdin.write(im.tobytes())
                if frame%90==0: print(name,frame,'/',n,flush=True)
        finally: proc.stdin.close()
        if proc.wait(): raise RuntimeError(f'FFmpeg failed; see {log.name}')
    print('Rendered',out,flush=True)

def mux(data):
    lines=["file '"+str(ROOT/'renders'/f'{name}.mp4').replace('\\','/')+"'" for name in NAMES]
    (ROOT/'renders/concat.txt').write_text('\n'.join(lines))
    subprocess.run([FFMPEG,'-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(ROOT/'renders/concat.txt'),'-i',str(ROOT/'narration/mixed-master.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-t',str(data['duration']),'-movflags','+faststart',str(OUTPUT)],check=True)
if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('mode',choices=['prototype','full','mux']); args=p.parse_args()
    if args.mode=='prototype': render_scene(NAMES[1],5,ROOT/'renders/boardroom-five-second-prototype.mp4',True)
    else:
        if not (ROOT/'review/prototype-review.json').exists(): raise RuntimeError('Inspect the actual pencil/color prototype before full rendering')
        data=json.loads((ROOT/'scene-timing.json').read_text())
        if args.mode=='full':
            for scene in data['scenes']: render_scene(scene['name'],scene['duration'],ROOT/'renders'/f'{scene["name"]}.mp4')
        mux(data)
