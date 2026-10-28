"""Simple, scene-specific graphics with reserved face-safe areas."""
import math
from PIL import Image,ImageDraw,ImageFont
W,H=720,1280
SHARED_TURNS={2,6,8,12,14,16,18,19}
DARK=(10,14,20);INK=(39,49,58);MUTED=(126,140,150);TEAL=(38,148,161);GOLD=(211,161,92);RED=(188,75,65);WHITE=(242,244,243)
FONT='/System/Library/Fonts/Supplemental/Arial.ttf';BOLD='/System/Library/Fonts/Supplemental/Arial Bold.ttf'
def ease(x):
 x=max(0,min(1,x));return x*x*(3-2*x)
def onset(s,word,default=0):
 norm=lambda t:''.join(x.lower() for x in t if x.isalnum());return next((w['t'] for w in s['words'] if norm(w['text'])==norm(word)),default)
def label(d,xy,text,size=23,color=MUTED,bold=False,anchor='mm'):
 d.text(xy,text,font=ImageFont.truetype(BOLD if bold else FONT,size),fill=color,anchor=anchor)
def card(d,box,text,size=22,color=GOLD):
 d.rounded_rectangle(box,radius=14,fill=(22,31,41),outline=color,width=2);label(d,((box[0]+box[2])/2,(box[1]+box[3])/2),text,size,WHITE,True)
def heart(d,x,y,size=35,color=RED):
 pts=[]
 for i in range(80):
  t=i*math.tau/80;xx=16*math.sin(t)**3;yy=13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t);pts.append((x+size*xx/17,y-size*yy/17))
 d.polygon(pts,fill=color)
def horns(d,x,y,size=1):
 d.polygon([(x-65*size,y+28*size),(x-95*size,y-60*size),(x-28*size,y+5*size)],fill=RED)
 d.polygon([(x+65*size,y+28*size),(x+95*size,y-60*size),(x+28*size,y+5*size)],fill=RED)
 d.arc((x-70*size,y-5*size,x+70*size,y+57*size),180,360,fill=RED,width=max(2,int(10*size)))
def phone(d,x,y,scale=1,txt='',color=TEAL):
 w=110*scale;h=188*scale
 d.rounded_rectangle((x-w/2,y-h/2,x+w/2,y+h/2),radius=16*scale,fill=(34,46,57),outline=(138,166,175),width=max(2,int(3*scale)))
 d.rounded_rectangle((x-w*.4,y-h*.36,x+w*.4,y+h*.35),radius=7*scale,fill=color)
 d.line((x-13*scale,y-h*.43,x+13*scale,y-h*.43),fill=WHITE,width=max(2,int(3*scale)))
 if txt:label(d,(x,y),txt,max(12,int(16*scale)),WHITE,True)
def person(d,x,y,color=WHITE,scale=1):
 rr=20*scale;d.ellipse((x-rr,y-rr,x+rr,y+rr),fill=color);d.rounded_rectangle((x-29*scale,y+27*scale,x+29*scale,y+123*scale),radius=15*scale,fill=color)
 d.line((x-15*scale,y+120*scale,x-20*scale,y+180*scale),fill=color,width=max(3,int(17*scale)));d.line((x+15*scale,y+120*scale,x+20*scale,y+180*scale),fill=color,width=max(3,int(17*scale)))
def house(d,x,y,scale=1):
 d.polygon([(x-65*scale,y),(x,y-60*scale),(x+65*scale,y)],fill=(205,216,215));d.rectangle((x-49*scale,y,x+49*scale,y+83*scale),fill=(161,184,184));d.rectangle((x-12*scale,y+38*scale,x+12*scale,y+83*scale),fill=TEAL)
def cake(d,x,y,scale=1):
 d.rounded_rectangle((x-60*scale,y,x+60*scale,y+50*scale),radius=8*scale,fill=(213,165,103));d.rectangle((x-57*scale,y,x+57*scale,y+16*scale),fill=(242,219,187));d.line((x,y,x,y-28*scale),fill=WHITE,width=max(2,int(5*scale)));d.ellipse((x-5*scale,y-40*scale,x+5*scale,y-26*scale),fill=GOLD)
def sock(d,x,y,scale=1):
 pts=[(x-20*scale,y-46*scale),(x+20*scale,y-46*scale),(x+20*scale,y+12*scale),(x+57*scale,y+12*scale),(x+67*scale,y+33*scale),(x+53*scale,y+50*scale),(x-20*scale,y+50*scale)]
 d.polygon(pts,fill=(207,161,109));d.line((x-20*scale,y-29*scale,x+20*scale,y-29*scale),fill=WHITE,width=max(2,int(8*scale)))
def dog(d,x,y,scale=1):
 d.ellipse((x-59*scale,y-30*scale,x+59*scale,y+32*scale),fill=(169,126,86));d.ellipse((x+20*scale,y-68*scale,x+83*scale,y-4*scale),fill=(194,151,106))
 d.polygon([(x+24*scale,y-61*scale),(x+31*scale,y-100*scale),(x+49*scale,y-65*scale)],fill=(150,105,70));d.ellipse((x+62*scale,y-50*scale,x+68*scale,y-44*scale),fill=INK)
 for xx in [x-33*scale,x+35*scale]:d.line((xx,y+15*scale,xx,y+61*scale),fill=(169,126,86),width=max(3,int(14*scale)))
 d.line((x-53*scale,y-12*scale,x-85*scale,y-49*scale),fill=(169,126,86),width=max(3,int(10*scale)))
def bubble(d,box,text,fill=(28,43,55),size=25):
 d.rounded_rectangle(box,radius=22,fill=fill,outline=TEAL,width=2);x=box[0]+30;y=box[3];d.polygon([(x,y-2),(x+35,y-2),(x+7,y+24)],fill=fill);label(d,((box[0]+box[2])/2,(box[1]+box[3])/2),text,size,WHITE,True)
def tea(d,x,y,scale=1):
 d.rounded_rectangle((x-47*scale,y-32*scale,x+47*scale,y+40*scale),radius=13*scale,fill=(218,231,229),outline=TEAL,width=2)
 d.arc((x+28*scale,y-20*scale,x+78*scale,y+30*scale),255,110,fill=TEAL,width=max(2,int(6*scale)));d.ellipse((x-40*scale,y-39*scale,x+40*scale,y-17*scale),fill=(133,90,60))
 for dx in [-15,15]:d.arc((x+dx-7,y-85*scale,x+dx+7,y-45*scale),75,275,fill=GOLD,width=2)
def cookie(d,x,y,scale=1):
 rr=58*scale;d.ellipse((x-rr,y-rr,x+rr,y+rr),fill=(211,165,100),outline=(158,108,61),width=3)
 for dx,dy in [(-22,-16),(19,-25),(-12,22),(27,14),(0,0)]:d.ellipse((x+(dx-4)*scale,y+(dy-4)*scale,x+(dx+4)*scale,y+(dy+4)*scale),fill=(101,68,47))
def arrow(d,a,b,col=GOLD):
 d.line((a,b),fill=col,width=3);ang=math.atan2(b[1]-a[1],b[0]-a[0]);x,y=b;d.polygon([(x,y),(x-13*math.cos(ang-.5),y-13*math.sin(ang-.5)),(x-13*math.cos(ang+.5),y-13*math.sin(ang+.5))],fill=col)
def draw(r,s,index,t,local):
 dark=index in {1,3,5,7,9,11,13,15,17}
 cut={1:'pretend',5:'tool',13:'sneaky',17:'big'}.get(index)
 ai_close=bool(cut and local<onset(s,cut,1.8))
 if ai_close:dark=False
 im=Image.new('RGBA',(W,H),DARK+(255,)) if dark else r.BASE.copy().convert('RGBA')
 if not dark:r.scene3d(im,t,'ai' if ai_close else ('human' if index in {0,4,10} else 'two'),s['speaker'])
 d=ImageDraw.Draw(im)
 # Shared scenes place every flat illustration above y=280, clear of both faces.
 if not ai_close:
  if index==0:label(d,(360,190),'IF YOU WERE THE DEVIL?',26,INK,True)
  elif index==1:
   horns(d,360,390,1.35);card(d,(170,575,550,665),'A PRETEND STORY',28);label(d,(360,760),'ONE LITTLE TRICK',23,GOLD,True)
  elif index==2:
   d.polygon([(155,245),(122,205),(142,170),(153,130),(186,206)],fill=GOLD);horns(d,360,210,.65)
   d.line((560,245,560,145),fill=RED,width=9)
   for xx in [535,560,585]:d.line((xx,130,xx,175),fill=RED,width=6)
   d.line((535,175,585,175),fill=RED,width=6)
  elif index==3:
   person(d,200,400);person(d,520,400);phone(d,265,540,.67);phone(d,455,540,.67)
   a=ease((local-onset(s,'forget'))/.8);d.line((235,710,485,710),fill=tuple(int(c*(1-a)) for c in TEAL),width=4)
   label(d,(360,790),'LOOKING DOWN. MISSING EACH OTHER.',20,GOLD,True)
  elif index==4:label(d,(360,180),'IS THE PHONE THE PROBLEM?',25,INK,True)
  elif index==5:
   d.line((360,280,360,740),fill=(75,96,110),width=2)
   phone(d,205,460,1.25,'CALL');heart(d,205,650,30,TEAL);label(d,(205,730),'CALL GRANDMA',20,WHITE,True)
   person(d,510,390,WHITE,.8);phone(d,465,535,.65);label(d,(510,730),'OR IGNORE HER?',20,GOLD,True)
  elif index==6:label(d,(360,205),'WHAT IS THE NEXT LITTLE TRICK?',24,INK,True)
  elif index==7:
   house(d,205,355,.72);house(d,510,325,1.05)
   cake(d,205,570,.62);cake(d,510,540,1.05)
   if local>=onset(s,'dog'):
    dog(d,490,710,.55);heart(d,560,650,14,TEAL)
   label(d,(205,770),'MY LIFE',21,MUTED,True);label(d,(510,805),'THEIR LIFE?',21,GOLD,True)
   a=ease((local-onset(s,'better'))/.8);d.ellipse((420,440,595,615),outline=GOLD,width=max(1,int(5*a)));d.line((580,595,625,640),fill=GOLD,width=5)
  elif index==8:dog(d,325,210,.55);sock(d,445,215,.5)
  elif index==9:
   dog(d,300,440,1);sock(d,460,460,.8);label(d,(360,620),'THE DOG IS HAPPY',25,GOLD,True)
   if local>=onset(s,'good'):
    heart(d,235,735,27,TEAL);cake(d,435,715,.65)
    label(d,(360,830),'NOTICE YOUR OWN GOOD THINGS',21,WHITE,True)
  elif index==10:label(d,(360,180),'WHAT HAPPENS NEXT?',26,INK,True)
  elif index==11:
   person(d,190,570,WHITE,.85);person(d,535,570,WHITE,.85)
   a=ease((local-onset(s,'huge'))/.9)
   bubble(d,(130,320,350+int(a*65),440),'I AM RIGHT!',(78,46,44),24)
   if local>=onset(s,'shouting'):bubble(d,(315,445,620,560),'NO, I AM!',(46,60,76),25)
   label(d,(360,800),'LOUDER IS NOT THE SAME AS LISTENING',20,GOLD,True)
  elif index==12:
   phone(d,360,195,.75,'FAMILY')
   for x,y in [(235,165),(470,205)]:bubble(d,(x-62,y-25,x+62,y+25),'!!!',size=24)
  elif index==13:
   phone(d,360,415,1.2,'CHAT')
   for j in range(3):bubble(d,(170+j*35,300+j*85,440+j*35,365+j*85),'!!!',size=24)
   if local>=onset(s,'small'):
    card(d,(155,675,565,755),'ONE KIND THING WILL NOT HELP?',20)
    d.line((175,742,545,690),fill=RED,width=4)
   label(d,(360,830),'IS THAT REALLY TRUE?',23,GOLD,True)
  elif index==14:
   for j in range(6):
    d.ellipse((175+j*13,175+(j%2)*25,185+j*13,185+(j%2)*25),fill=RED)
   arrow(d,(290,210),(420,210),TEAL);heart(d,510,205,42,TEAL)
   label(d,(360,105),'LITTLE THINGS ADD UP',23,INK,True)
  elif index==15:
   # Four small actions, revealed at their spoken cues.
   if local>=onset(s,'door'):
    d.rectangle((145,320,260,510),outline=TEAL,width=4);d.polygon([(160,330),(235,345),(235,500),(160,510)],fill=(95,137,145));label(d,(200,550),'HOLD A DOOR',20,WHITE,True)
   if local>=onset(s,'sorry'):card(d,(400,360,615,460),'SORRY',28)
   if local>=onset(s,'down'):
    phone(d,205,700,.67);d.line((140,790,270,790),fill=TEAL,width=4)
   if local>=onset(s,'friend'):bubble(d,(365,650,635,735),'HOW ARE YOU?',size=23)
   label(d,(360,850),'SMALL DOES NOT MEAN USELESS',21,GOLD,True)
  elif index==16:
   card(d,(130,155,340,245),'SORRY',27);tea(d,510,205,.7)
  elif index==17:
   a=ease((local-onset(s,'kindness'))/1.0);horns(d,360,370,1.8-1.2*a)
   if local>=onset(s,'kindness'):heart(d,360,590,55,TEAL)
   if local>=onset(s,'biscuit'):cookie(d,360,735,.85)
   label(d,(360,845),'KINDNESS SPOILS THE SCARY PLAN',21,GOLD,True)
  elif index==18:
   phone(d,205,200,.65,'GRANDMA');dog(d,465,220,.5);sock(d,565,220,.4)
  elif index==19:
   heart(d,360,200,40,TEAL)
   label(d,(360,275),'ONE SMALL GOOD THING',24,INK,True)
 word=r.active_word(s,t)
 if word is not None:
  yy=r.cfg.get('caption_y',920);label(d,(360,yy-48),s['speaker'],15,TEAL if s['speaker']=='AI' else MUTED)
  d.text((360,yy),word,font=r.captionfont,fill=WHITE if dark else INK,anchor='mm')
 f=min(1,local/.18,(s['end']-s['start']-local)/.16)
 if f<1:
  base=Image.new('RGBA',(W,H),DARK+(255,)) if dark else r.BASE.convert('RGBA');im=Image.blend(base,im,ease(f))
 return im.convert('RGB')
