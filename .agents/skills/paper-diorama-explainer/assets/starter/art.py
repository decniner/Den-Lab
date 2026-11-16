from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageFilter,ImageChops
import numpy as np,json,math,random
P=Path(__file__).parent;CFG=json.loads((P/'project.json').read_text());SCENE_COUNT=len(json.loads((P/'scenes.json').read_text()));W,H=1920,1080
CREAM='#f1e6cd';INK='#233d43';TEAL='#367b80';SEA='#bad2cf';RED='#bb593e';GOLD='#c69a4f';MOSS='#829579';WHITE='#fff8e8';BROWN='#775641'
SERIF=CFG.get('serif_font','/System/Library/Fonts/Supplemental/Athelas.ttc');SANS=CFG.get('sans_font','/System/Library/Fonts/Supplemental/Arial.ttf');BOLD=CFG.get('bold_font','/System/Library/Fonts/Supplemental/Arial Bold.ttf')
texture={};bounds=[];ROUTES=[]
def font(n,bold=False,serif=False):return ImageFont.truetype(SERIF if serif else BOLD if bold else SANS,n)
def rgb(c):return tuple(int(c[i:i+2],16) for i in [1,3,5])
def paper(c):
 if c not in texture:
  rng=np.random.default_rng(int(c[1:],16));noise=rng.normal(0,2.6,(H,W,1));arr=np.clip(np.array(rgb(c))[None,None,:]+noise,0,255).astype(np.uint8);im=Image.fromarray(arr,'RGB').convert('RGBA');dr=ImageDraw.Draw(im)
  for j in range(2100):
   x=int(rng.integers(W));y=int(rng.integers(H));dr.line((x,y,x+int(rng.integers(3,14)),y+1),fill=rgb(c)+(26,),width=1)
  texture[c]=im
 return texture[c]
def layer():return Image.new('RGBA',(W,H))
def cut(im,pts,c,depth=7,seed=0,rough=True):
 pts=[tuple(p) for p in pts];r=random.Random(seed+sum(int(x+y) for x,y in pts));pp=[]
 for a,b in zip(pts,pts[1:]+pts[:1]):
  n=max(1,int(math.dist(a,b)/24))
  for j in range(n):
   q=j/n;pp.append((a[0]+(b[0]-a[0])*q+r.uniform(-1.1,1.1)*(1 if rough else 0),a[1]+(b[1]-a[1])*q+r.uniform(-1.1,1.1)*(1 if rough else 0)))
 mask=Image.new('L',(W,H));ImageDraw.Draw(mask).polygon(pp,fill=255)
 if depth:
  sh=Image.new('RGBA',(W,H),(34,37,31,0));sm=ImageChops.offset(mask,depth//2,depth);sm=sm.filter(ImageFilter.GaussianBlur(depth*.85));sh.putalpha(sm.point(lambda z:int(z*.23)));im.alpha_composite(sh)
 tx=paper(c).copy();tx.putalpha(mask);im.alpha_composite(tx);ImageDraw.Draw(im).line(pp+[pp[0]],fill=(*rgb(c),190),width=2)
def rect(im,box,c,depth=7):
 x,y,x2,y2=box;cut(im,[(x,y),(x2,y),(x2,y2),(x,y2)],c,depth)
def circle(im,x,y,r,c,depth=6):cut(im,[(x+math.cos(t)*r,y+math.sin(t)*r) for t in np.linspace(0,2*math.pi,90)],c,depth)
def line(im,pts,c=INK,width=3):ImageDraw.Draw(im).line(pts,fill=c,width=width,joint='curve')
def txt(im,xy,text,size=32,c=INK,bold=False,serif=False,anchor='lt'):
 f=font(size,bold,serif);dr=ImageDraw.Draw(im);box=dr.textbbox(xy,text,font=f,anchor=anchor);assert box[0]>=20 and box[2]<=1900 and box[1]>=0 and box[3]<=1080,(text,box);bounds.append(dict(text=text,box=box));dr.text(xy,text,font=f,fill=c,anchor=anchor)
def label(im,x,y,text,c=WHITE,size=26):
 f=font(size,True);ww=f.getlength(text);rect(im,(x-13,y-9,x+ww+14,y+size+12),c,4);txt(im,(x,y),text,size,bold=True)
def ship(im,x,y,s=1,name=None,red=False):
 # Layered sixteenth-century carrack cutout; no modern steering wheel or machinery.
 def pts(v):return [(x+a*s,y+b*s) for a,b in v]
 cut(im,pts([(-108,15),(113,12),(78,68),(-68,68)]),BROWN,8)
 cut(im,pts([(-100,20),(104,20),(91,34),(-89,35)]),GOLD,3)
 line(im,pts([(-38,20),(-38,-163)]),BROWN,max(2,int(6*s)));line(im,pts([(40,20),(40,-136)]),BROWN,max(2,int(5*s)))
 for a,b,c,d in [(-94,-142,-7,-73),(-88,-66,-9,-6),(8,-117,74,-62),(12,-55,74,0)]:
  cut(im,pts([(a,b),(c,b+3),(c+4,d),(a-3,d-3)]),WHITE,5)
  line(im,pts([(a,b),(c,d)]),'#ddcfab',max(1,int(1*s)))
 cut(im,pts([(-38,-169),(3,-164),(-38,-152)]),RED if red else TEAL,3)
 line(im,pts([(-97,17),(-38,-161),(92,17)]),'#9d8e70',max(1,int(2*s)))
 if name:label(im,x-95*s,y+88*s,name,size=max(19,int(25*s)))
def person(im,x,y,s=1,c=TEAL,captain=False):
 circle(im,x,y-94*s,19*s,'#cfad83',4)
 cut(im,[(x-31*s,y-69*s),(x+28*s,y-69*s),(x+41*s,y+5*s),(x-36*s,y+5*s)],c,7)
 cut(im,[(x-32*s,y+4*s),(x+34*s,y+4*s),(x+31*s,y+24*s),(x-33*s,y+24*s)],BROWN,3)
 line(im,[(x-16*s,y+19*s),(x-22*s,y+64*s)],INK,int(12*s));line(im,[(x+16*s,y+19*s),(x+21*s,y+64*s)],INK,int(12*s))
 cut(im,[(x-28*s,y-102*s),(x+28*s,y-102*s),(x+21*s,y-116*s),(x-20*s,y-116*s)],INK,4)
 if captain:cut(im,[(x-25*s,y-65*s),(x+23*s,y-65*s),(x+10*s,y-45*s),(x-8*s,y-45*s)],GOLD,2)
 # Intentionally blank paper faces.
def wave(im,y,c,seed=0,amp=13):
 pts=[(-260,y)]+[(x,y+math.sin(x/90+seed)*amp+math.sin(x/165+seed)*amp*.4) for x in range(-260,2181,20)]+[(2180,910),(-260,910)];cut(im,pts,c,7)
def clouds(im):
 for x,y,s in [(270,360,1),(1020,330,.65),(1620,410,.8)]:
  pts=[(x-120*s,y+15*s),(x-110*s,y-8*s),(x-70*s,y-18*s),(x-47*s,y-44*s),(x-10*s,y-47*s),(x+18*s,y-15*s),(x+75*s,y-23*s),(x+110*s,y+16*s)];cut(im,pts,WHITE,5)
def port(mid,near,count=5,waves=None):
 if waves is None:waves=near
 rect(mid,(95,710,1830,862),SEA,9)
 for x,h,c in [(130,170,MOSS),(260,220,GOLD),(410,140,MOSS),(525,175,'#bba680')]:
  rect(mid,(x,610-h,x+106,610),c,6);cut(mid,[(x-15,610-h),(x+53,560-h),(x+121,610-h)],BROWN,5)
  for wy in [640-h,687-h]:rect(mid,(x+37,wy,x+63,wy+35),INK,0)
 rect(mid,(90,608,740,675),BROWN,7);clouds(mid)
 for i in range(count):ship(near,860+(i%3)*310,535+(i//3)*180,.68,red=(i==0))
 wave(waves,790,TEAL,2,12);wave(waves,850,'#285b66',1,9)
def globe(mid,near,complete=False):
 circle(mid,1250,558,280,SEA,17)
 # Paper globe is emblematic, never used for point-by-point navigation.
 for rx in [270,180,85]:
  dr=ImageDraw.Draw(mid);dr.ellipse((1250-rx,288,1250+rx,828),outline='#89adaa',width=2)
 for dy in [-145,0,145]:line(mid,[(989,558+dy),(1511,558+dy)],'#89adaa',2)
 cut(mid,[(1050,382),(1140,350),(1200,411),(1165,467),(1220,505),(1175,535),(1110,467)],MOSS,8)
 cut(mid,[(1160,534),(1240,548),(1261,608),(1226,695),(1190,751),(1164,633)],MOSS,8)
 cut(mid,[(1310,382),(1420,371),(1500,445),(1465,485),(1390,484),(1375,551),(1310,567),(1282,475)],MOSS,8)
 pts=[(1250+305*math.cos(t),558+227*math.sin(t)) for t in np.linspace(-.7,5.58 if complete else 4.1,180)];line(mid,pts,RED,9)
 ship(near,1250,745,.72,red=True)
DATA=json.loads((P/'land.geojson').read_text());POLYS=[]
for f in DATA['features']:
 g=f['geometry'];pol=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
 for rings in pol:
  if len(rings[0])>4:POLYS.append(rings[0])
ATL=[(-6.35,36.78),(-16,28),(-25,9),(-33,-5),(-40,-15),(-43.2,-22.9),(-50,-30),(-56,-38),(-64,-49.3),(-68,-52),(-72,-53),(-74,-53)]
PAC=[(-74,-53),(-79,-35),(-86,-18),(-100,-5),(-125,3),(-151,10),(-180,15),(-204,16),(-215.2,13.4),(-225,11),(-235,10.4)]
IND=[(127.4,.65),(129,-4),(126,-9),(123,-11),(115,-17),(100,-28),(80,-37),(60,-40),(40,-40),(20,-36),(12,-34),(2,-20),(-8,-3),(-23,15),(-25,25),(-15,34),(-6.35,36.78)]
def project(lon,lat,box,geo):
 x,y,x2,y2=box;lo,hi,la,lb=geo
 # Longitude must be unwrapped explicitly in route paths.
 return (x+(lon-lo)/(hi-lo)*(x2-x),y+(lb-lat)/(lb-la)*(y2-y))
def mapart(mid,geo,route,markers,box=(110,278,1810,850),tint=MOSS):
 rect(mid,(94,260,1826,874),'#d9c7a4',10);rect(mid,box,SEA,3);lo,hi,la,lb=geo;dr=ImageDraw.Draw(mid)
 for lon in range(math.floor(lo/20)*20,math.ceil(hi/20)*20+1,20):
  a=project(lon,la,box,geo);b=project(lon,lb,box,geo)
  if box[0]<=a[0]<=box[2]:line(mid,[a,b],'#a0bfbb',1)
 for lat in range(math.floor(la/20)*20,math.ceil(lb/20)*20+1,20):
  a=project(lo,lat,box,geo);b=project(hi,lat,box,geo)
  if box[1]<=a[1]<=box[3]:line(mid,[a,b],'#a0bfbb',1)
 # Geographic land geometry; clipping occurs before paper texture/shadow compositing.
 mask=Image.new('L',(W,H));md=ImageDraw.Draw(mask)
 for poly in POLYS:
  for shift in [-360,0,360]:
   pp=[project(lon+shift,lat,box,geo) for lon,lat,*_ in poly]
   if max(p[0] for p in pp)<box[0] or min(p[0] for p in pp)>box[2] or max(p[1] for p in pp)<box[1] or min(p[1] for p in pp)>box[3]:continue
   md.polygon(pp,fill=255)
 clip=Image.new('L',(W,H));ImageDraw.Draw(clip).rectangle(box,fill=255);mask=ImageChops.multiply(mask,clip)
 sh=Image.new('RGBA',(W,H),(45,58,47,0));sh.putalpha(ImageChops.offset(mask,3,7).filter(ImageFilter.GaussianBlur(5)).point(lambda z:int(z*.23)));mid.alpha_composite(sh)
 coast=ImageChops.subtract(mask,mask.filter(ImageFilter.MinFilter(5)));tx=paper(tint).copy();tx.putalpha(mask);mid.alpha_composite(tx);edge=Image.new('RGBA',(W,H),'#657e69');edge.putalpha(coast);mid.alpha_composite(edge)
 pts=[project(lon,lat,box,geo) for lon,lat in route]
 # Stitched red route, with a light paper underlay.
 if len(pts)>1:
  line(mid,pts,'#fff2d0',11);line(mid,pts,RED,6)
  for a,b in zip(pts,pts[1:]):
   d=math.dist(a,b)
   for q in np.arange(0,1,13/max(d,1)):
    x=a[0]+(b[0]-a[0])*q;y=a[1]+(b[1]-a[1])*q;ImageDraw.Draw(mid).ellipse((x-1,y-1,x+1,y+1),fill=WHITE)
 for n,(lon,lat,lab,dx,dy) in enumerate(markers):
  x,y=project(lon,lat,box,geo);circle(mid,x,y,16,RED,4);txt(mid,(x,y),str(n+1),19,c=WHITE,bold=True,anchor='mm');label(mid,x+dx,y+dy,lab,size=24)
 txt(mid,(140,824),'SCHEMATIC ROUTE · MODERN COASTLINES',20,c=INK)
 ROUTES.extend(pts);return pts

def make(s):
 kind=s['kind'];ROUTES.clear();mid=layer();near=layer();waves=layer();header=layer();bg=paper(CREAM).copy()
 # Fine deckled mat, consistent throughout the film.
 rect(mid,(78,252,1842,882),'#e4d4b5',5)
 if kind in ['opening','closing','legacy']:
  globe(mid,near,kind!='opening')
  if kind=='opening':
   txt(mid,(150,365),'THE FIRST',48,serif=True);txt(mid,(150,427),'VOYAGE',100,serif=True);txt(mid,(150,536),'AROUND',100,serif=True);txt(mid,(150,645),'THE WORLD',100,serif=True);label(mid,158,798,'A STORY IN PAPER',TEAL,23)
  elif kind=='closing':
   person(mid,325,540,1.3,TEAL,True);person(mid,660,540,1.3,RED,True);txt(mid,(325,662),'MAGELLAN',34,bold=True,anchor='mt');txt(mid,(325,715),'Led the departure',27,anchor='mt');txt(mid,(660,662),'ELCANO',34,bold=True,anchor='mt');txt(mid,(660,715),'Completed the circuit',27,anchor='mt');txt(mid,(145,818),'A crew’s achievement, not one man’s voyage.',26,serif=True)
  else:
   rect(mid,(150,354,820,796),WHITE,9)
   for i,t in enumerate(['A navigable circuit','The scale of the Pacific','Navigation and survival','Conquest and coercion']):txt(mid,(190,404+i*89),t,34,serif=True)
 elif kind=='motive':
  rect(mid,(170,325,1025,801),WHITE,13);txt(mid,(220,366),'THE SPICE ISLANDS',39,bold=True);txt(mid,(220,428),'Cloves • commerce • competition',30)
  for x,y,sz in [(370,610,1),(580,590,1.1),(760,630,.8)]:
   line(mid,[(x,y+65*sz),(x-17*sz,y-48*sz)],BROWN,16);circle(mid,x-22*sz,y-60*sz,28*sz,BROWN,4);cut(mid,[(x-10*sz,y),(x+50*sz,y-35*sz),(x+25*sz,y+22*sz)],MOSS,5)
  for j in range(4):
   for i in range(j+2):circle(near,1230+i*75,745-j*26,36,GOLD,5)
  person(mid,1480,490,1.15,TEAL,True);label(mid,1230,817,'SPAIN SEEKS A WESTERN ROUTE',size=23)
 elif kind=='port':port(mid,near,waves=waves)
 elif kind=='atlantic':
  mapart(mid,(-90,25,-60,60),ATL[:6],[(-6.35,36.78,'SANLÚCAR',-20,-62),(-43.2,-22.9,'BRAZIL',25,0)]);ship(near,1050,642,.65,red=True)
 elif kind in ['winter','loss']:
  rect(mid,(95,273,1830,870),'#c7d3cd',4)
  cut(mid,[(95,560),(315,350),(530,590),(710,425),(910,620),(1110,455),(1430,590),(1830,420),(1830,870),(95,870)],'#8b9b90',8)
  cut(mid,[(95,705),(420,630),(850,690),(1250,630),(1830,745),(1830,875),(95,875)],'#b7b6a3',9)
  for x in range(160,1800,120):line(mid,[(x,320),(x-46,410)],'#e7eddf',3)
  if kind=='winter':
   ship(near,1150,665,.9,red=True);ship(near,1490,710,.68);person(mid,380,635,1.1,TEAL,True);person(mid,620,670,.85,RED);label(mid,220,752,'SAN JULIÁN · PATAGONIAN WINTER',size=25)
  else:
   cut(mid,[(430,645),(690,680),(680,717),(505,711)],BROWN,10);line(mid,[(540,676),(505,558)],BROWN,8);cut(mid,[(515,565),(600,594),(546,630)],WHITE,6);ship(near,1180,650,.86,red=True);label(mid,320,752,'SANTIAGO WRECKED · FOUR SHIPS CONTINUE',size=27)
  wave(waves,820,TEAL,0,14)
 elif kind=='strait':
  rect(mid,(105,276,1815,868),SEA,5)
  cut(mid,[(110,280),(1800,280),(1800,450),(1570,462),(1490,520),(1270,508),(1180,565),(1040,552),(956,615),(760,588),(625,666),(425,630),(320,716),(110,670)],MOSS,15)
  cut(mid,[(110,830),(330,788),(470,716),(675,742),(808,676),(1005,706),(1130,637),(1285,663),(1440,605),(1620,650),(1815,601),(1815,867),(110,867)],'#a5ae8a',15)
  pts=[(1720,540),(1520,569),(1300,583),(1120,603),(955,651),(760,638),(590,704),(390,693),(180,760)];line(mid,pts,WHITE,12);line(mid,pts,RED,6)
  label(mid,620,335,'MAINLAND SOUTH AMERICA',size=27);label(mid,1070,785,'TIERRA DEL FUEGO',size=27);label(mid,188,798,'PACIFIC',size=24);label(mid,1580,698,'ATLANTIC',size=24);ship(near,920,626,.35,red=True);txt(mid,(160,303),'SCHEMATIC STRAIT INSET',20)
 elif kind in ['pacific','crossing']:
  if kind=='pacific':
   rect(mid,(95,273,1830,866),SEA,5);circle(mid,1520,407,62,GOLD,4);clouds(mid)
   for x,y,ss in [(500,610,1),(1050,690,.8),(1530,650,.7)]:ship(near,x,y,ss,red=x==500)
   wave(mid,745,'#83aca9',2);wave(waves,823,TEAL,0);label(mid,150,302,'THREE SHIPS · A VAST OCEAN',size=28)
  else:
   mapart(mid,(-265,-65,-65,60),PAC,[(-74,-53,'SOUTH AMERICA',-280,-26),(-215.2,13.4,'GUAM',-20,-70)]);ship(near,1000,617,.65,red=True);label(mid,820,735,'HUNGER · SCURVY · DISTANCE',size=27)
 elif kind=='islands':
  mapart(mid,(110,155,-12,28),[(144.8,13.4),(137,12),(129,11),(125,10)],[(144.8,13.4,'GUAM',-40,-68),(125,10,'PHILIPPINES',-150,40)]);ship(near,1040,630,.7,red=True)
 elif kind=='mactan':
  rect(mid,(95,273,1830,870),SEA,5);cut(mid,[(850,460),(1130,390),(1420,445),(1830,390),(1830,870),(850,870),(780,680)],'#c4bd91',14);cut(mid,[(1110,310),(1470,290),(1830,310),(1830,460),(1530,430),(1330,475),(1080,420)],MOSS,9)
  for x,y in [(1100,610),(1335,660),(1560,580)]:
   circle(mid,x,y-80,17,'#b38c64',4)
   cut(mid,[(x-25,y-59),(x+25,y-59),(x+31,y+7),(x-30,y+7)],'#b38c64',5)
   cut(mid,[(x-32,y+1),(x+31,y+1),(x+24,y+26),(x-26,y+26)],RED,5)
   line(mid,[(x-13,y+24),(x-18,y+63)],BROWN,10);line(mid,[(x+13,y+24),(x+18,y+63)],BROWN,10)
   line(mid,[(x+43,y+57),(x+43,y-88)],BROWN,4)
   cut(mid,[(x+43,y-105),(x+37,y-83),(x+49,y-83)],'#e2d9c2',3)
   line(mid,[(x-18,y-88),(x+18,y-88)],TEAL,7)
   cut(mid,[(x-48,y-37),(x-27,y-41),(x-25,y+12),(x-47,y+17)],GOLD,5)
  person(near,585,692,1.1,TEAL,True);ship(mid,290,520,.55,red=True);label(mid,1100,760,'MACTAN · LAPULAPU’S FORCES',size=26);label(mid,200,800,'MAGELLAN’S JOURNEY ENDS HERE',WHITE,27)
 elif kind=='handover':
  rect(mid,(105,280,1815,866),SEA,5);ship(mid,600,570,1,'TRINIDAD');ship(near,1290,570,1,'VICTORIA',True);person(mid,1290,783,.54,RED,True);label(mid,475,790,'TWO SHIPS REMAIN',size=28);label(mid,1170,330,'ELCANO: VICTORIA’S CAPTAIN',size=25)
 elif kind=='tidore':
  rect(mid,(105,280,1815,867),SEA,5);cut(mid,[(105,626),(465,560),(750,620),(1090,595),(1815,650),(1815,867),(105,867)],'#c4bd91',11);cut(mid,[(270,600),(560,310),(850,610)],MOSS,14)
  ship(near,1240,570,.95,red=True);ship(mid,1590,610,.6);rect(mid,(250,706,700,825),BROWN,9)
  for x in [315,430,545,650]:line(mid,[(x,776),(x-8,728)],'#c69a4f',7);circle(mid,x-12,718,14,BROWN,3)
  label(mid,195,313,'TIDORE · MALUKU',size=30);label(mid,960,790,'CLOVES LOADED',size=28)
 elif kind=='split':
  rect(mid,(110,286,910,862),WHITE,11);rect(mid,(1010,286,1810,862),SEA,11);ship(mid,515,562,1.1,'TRINIDAD');ship(near,1410,562,1.1,'VICTORIA',True)
  txt(mid,(510,325),'EASTWARD ATTEMPT',31,bold=True,anchor='mt');txt(mid,(1410,325),'WESTWARD RETURN',31,bold=True,anchor='mt');txt(mid,(510,754),'Repairs → Pacific → failed return',27,anchor='mt');txt(mid,(1410,754),'Indian Ocean → Africa → Spain',27,anchor='mt')
  line(mid,[(520,440),(750,440)],INK,7);cut(mid,[(752,439),(726,425),(726,453)],INK,0);line(mid,[(1420,440),(1190,440)],RED,7);cut(mid,[(1188,439),(1215,425),(1215,453)],RED,0)
 elif kind=='indian':
  mapart(mid,(-35,145,-55,50),IND,[(127.4,.65,'TIDORE',-170,-70),(18.5,-34.5,'CAPE OF GOOD HOPE',-175,28),(-6.35,36.78,'SPAIN',24,0)]);ship(near,1080,690,.63,red=True)
 elif kind=='return':
  port(mid,near,0,waves);ship(near,1250,610,1.27,'VICTORIA',True);label(mid,180,306,'SANLÚCAR · 6 SEPTEMBER 1522',WHITE,30);label(mid,180,692,'18 ORIGINAL EXPEDITION MEMBERS',WHITE,29);txt(mid,(190,748),'Seville: 8 September',26)
 elif kind=='ledger':
  names=['SANTIAGO','SAN ANTONIO','CONCEPCIÓN','TRINIDAD','VICTORIA'];states=['Wrecked','Turned back','Burned','Return failed','Circumnavigated']
  for i in range(5):
   x=270+i*345;ship(mid,x,526,.72,red=i==4);txt(mid,(x,665),names[i],27,bold=True,anchor='mt');txt(mid,(x,721),states[i],26,c=RED if i==4 else INK,anchor='mt')
  txt(mid,(960,817),'ONE OF FIVE SHIPS COMPLETED THE CIRCUIT',29,bold=True,anchor='mt')
 else:raise ValueError(kind)
 # Fixed editorial hierarchy, never moved by the camera.
 txt(header,(94,56),CFG['series_title'],23,bold=True);txt(header,(1825,56),f"{s['id']:02d} / {SCENE_COUNT:02d}",23,bold=True,anchor='rt');txt(header,(94,107),s['title'],57,serif=True);txt(header,(98,187),s['kicker'],25,c=RED,bold=True)
 line(header,[(94,231),(1826,231)],'#c7b898',2);line(header,[(94,1031),(1826,1031)],'#c7b898',2);txt(header,(94,1045),'A HANDMADE HISTORY  ·  '+CFG['years'],19);txt(header,(1826,1045),'ROUTES SIMPLIFIED · NOT FOR NAVIGATION',19,anchor='rt')
 return bg,mid,near,waves,header
if __name__=='__main__':
 out=P/CFG.get('asset_dir','assets');out.mkdir(exist_ok=True)
 for s in json.loads((P/'scenes.json').read_text()):
  layers=make(s)
  (out/f"{s['id']:02d}-motion.json").write_text(json.dumps(dict(route_points=ROUTES)))
  for name,im in zip(['base','middle','front','waves','type'],layers):im.save(out/f"{s['id']:02d}-{name}.png")
  im=layers[0].copy()
  for a in layers[1:]:im.alpha_composite(a)
  im.convert('RGB').save(out/f"{s['id']:02d}-poster.jpg",quality=94);print('Built',s['id'],s['kind'],flush=True)
 (P/'text-bounds.json').write_text(json.dumps(bounds,indent=2))
