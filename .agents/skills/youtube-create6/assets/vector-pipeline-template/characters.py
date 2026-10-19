"""Original vector paper-cutout cast, consistent normalized joint proportions."""
import math
from core import lerp,ease,Canvas
INK='#182537';GOLD='#bf9345';SKIN='#d5a384'
STYLES={'billionaire':('#243347',SKIN,GOLD),'banker':('#697682','#bb8269','#223649'),'questioner':('#496c68','#e6ba94','#b79457'),'heir-a':('#976758','#d5a384','#e4bc7a'),'heir-b':('#496c68','#bc896c','#d9b466')}

def character(c,kind,x,y,h=410,t=0,mood='calm',gesture=0):
 suit,skin,tie=STYLES[kind];s=h/410;bob=math.sin(t*1.8)*2.2*s
 def pt(u,v):return (x+u*s,y+v*s+bob)
 def line(points,col=INK,w=5):c.line([pt(*p) for p in points],col,w*s)
 def ellipse(box,col):c.ellipse((*pt(box[0],box[1]),*pt(box[2],box[3])),col)
 def poly(points,col):c.polygon([pt(*p) for p in points],col)
 # Offset backing acts like a restrained paper shadow, not a heavy 3D effect.
 poly([(-64,151),(-83,276),(-41,283),(45,283),(87,278),(67,151)],'#d6cec0')
 line([(-31,282),(-39,388),(-69,397)],INK,24)
 line([(31,282),(36,388),(66,397)],INK,24)
 poly([(-65,150),(-80,280),(79,280),(64,150)],suit)
 poly([(-29,145),(0,198),(30,145)],'#eee7db')
 poly([(-8,163),(8,163),(15,215),(0,233),(-14,215)],tie)
 ellipse((-18,121,18,159),skin)
 ellipse((-58,11,58,134),skin)
 poly([(-59,60),(-57,20),(-31,1),(27,1),(56,18),(58,53),(35,30),(-31,29)],INK)
 # Arms remain anchored to the same shoulders, with continuous gesture control.
 g=gesture
 line([(-62,159),(-92,215),(-100-25*g,249-85*g)],suit,25)
 line([(62,159),(91,213),(103+34*g,244-98*g)],suit,25)
 ellipse((-113-25*g,239-85*g,-88-25*g,262-85*g),skin)
 ellipse((90+34*g,232-98*g,116+34*g,257-98*g),skin)
 blink=(t%3.7)>3.56
 if blink:
  line([(-28,74),(-13,74)],INK,4);line([(13,74),(28,74)],INK,4)
 else:
  ellipse((-26,68,-16,79),INK);ellipse((16,68,26,79),INK)
 if mood=='worried':
  line([(-33,57),(-14,63)],INK,4);line([(14,63),(33,57)],INK,4);line([(-18,113),(0,105),(18,113)],INK,3)
 elif mood=='curious':
  line([(-34,63),(-13,54)],INK,4);line([(14,59),(34,59)],INK,4);ellipse((-6,101,7,109),INK)
 else:
  line([(-33,57),(-14,56)],INK,4);line([(14,56),(33,57)],INK,4);line([(-17,103),(0,109),(17,103)],INK,3)
 if kind=='questioner':
  c.rect((*pt(-37,63),*pt(-6,87)), '#eee7db',r=8,alpha=.23)
  line([(-37,63),(-6,63),(-6,87),(-37,87),(-37,63)],INK,3)
  line([(6,63),(37,63),(37,87),(6,87),(6,63)],INK,3);line([(-6,75),(6,75)],INK,3)

def export_cast(folder):
 folder.mkdir(parents=True,exist_ok=True)
 for kind in STYLES:
  c=Canvas(300,500);character(c,kind,150,45,t=1,gesture=.25)
  (folder/(kind+'.svg')).write_text(c.svg(),encoding='utf-8')
