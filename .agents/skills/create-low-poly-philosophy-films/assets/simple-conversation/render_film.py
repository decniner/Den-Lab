import json,math,subprocess,sys,random
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import os
from common import load_project
from narration import active_word
P=Path(os.environ['PHILOSOPHY_FILM_PROJECT']).resolve()
cfg,dialogue=load_project(P)
W,H=720,1280
FPS=cfg['fps']
INK=(39,49,58); GREY=(125,137,146); FAINT=(210,219,224); ACC=(28,145,164)
sans='/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf'
serif='/usr/share/fonts/opentype/urw-base35/P052-Roman.otf'
sans=cfg.get('sans_font',sans);serif=cfg.get('serif_font',serif)
font=ImageFont.truetype(sans,34); small=ImageFont.truetype(sans,18); tiny=ImageFont.truetype(sans,15)
captionfont=ImageFont.truetype(sans,cfg.get('caption_font_size',44))
titlefont=ImageFont.truetype(serif,62); mid=ImageFont.truetype(serif,40)
data=json.loads((P/'scenes.json').read_text()); scenes=data['scenes']; DUR=data['duration']
rng=np.random.default_rng(41)
stars=rng.normal(size=(260,3)); stars/=np.linalg.norm(stars,axis=1)[:,None]; stars*=rng.uniform(.2,1.0,(260,1))
bg=np.zeros((H,W,3),np.uint8)
for y in range(H):
    v=int(252-7*math.exp(-((y-660)/320)**2)); bg[y,:,:]=(v,v+min(1,255-v),v+min(2,255-v))
BASE=Image.fromarray(bg)
def ease(x): x=max(0,min(1,x)); return x*x*(3-2*x)
def txt(d,xy,text,f=small,fill=INK,anchor='mm'):
    d.text(xy,text,font=f,fill=fill,anchor=anchor)
def line(d,pts,fill=INK,width=2): d.line(pts,fill=fill,width=width,joint='curve')
def ring(d,c,r,fill=FAINT,width=2):
    x,y=c; d.ellipse((x-r,y-r,x+r,y+r),outline=fill,width=width)
def wrap(text,f,width):
    out=[]; cur=''
    for w in text.split():
        trial=(cur+' '+w).strip()
        if f.getlength(trial)>width and cur: out.append(cur);cur=w
        else: cur=trial
    if cur: out.append(cur)
    return out
def mesh_sphere(c,scale=(1,1,1),seg=10,rings=6,color=(246,247,247)):
    vs=[]
    for j in range(rings+1):
        a=math.pi*j/rings
        for k in range(seg):
            b=2*math.pi*k/seg
            vs.append([c[0]+scale[0]*math.sin(a)*math.cos(b),c[1]+scale[1]*math.sin(a)*math.sin(b),c[2]+scale[2]*math.cos(a)])
    faces=[]
    for j in range(rings):
        for k in range(seg):
            a=j*seg+k;b=j*seg+(k+1)%seg;c1=(j+1)*seg+k;e=(j+1)*seg+(k+1)%seg
            if j: faces.append((a,c1,b))
            if j<rings-1: faces.append((b,c1,e))
    return np.array(vs),faces,color
def cylinder(a,b,r1,r2=None,n=7,color=(245,246,247)):
    a=np.array(a); b=np.array(b); axis=b-a; axis=axis/np.linalg.norm(axis)
    side=np.cross(axis,[0,0,1] if abs(axis[2])<.9 else [0,1,0]); side/=np.linalg.norm(side); up=np.cross(axis,side)
    v=[]
    for c,r in [(a,r1),(b,r1 if r2 is None else r2)]:
        for k in range(n): v.append(c+r*(math.cos(k*2*math.pi/n)*side+math.sin(k*2*math.pi/n)*up))
    f=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    for k in range(n): f.append((k,(k+1)%n,(k+1)%n+n,k+n))
    return np.array(v),f,color
def box(c,s,color=(246,247,248)):
    v=np.array([[x,y,z] for x in [-1,1] for y in [-1,1] for z in [-1,1]],float)*np.array(s)/2+np.array(c)
    return v,[(0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)],color
def world(t,speaker):
    meshes=[]
    # Standing human: individually faceted limbs, a tailored sculptural silhouette.
    x=-1.12; bob=.012*math.sin(t*1.6); active=speaker=='HUMAN'
    for dx in [-.15,.15]:
        meshes.append(box((x+dx,-.03,.08),(.2,.39,.16),(231,234,237)))
        meshes.append(cylinder((x+dx,0,.15),(x+dx,.015,.77),.075,.095))
        meshes.append(cylinder((x+dx,.015,.77),(x+dx*.7,0,1.25),.095,.12))
    meshes+=[cylinder((x,0,1.12),(x,0,1.72+bob),.24,.34),cylinder((x,0,1.7),(x,0,1.9+bob),.09)]
    meshes.append(mesh_sphere((x,-.01,2.08+bob),(.205,.19,.265),10,6))
    meshes.append(mesh_sphere((x,-.193,2.055+bob),(.043,.06,.065),5,3,(240,242,243)))
    # Restrained gesture: a raised palm follows the voice without flapping.
    gest=(.5+.5*math.sin(t*.8))*.13 if active else 0
    for side in [-1,1]:
        sh=(x+side*.28,0,1.64+bob); elbow=(x+side*.36,-.025,1.25+gest*(side==1)); hand=(x+side*.35,-.17-gest*2,1.02+gest*3*(side==1))
        meshes.extend([cylinder(sh,elbow,.1,.075),cylinder(elbow,hand,.075,.055),mesh_sphere(hand,(.065,.065,.09),7,4)])
    # AI is an original rounded instrument with a cyan inset, not a branded face.
    x=1.0; bob=.012*math.sin(t*1.4+.5); active=speaker=='AI'
    meshes.append(box((x,.15,.57),(.62,.6,.12),(229,233,236)))
    for dx in [-.22,.22]: meshes.append(cylinder((x+dx,.2,.05),(x+dx,.2,.55),.035))
    meshes.append(cylinder((x,.1,.58),(x,.1,1.2+bob),.21,.29))
    meshes.append(cylinder((x,.1,1.18),(x,.1,1.36),.075))
    meshes.append(mesh_sphere((x,.06,1.57+bob),(.25,.22,.25),10,6))
    meshes.append(mesh_sphere((x,-.155,1.58+bob),(.115,.021,.115),12,4,(35,149,164)))
    meshes.append(mesh_sphere((x,-.178,1.58+bob),(.058,.007,.058),10,4,(234,247,247)))
    for side in [-1,1]:
        hand=(x+side*.23,-.36,1.04+(.035*math.sin(t*1.8) if active else 0))
        meshes.extend([cylinder((x+side*.26,.06,1.15),(x+side*.36,-.15,.92),.075,.06),cylinder((x+side*.36,-.15,.92),hand,.06,.047),mesh_sphere(hand,(.065,.08,.045),7,4)])
    for dx in [-.14,.14]:
        meshes.extend([cylinder((x+dx,.1,.63),(x+dx,-.26,.59),.075),cylinder((x+dx,-.26,.59),(x+dx,-.27,.12),.07,.055),box((x+dx,-.35,.08),(.15,.29,.12))])
    # A small round table and the glass tie the scale changes together.
    meshes.extend([cylinder((0,0,.07),(0,0,1.0),.055),cylinder((0,0,1.01),(0,0,1.07),.78,n=20),cylinder((0,0,.04),(0,0,.09),.36,n=12)])
    meshes.extend([box((0,-.15,1.10),(.26,.44,.045),(50,66,74)),box((0,-.15,1.128),(.21,.35,.008),(35,149,164))])
    return meshes
def scene3d(img,t,kind,speaker):
    d=ImageDraw.Draw(img)
    if kind=='human': target=np.array([-1.1,0,1.92]);cam=np.array([-1.9,-2.65,2.17]);f=1500
    elif kind=='ai': target=np.array([1,.04,1.45]);cam=np.array([1.9,-2.4,1.8]);f=1550
    elif kind=='glass':target=np.array([0,-.1,1.18]);cam=np.array([1.0,-3.0,2.3]);f=1500
    else:target=np.array([0,0,1.05]);cam=np.array([3.3,-7.4,3.4]);f=1650
    cam[0]+=.09*math.sin(t*.18)
    forward=target-cam; forward/=np.linalg.norm(forward)
    right=np.cross(forward,[0,0,1]);right/=np.linalg.norm(right); up=np.cross(right,forward)
    def project(v):
        p=np.asarray(v)-cam
        z=p@forward
        return np.column_stack((W/2+(p@right)*f/z,585-(p@up)*f/z)),z
    # Soft contact shadows, with perspective-projected ellipses.
    sh=Image.new('RGBA',(W,H)); sd=ImageDraw.Draw(sh)
    for x,y,rx,ry in [(-1.1,0,.45,.30),(1,.1,.47,.32),(0,0,.85,.6)]:
        a=np.linspace(0,2*math.pi,40);v=np.array([x+rx*np.cos(a),y+ry*np.sin(a),a*0+.008]).T
        q,_=project(v);sd.polygon([tuple(p) for p in q],fill=(72,97,111,25))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    polys=[];light=np.array([-.6,-.5,1]);light/=np.linalg.norm(light)
    for v,faces,color in world(t,speaker):
        q,z=project(v)
        for face in faces:
            ids=list(face);a,b,c=v[ids[:3]];n=np.cross(b-a,c-a);n/=max(np.linalg.norm(n),1e-10)
            # Double-sided diffuse lighting avoids inverted facets at pole triangles.
            intensity=.72+.27*abs(float(n@light));col=tuple(int(min(255,c*intensity+255*(1-intensity)*.34)) for c in color)
            polys.append((float(z[ids].mean()),[tuple(x) for x in q[ids]],col))
    d=ImageDraw.Draw(img)
    for _,pts,col in sorted(polys,reverse=True,key=lambda p:p[0]):d.polygon(pts,fill=col)
    mask=Image.new('L',(W,H),0)
    md=ImageDraw.Draw(mask)
    for y in range(865,H):md.line((0,y,W,y),fill=int(255*ease((y-865)/95)))
    img.paste(BASE.convert('RGBA'),(0,0),mask)
def graphic(img,t,kind,local):
    d=ImageDraw.Draw(img);cx,cy=W/2,555
    if kind=='clock':
        r=205;ring(d,(cx,cy),r,FAINT,2)
        for i in range(60):
            a=i*math.pi/30-math.pi/2;rr=r-(17 if i%5==0 else 7)
            line(d,[(cx+rr*math.cos(a),cy+rr*math.sin(a)),(cx+r*math.cos(a),cy+r*math.sin(a))],GREY,2)
        a=t*.7;line(d,[(cx,cy),(cx+120*math.sin(a/12),cy-120*math.cos(a/12))],INK,5)
        line(d,[(cx,cy),(cx+170*math.sin(a),cy-170*math.cos(a))],ACC,2);ring(d,(cx,cy),6,ACC,5)
        txt(d,(cx,840),'MEASURED  /  EXPERIENCED',small,GREY)
    elif kind=='atom':
        # A probability-cloud motif: explicitly not a miniature solar system.
        for i in range(115):
            a=i*2.39996+t*.10; r=12+math.sqrt(i/115)*210
            x=cx+math.cos(a)*r;y=cy+math.sin(a)*r*.83
            rad=1+(i%4==0); d.ellipse((x-rad,y-rad,x+rad,y+rad),fill=(170,193,201))
        for i in range(6):
            a=i*math.pi/3+t*.25;x=cx+12*math.cos(a);y=cy+12*math.sin(a)
            d.ellipse((x-10,y-10,x+10,y+10),fill=ACC if i%2 else (91,113,129))
        ring(d,(cx,cy),245,(227,233,236),1)
        txt(d,(cx,843),'A MODEL OF WHAT WE CANNOT SEE',small,GREY)
    elif kind in ['wave','ripple']:
        for j in range(13):
            pts=[]
            for x in range(-20,W+20,6):
                if kind=='wave': y=cy+(j-6)*19+65*math.sin(x/130-t*.5+j*.14)*math.exp(-((x-cx)/260)**2)
                else:y=cy+(j-6)*23+40*math.cos(x/80-t*.7+j*.3)*math.exp(-((x-cx)/240)**2)
                pts.append((x,y))
            line(d,pts,ACC if j==6 else (185+j*2,199+j,206+j),3 if j==6 else 2)
        if kind=='ripple':
            for k in range(5):
                r=((t*30+k*70)%350);ring(d,(cx,cy),r,(int(160+r*.22),int(190+r*.14),int(198+r*.12)),2)
        txt(d,(cx,843),'WHAT WE CARRY FORWARD' if kind=='ripple' else 'THE STORY WE CARRY',small,GREY)
    elif kind in ['galaxy','horizon']:
        if kind=='galaxy':
            for i in range(420):
                r=10+235*math.sqrt(i/420);a=i*.4+r*.027+t*.035
                x=cx+math.cos(a)*r;y=cy+math.sin(a)*r*.46
                rad=1.1+(i%7==0)*1.2;d.ellipse((x-rad,y-rad,x+rad,y+rad),fill=ACC if i%47==0 else (139,158,171))
            for k in range(3):ring(d,(cx,cy),10+k*9,(178,201,208),1)
            txt(d,(cx,843),'ONE LIGHT AMONG LIGHTS',small,GREY)
        else:
            for j in range(8):ring(d,(cx,cy),60+j*27,(226-j*7,232-j*6,235-j*5),1)
            for i,v in enumerate(stars):
                a=t*.025;x=v[0]*math.cos(a)-v[1]*math.sin(a); y=v[0]*math.sin(a)+v[1]*math.cos(a)
                x=cx+x*245;y=cy+y*245;rad=2 if i%23==0 else 1
                d.ellipse((x-rad,y-rad,x+rad,y+rad),fill=ACC if i%29==0 else GREY)
            line(d,[(cx+160,cy-200),(cx+240,cy-280),(cx+290,cy-280)],ACC,1)
            txt(d,(cx,843),'A HORIZON IS NOT A WALL',small,GREY)
    elif kind=='timeline':
        items=[('NOW','A question'),('STARS','Gathering light'),('EARLY UNIVERSE','Hotter. Denser.'),('UNKNOWN','Our theories reach a limit')]
        progress=min(.999,local/14)
        for i,(a,b) in enumerate(items):
            y=320+i*140
            if i<3:line(d,[(160,y),(160,y+140)],FAINT,2)
            ring(d,(160,y),7,ACC if i<=int(progress*4) else FAINT,3)
            txt(d,(193,y-3),a,small,INK,'lm');txt(d,(193,y+29),b,small,GREY,'lm')
        y=320+420*progress;d.ellipse((155,y-5,165,y+5),fill=ACC)
    elif kind=='eye':
        opening=.92+.06*math.sin(t*.3)
        pts=[]
        for a in np.linspace(0,2*math.pi,180):
            x=cx+235*math.cos(a);y=cy+math.sin(a)*108*opening
            pts.append((x,y))
        line(d,pts+[pts[0]],INK,2)
        for r in range(24,90,7):ring(d,(cx,cy),r,(146,179,187),1)
        d.ellipse((cx-25,cy-25,cx+25,cy+25),fill=ACC)
        ring(d,(cx,cy),10,(240,247,248),2)
        txt(d,(cx,843),'WHO SAYS I?',small,GREY)
def caption(img,s,t):
    word=active_word(s,t)
    if word is None:return
    d=ImageDraw.Draw(img);y=cfg.get('caption_y',920)
    txt(d,(W/2,y-48),s['speaker'],tiny,ACC if s['speaker']=='AI' else GREY)
    txt(d,(W/2,y),word,captionfont,INK)
def frame(t):
    if scenes[0]['start']<=t<=scenes[-1]['end']:
        import story_visuals
        index=next((i for i,s in enumerate(scenes) if s['start']<=t<s['end']),len(scenes)-1)
        return story_visuals.draw(sys.modules[__name__],scenes[index],index,t,t-scenes[index]['start'])
    im=BASE.copy().convert('RGBA');d=ImageDraw.Draw(im)
    if t<scenes[0]['start']:
        a=ease(t/1.3);col=tuple(int(251+(c-251)*a) for c in INK)
        
        for j,title in enumerate(cfg['title_lines']):txt(d,(W/2,478+j*71),title,titlefont,col)
        line(d,[(W/2-25,638),(W/2+25,638)],ACC,2)
        txt(d,(W/2,697),'A HUMAN–AI CONVERSATION',small,GREY)
    elif t>scenes[-1]['end']:
        txt(d,(W/2,514),' '.join(cfg['title_lines']),mid,INK)
        
        for j,title in enumerate(cfg.get('closing_lines',[])):txt(d,(W/2,600+j*48),title,font,GREY)
        txt(d,(W/2,1080),'Original dialogue & animation',tiny,GREY)
        txt(d,(W/2,1106),cfg.get('inspiration_credit',''),tiny,GREY)
        txt(d,(W/2,1132),cfg.get('voice_credit','Voices: Chatterbox Turbo'),tiny,GREY)
    else:
        s=next((s for s in scenes if s['start']<=t<s['end']),scenes[-1]); kind=s['scene'];local=t-s['start']
        dark=kind not in ['two','ai','human','glass']
        if not dark:scene3d(im,t,kind,s['speaker'])
        else:
            im=Image.new('RGBA',(W,H),(7,10,14,255))
            old_palette=(globals()['INK'],globals()['GREY'],globals()['FAINT'],globals()['ACC'])
            globals()['INK']=(241,243,246);globals()['GREY']=(174,184,194);globals()['FAINT']=(75,89,102);globals()['ACC']=(232,139,81)
            graphic(im,t,kind,local)
            globals()['INK'],globals()['GREY'],globals()['FAINT'],globals()['ACC']=old_palette
        d=ImageDraw.Draw(im)
        if cfg.get('show_chapter_labels',False):txt(d,(W/2,112),s.get('chapter','A CONVERSATION'),tiny,(150,159,168) if dark else GREY)
        if dark:
            old_ink,old_grey=globals()['INK'],globals()['GREY']
            globals()['INK']=(241,243,246);globals()['GREY']=(147,158,169)
            caption(im,s,t)
            globals()['INK'],globals()['GREY']=old_ink,old_grey
        else:caption(im,s,t)
        # Editorial, brief white dissolve at each scene boundary.
        fade=min(1,local/.22,(s['end']-t)/.18)
        if fade<1:
            transition_base=Image.new('RGBA',(W,H),(7,10,14,255)) if dark else BASE.convert('RGBA')
            im=Image.blend(transition_base,im,ease(fade))
    if t>DUR-1:im=Image.blend(im,BASE.convert('RGBA'),ease(t-(DUR-1)))
    return im.convert('RGB')
def encode_piece(args):
    index,start,end=args
    path=P/f'piece_{index:02d}.mp4'
    proc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-vf',f"scale={cfg['width']}:{round(cfg['width']*16/9)}:flags=lanczos",'-c:v','libx264','-threads','1','-preset','fast','-crf','18','-pix_fmt','yuv420p',str(path)],stdin=subprocess.PIPE)
    for i in range(start,end):proc.stdin.write(frame(i/FPS).tobytes())
    proc.stdin.close()
    if proc.wait():raise RuntimeError(f'Encoding failed: {index}')
    return index,str(path)
if __name__=='__main__':
    if '--preview' in sys.argv:
        picks=[min(1.8,scenes[0]['start']*.5)]+[s['start']+min(2,s['dur']/2) for s in scenes]
        thumb=Image.new('RGB',(720,math.ceil(len(picks)/4)*350),'white')
        for i,t in enumerate(picks):
            im=frame(t);im.save(P/f'preview_{i:02d}.jpg',quality=88)
            im.thumbnail((180,320));thumb.paste(im,((i%4)*180,(i//4)*350))
            ImageDraw.Draw(thumb).text(((i%4)*180+8,(i//4)*350+323),f'{t:.1f}s',font=tiny,fill=INK)
        thumb.save(P/'contact.jpg',quality=90)
    else:
        from concurrent.futures import ProcessPoolExecutor,as_completed
        out=str(P/'picture.mp4')
        total=math.ceil(DUR*FPS);workers=min(cfg.get('workers',6),os.cpu_count() or 2);cuts=[round(total*i/workers) for i in range(workers+1)];parts=[]
        with ProcessPoolExecutor(max_workers=workers) as pool:
            futures=[pool.submit(encode_piece,(i,cuts[i],cuts[i+1])) for i in range(workers)]
            for future in as_completed(futures):
                parts.append(future.result());print(f'RENDER pieces {len(parts)}/{workers}',flush=True)
        cat=P/'concat.txt';cat.write_text(''.join(f"file '{path}'\n" for i,path in sorted(parts)))
        subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(cat),'-c','copy',out],check=True)
        subprocess.run(['ffmpeg','-v','error','-y','-i',out,'-i',str(P/'dialogue.wav'),'-map','0:v','-map','1:a','-c:v','copy','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-ac','2','-c:a','aac','-b:a','192k','-t',str(DUR),'-movflags','+faststart',str(P/(cfg['output_stem']+'.rendering.mp4'))],check=True)
        os.replace(P/(cfg['output_stem']+'.rendering.mp4'),P/(cfg['output_stem']+'.mp4'))
        print('COMPLETE',flush=True)
