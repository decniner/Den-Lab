"""Six demonstration scenes using reusable effects and word-synchronized cues."""
from pathlib import Path
import json,math
from core import Canvas,marker_paths,partial,progress,ease,lerp,resolve_cues
from characters import character,INK,GOLD,export_cast
from calculations import calculate
R=Path(__file__).resolve().parent;CALC=calculate()

def handwriting(c,text,x,y,size,t,start,duration=1.3,color=INK):
 c.ink(marker_paths(text,x,y,size),progress(t,start,duration),color,4.5)

def arrow(c,points,p,color=GOLD,width=8):
 c.line(partial(points,p),color,width)
 if p>.97:
  a,b=points[-2:];ang=math.atan2(b[1]-a[1],b[0]-a[0]);c.line([(b[0]-22*math.cos(ang-.5),b[1]-22*math.sin(ang-.5)),b,(b[0]-22*math.cos(ang+.5),b[1]-22*math.sin(ang+.5))],color,width)

def transfer(c,t,start,end,a,b,count=5):
 """Distinct eased transfers; no endless repeated money-loop filler."""
 for i in range(count):
  raw=(t-start-i*.32)/max(.4,(end-start)-count*.32)
  if 0<raw<1:
   q=ease(raw);x=lerp(a[0],b[0],q);y=lerp(a[1],b[1],q)-95*math.sin(math.pi*q)
   c.ellipse((x-23,y-23,x+23,y+23),GOLD);c.ink(marker_paths('$',x-11,y-15,27),1,'#eee7db',2)

def certificate(c,x,y,s=1,alpha=1):
 c.rect((x,y,x+230*s,y+280*s),'#d9cfbb',18*s,alpha)
 c.rect((x+12*s,y+12*s,x+218*s,y+268*s),'#fffaf1',12*s,alpha)
 c.line([(x+43*s,y+200*s),(x+82*s,y+149*s),(x+119*s,y+165*s),(x+181*s,y+80*s)],GOLD,7*s,alpha)
 c.line([(x+40*s,y+240*s),(x+185*s,y+240*s)],INK,4*s,alpha)
 c.ellipse((x+44*s,y+38*s,x+87*s,y+81*s),GOLD,alpha)

def chart(c,t,start,duration,values,color=GOLD):
 x0,y0,x1,y1=130,1050,865,540
 c.line([(x0,y1),(x0,y0),(x1,y0)],INK,4)
 pts=[(x0+i*(x1-x0)/(len(values)-1),y0-v/30000000*(y0-y1)) for i,v in enumerate(values)]
 q=progress(t,start,duration);c.line(partial(pts,q),color,9)
 n=q*(len(values)-1);i=min(len(values)-2,int(n));value=round(lerp(values[i],values[i+1],n-i))
 c.text(130,1120,f'${value/1000000:.1f}M',62,color)
 c.text(575,1120,'PRINCIPAL $10M',39)
 return value

def load_timeline():
 sections=json.loads((R/'narration-sections.json').read_text());words=json.loads((R/'word_timings.json').read_text())
 voice=json.loads((R/'voice-settings.json').read_text())
 duration=math.ceil((voice['duration']+.7)*30)/30
 scenes=[dict(index=i,start=s['start'],end=sections[i+1]['start'] if i+1<len(sections) else duration,text=s['text']) for i,s in enumerate(sections)]
 cues=resolve_cues(words,{'portfolio':'twenty million dollars','loan':'ten million dollar loan','rate':'five percent','interest':'five hundred thousand dollars','growth':'Higher stock values','crash':'Falling collateral','call':'maintenance call','basis':'basis linked','nickname':'Buy borrow die','debt':'The debt survives'})
 (R/'timeline.json').write_text(json.dumps(dict(duration=duration,scenes=scenes,cues=cues),indent=2))
 return scenes,cues,duration

def scene(t,scenes,cues):
 s=next((s for s in scenes if s['start']<=t<s['end']),scenes[-1]);i=s['index'];u=t-s['start'];d=s['end']-s['start'];p=u/d
 c=Canvas();c.rect((64,90,916,119),'#d7cbb5',r=10)
 c.rect((64,90,64+852*p,119),GOLD,r=10)
 c.text(90,150,'HYPOTHETICAL USD EXAMPLE' if i<4 else ('UNITED STATES RULES' if i==4 else 'ANIMATION DEMONSTRATION'),36,bold=True)
 if i==0:
  handwriting(c,'WHY BORROW?',110,270,66,t,s['start']+.1,1.8)
  character(c,'questioner',280+25*ease(p),640,420,t,'curious',math.sin(u*.5)*.3)
  certificate(c,620-20*ease(p),580+math.sin(u)*6,lerp(1.02,1.14,ease(p)))
  arrow(c,[(390,630),(450,580),(550,580)],progress(u,2,1.6))
  c.text(120,1180,'A LOAN IS STILL DEBT',48)
 elif i==1:
  handwriting(c,'BORROW $10 MILLION',100,270,62,t,cues['loan']-1.0,1.0)
  c.text(100,435,'ILLUSTRATIVE COLLATERAL: $20M',44)
  character(c,'billionaire',270+16*ease(p),650,410,t,gesture=progress(u,1.5,2)*.7)
  character(c,'banker',730,620,410,t,gesture=progress(u,2,1.5)*.4)
  c.rect((554,925,906,1070),INK,r=12);c.text(600,970,'BANK',48,'#eee7db')
  transfer(c,t,s['start']+1,s['end']-.5,(690,740),(360,860))
  c.text(120,1180,'SHARES KEPT. LOAN OWED.',46)
 elif i==2:
  handwriting(c,'5% INTEREST',110,265,68,t,cues['rate'],1)
  handwriting(c,'$500,000 / YEAR',110,405,60,t,cues['interest'],1.2)
  c.text(110,555,'Simple annual interest. One year.',44)
  c.text(110,620,'No fees, payments or compounding.',42)
  character(c,'billionaire',270,750,345,t,gesture=.1+math.sin(u*.6)*.12)
  # A continuously filling debt-cost meter with an exact calculated endpoint.
  q=progress(u,.2,d-1.2);c.rect((510,750,845,1070),'#ded2be',16)
  c.rect((520,1060-290*q,835,1060),GOLD,12)
  c.text(530,800,f'${round(CALC["annual_interest"]*q):,}',46)
  c.text(110,1180,'PRINCIPAL REMAINS $10M',45)
 elif i==3:
  # One continuous graph rises and then crashes, synchronized to the contrast.
  crash=cues['crash'];gstart=cues['growth']
  if t<crash:
   handwriting(c,'STOCK VALUE ↑',110,270,64,t,gstart,1.2)
   chart(c,t,gstart,max(1,crash-gstart),[20000000,21400000,23200000,26000000])
  else:
   handwriting(c,'MAINTENANCE CALL!',100,270,55,t,cues['call']-.8,1)
   chart(c,t,crash,max(1,s['end']-crash-1),[26000000,24400000,18500000,12000000],'#a95745')
  c.text(110,430,'Illustrative prices. Not a forecast.',44)
  character(c,'questioner',820,550,210,t,'worried' if t>=crash else 'curious')
  c.text(130,1230,'Lender terms determine any call.',40)
 elif i==4:
  handwriting(c,'INHERITED BASIS',100,270,59,t,cues['basis']-.7,1.3)
  c.text(100,425,'Inherited basis generally tied',44);c.text(100,482,'to value at death. Exceptions apply.',42)
  certificate(c,425,650,1.02)
  character(c,'heir-a',250-12*ease(p),710,360,t,gesture=progress(u,2,2)*.4)
  character(c,'heir-b',780+12*ease(p),710,360,t,gesture=progress(u,3,2)*.4)
  arrow(c,[(520,600),(520,620),(540,660)],progress(u,1,2),GOLD,7)
  c.text(110,1180,'DEBTS AND ESTATE TAXES STILL MATTER',38)
 else:
  handwriting(c,'BUY → BORROW → DIE',100,270,58,t,cues['nickname'],2.0)
  character(c,'billionaire',265-20*ease(p),665,390,t,gesture=.3)
  character(c,'banker',770+12*ease(p),665,390,t,'calm',.2)
  certificate(c,440,630, .75)
  handwriting(c,'DEBT SURVIVES',190,1120,62,t,cues['debt'],1.0,'#a95745')
  arrow(c,[(390,840),(460,830),(550,840),(620,840)],progress(u,2,2))
 # Stable artwork bounds; captions are composited later, never through camera moves.
 return c,i

if __name__=='__main__':
 scenes,cues,duration=load_timeline();out=R/'assets/svg';out.mkdir(parents=True,exist_ok=True);export_cast(R/'assets/cast')
 for s in scenes:
  for name,q in [('early',.2),('middle',.5),('late',.9)]:
   c,_=scene(s['start']+(s['end']-s['start'])*q,scenes,cues)
   (out/f'scene-{s["index"]+1}-{name}.svg').write_text(c.svg(),encoding='utf-8')
 # Effect catalogue includes a margin-account label, not a mislabeled SBLOC call.
 for n,label in enumerate(['BORROW $10 MILLION','5% INTEREST','$500,000 / YEAR','STOCK VALUE ↑','MARGIN CALL!','STEPPED-UP BASIS','BUY → BORROW → DIE']):
  for q in [0,.25,.5,.75,1]:
   c=Canvas(1000,220);c.ink(marker_paths(label,50,60,60),q,INK,5)
   (out/f'marker-{n}-{q}.svg').write_text(c.svg(),encoding='utf-8')
