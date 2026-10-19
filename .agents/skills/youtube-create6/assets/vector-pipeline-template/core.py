"""Shared editable vector geometry; Pillow raster backend, no external SVG parser."""
import bootstrap
import math,re,html
from functools import lru_cache
from PIL import Image,ImageDraw,ImageFont,ImageColor

def ease(p):
 p=max(0,min(1,p));return p*p*(3-2*p)
def lerp(a,b,p):return a+(b-a)*p
def progress(t,start,duration):return ease((t-start)/max(duration,.001))
def partial(points,p):
 if p<=0:return []
 if p>=1:return list(points)
 lengths=[math.dist(a,b) for a,b in zip(points,points[1:])];remain=sum(lengths)*p;out=[points[0]]
 for a,b,length in zip(points,points[1:],lengths):
  if remain>=length:out.append(b);remain-=length
  else:
   q=remain/length if length else 0;out.append((lerp(a[0],b[0],q),lerp(a[1],b[1],q)));break
 return out

# Original single-line marker alphabet. Coordinates are hand-authored geometry,
# not outlines extracted from a proprietary font. Multiple pen lifts per letter.
GLYPHS={
 'A':[[(0,1),(.5,0),(1,1)],[(.2,.6),(.8,.6)]],
 'B':[[(0,1),(0,0),(.7,0),(1,.2),(.7,.5),(0,.5)],[(.7,.5),(1,.75),(.7,1),(0,1)]],
 'C':[[(1,.1),(.7,0),(.2,0),(0,.3),(0,.8),(.3,1),(.8,1),(1,.9)]],
 'D':[[(0,1),(0,0),(.5,0),(1,.3),(1,.7),(.5,1),(0,1)]],
 'E':[[(1,0),(0,0),(0,1),(1,1)],[(0,.5),(.8,.5)]],
 'F':[[(0,1),(0,0),(1,0)],[(0,.5),(.8,.5)]],
 'G':[[(1,.1),(.7,0),(.2,0),(0,.3),(0,.8),(.3,1),(1,1),(1,.55),(.6,.55)]],
 'H':[[(0,0),(0,1)],[(1,0),(1,1)],[(0,.5),(1,.5)]],
 'I':[[(0,0),(1,0)],[(.5,0),(.5,1)],[(0,1),(1,1)]],
 'J':[[(0,0),(1,0),(1,.8),(.7,1),(.2,1),(0,.8)]],
 'K':[[(0,0),(0,1)],[(1,0),(0,.55),(1,1)]],
 'L':[[(0,0),(0,1),(1,1)]],
 'M':[[(0,1),(0,0),(.5,.5),(1,0),(1,1)]],
 'N':[[(0,1),(0,0),(1,1),(1,0)]],
 'O':[[(.25,0),(.75,0),(1,.25),(1,.75),(.75,1),(.25,1),(0,.75),(0,.25),(.25,0)]],
 'P':[[(0,1),(0,0),(.75,0),(1,.25),(.75,.5),(0,.5)]],
 'Q':[[(.25,0),(.75,0),(1,.25),(1,.75),(.75,1),(.25,1),(0,.75),(0,.25),(.25,0)],[(.6,.65),(1.1,1.1)]],
 'R':[[(0,1),(0,0),(.75,0),(1,.25),(.75,.5),(0,.5)],[(.5,.5),(1,1)]],
 'S':[[(1,.1),(.7,0),(.2,0),(0,.25),(.3,.45),(.8,.55),(1,.75),(.8,1),(.3,1),(0,.9)]],
 'T':[[(0,0),(1,0)],[(.5,0),(.5,1)]],
 'U':[[(0,0),(0,.8),(.2,1),(.8,1),(1,.8),(1,0)]],
 'V':[[(0,0),(.5,1),(1,0)]],
 'W':[[(0,0),(.2,1),(.5,.55),(.8,1),(1,0)]],
 'X':[[(0,0),(1,1)],[(1,0),(0,1)]],
 'Y':[[(0,0),(.5,.5),(1,0)],[(.5,.5),(.5,1)]],
 'Z':[[(0,0),(1,0),(0,1),(1,1)]],
 '0':[[(.25,0),(.75,0),(1,.25),(1,.75),(.75,1),(.25,1),(0,.75),(0,.25),(.25,0)]],
 '1':[[(.15,.2),(.5,0),(.5,1)],[(.1,1),(.9,1)]],
 '2':[[(0,.2),(.25,0),(.8,0),(1,.2),(.85,.4),(0,1),(1,1)]],
 '3':[[(0,0),(1,0),(.5,.5),(1,.7),(.8,1),(0,1)]],
 '4':[[(.8,1),(.8,0),(0,.65),(1,.65)]],
 '5':[[(1,0),(0,0),(0,.5),(.8,.5),(1,.7),(.8,1),(0,1)]],
 '6':[[(1,0),(.4,0),(0,.4),(0,.8),(.3,1),(.8,1),(1,.7),(.8,.5),(0,.5)]],
 '7':[[(0,0),(1,0),(.3,1)]],
 '8':[[(.3,0),(.8,0),(1,.25),(0,.75),(.2,1),(.8,1),(1,.75),(0,.25),(.3,0)]],
 '9':[[(1,.5),(.2,.5),(0,.25),(.2,0),(.8,0),(1,.2),(1,.8),(.7,1),(0,1)]],
 '$':[[(1,.15),(.7,.05),(.2,.05),(0,.3),(.3,.45),(.8,.55),(1,.75),(.8,.95),(.3,.95),(0,.85)],[(.5,-.1),(.5,1.1)]],
 '%':[[(0,1),(1,0)],[(.2,0),(0,.1),(.2,.3),(.4,.1),(.2,0)],[(.8,.7),(.6,.9),(.8,1),(1,.9),(.8,.7)]],
 '/':[[(0,1),(1,0)]],'-':[[(0,.5),(1,.5)]],
 '!':[[(.5,0),(.5,.72)],[(.5,.95),(.51,1)]],
 '?':[[(0,.2),(.2,0),(.8,0),(1,.2),(.5,.6),(.5,.75)],[(.5,.98),(.51,1)]],
 ',':[[(.5,.9),(.3,1.1)]],'.':[[(.5,.98),(.51,1)]],
 '↑':[[(.5,1),(.5,0)],[(0,.4),(.5,0),(1,.4)]],
 '→':[[(0,.5),(1,.5)],[(.6,0),(1,.5),(.6,1)]],
 '+':[[(0,.5),(1,.5)],[(.5,0),(.5,1)]]}

def marker_paths(text,x,y,size):
 out=[];cx=x
 for i,ch in enumerate(text.upper()):
  if ch==' ':cx+=size*.44;continue
  if ch not in GLYPHS:raise ValueError('Unsupported marker glyph '+ch)
  for stroke in GLYPHS[ch]:out.append([(cx+u*size*.48+v*size*.045,y+v*size+math.sin(i*1.7)*size*.018) for u,v in stroke])
  cx+=size*.64
 return out

@lru_cache(maxsize=32)
def font(size,bold=True):
 return ImageFont.truetype('C:/Windows/Fonts/'+('segoeuib.ttf' if bold else 'segoeui.ttf'),size)

class Canvas:
 def __init__(self,w=1080,h=1920,bg='#eee7db'):
  self.w,self.h=w,h;self.im=Image.new('RGB',(w,h),bg);self.d=ImageDraw.Draw(self.im,'RGBA');self.elements=[];self.text_boxes=[];self.shape_boxes=[];self.bg=bg
 def rgba(self,color,alpha=1):return ImageColor.getrgb(color)+(round(max(0,min(1,alpha))*255),)
 def line(self,pts,color='#182537',width=5,alpha=1):
  if len(pts)<2 or alpha<=0:return
  self.shape_boxes.append((min(x for x,y in pts)-width/2,min(y for x,y in pts)-width/2,max(x for x,y in pts)+width/2,max(y for x,y in pts)+width/2))
  self.d.line(pts,fill=self.rgba(color,alpha),width=max(1,round(width)),joint='curve')
  r=width/2
  for x,y in [pts[0],pts[-1]]:self.d.ellipse((x-r,y-r,x+r,y+r),fill=self.rgba(color,alpha))
  points=' '.join(f'{x:.3f},{y:.3f}' for x,y in pts)
  self.elements.append(f'<polyline points="{points}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" opacity="{alpha:.4f}"/>')
 def polygon(self,pts,fill,alpha=1):
  self.shape_boxes.append((min(x for x,y in pts),min(y for x,y in pts),max(x for x,y in pts),max(y for x,y in pts)))
  self.d.polygon(pts,fill=self.rgba(fill,alpha));s=' '.join(f'{x:.3f},{y:.3f}' for x,y in pts)
  self.elements.append(f'<polygon points="{s}" fill="{fill}" opacity="{alpha:.4f}"/>')
 def rect(self,box,fill,r=0,alpha=1):
  self.shape_boxes.append(box)
  self.d.rounded_rectangle(box,radius=r,fill=self.rgba(fill,alpha));x,y,x2,y2=box
  self.elements.append(f'<rect x="{x}" y="{y}" width="{x2-x}" height="{y2-y}" rx="{r}" fill="{fill}" opacity="{alpha:.4f}"/>')
 def ellipse(self,box,fill,alpha=1):
  self.shape_boxes.append(box)
  self.d.ellipse(box,fill=self.rgba(fill,alpha));x,y,x2,y2=box
  self.elements.append(f'<ellipse cx="{(x+x2)/2}" cy="{(y+y2)/2}" rx="{(x2-x)/2}" ry="{(y2-y)/2}" fill="{fill}" opacity="{alpha:.4f}"/>')
 def text(self,x,y,text,size=46,color='#182537',bold=True,alpha=1,role='art'):
  f=font(size,bold);box=self.d.textbbox((x,y),text,font=f)
  self.text_boxes.append(dict(text=text,box=box,role=role))
  self.d.text((x,y),text,font=f,fill=self.rgba(color,alpha))
  self.elements.append(f'<text x="{x}" y="{y}" dominant-baseline="text-before-edge" font-family="Segoe UI" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}" opacity="{alpha:.4f}">{html.escape(text)}</text>')
 def ink(self,paths,p,color='#182537',width=5):
  lengths=[sum(math.dist(a,b) for a,b in zip(s,s[1:])) for s in paths];remaining=sum(lengths)*max(0,min(1,p))
  for stroke,length in zip(paths,lengths):
   if remaining<=0:break
   self.line(partial(stroke,min(1,remaining/length)) if length else [],color,width);remaining-=length
 def svg(self):return f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}"><rect width="100%" height="100%" fill="{self.bg}"/>'+''.join(self.elements)+'</svg>'

def resolve_cues(words,phrases):
 norm=lambda s:re.sub('[^a-z0-9]','',s.lower())
 tokens=[norm(w['text']) for w in words];out={}
 for key,phrase in phrases.items():
  p=[norm(x) for x in phrase.split()];hits=[i for i in range(len(tokens)-len(p)+1) if tokens[i:i+len(p)]==p]
  if len(hits)!=1:raise ValueError(f'Cue {key} must match once, got {hits}')
  out[key]=words[hits[0]]['start']
 return out
