"""Adapted stable, fixed-metric George white/gold karaoke caption treatment."""
import bisect,re
from core import font

class Captions:
 def __init__(self,words):
  self.words=words;self.f=font(72);self.groups=[];g=[]
  for w in words:
   if g and (len(g)>=6 or len(self.lines(g+[w]))>2):self.groups.append(g);g=[]
   g.append(w)
   if w['text'].endswith(('.', '?','!', ';')):self.groups.append(g);g=[]
  if g:self.groups.append(g)
  self.starts=[g[0]['start'] for g in self.groups]
 def lines(self,g):
  out=[[]]
  for w in g:
   if out[-1] and self.f.getlength(' '.join(a['text'] for a in out[-1]+[w]))>790:out.append([])
   out[-1].append(w)
  return out
 def draw(self,c,t):
  c.rect((0,1335,1080,1920),'#132133')
  idx=max(0,bisect.bisect_right(self.starts,t)-1);group=self.groups[idx]
  for row,line in enumerate(self.lines(group)):
   x=80
   for w in line:
    c.text(x,1380+92*row,w['text'],72,'#dfc18b' if w['start']<=t<w['end'] else '#f5f1ea',role='caption');x+=self.f.getlength(w['text']+' ')
  return idx
 def sidecars(self,root,duration):
  def stamp(t):
   ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
  out=[]
  for i,g in enumerate(self.groups):
   end=self.starts[i+1] if i+1<len(self.groups) else duration
   out.extend([str(i+1),f'{stamp(g[0]["start"])} --> {stamp(end)}','\n'.join(' '.join(w['text'] for w in line) for line in self.lines(g)),''])
  (root/'captions.srt').write_text('\n'.join(out),encoding='utf-8')

def audit(boxes):
 for a in boxes:
  x,y,x2,y2=a['box'];assert 64<=x<=x2<=916 and 70<=y<=y2<=1600,(a,'outside safe bounds')
  if a['role']=='art':assert y2<1300,(a,'art encroaches caption region')
  else:assert y>=1380 and y2<=1585,(a,'unsafe caption placement')
 for i,a in enumerate(boxes):
  x,y,x2,y2=a['box']
  for b in boxes[i+1:]:
   xx,yy,xx2,yy2=b['box'];assert not (x<xx2 and x2>xx and y<yy2 and y2>yy),(a,b,'text overlap')
