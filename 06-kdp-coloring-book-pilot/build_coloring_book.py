from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase.pdfmetrics import stringWidth
from math import sin, cos, pi
from pathlib import Path

OUT=Path(__file__).parent
W,H=letter
INK=HexColor('#20252A')
ACCENT=HexColor('#D95B4B')
PALE=HexColor('#F2E8D8')

SCENES=[
('Tokyo','Shibuya Crossing','A bustling crossing with a friendly cat guide.'),
('Mount Fuji','A Day by the Lake','Fuji, clouds, a boat and a curious duck.'),
('Kyoto','Torii Gate Trail','A winding path beneath tall shrine gates.'),
('Spring','Sakura Picnic','A picnic blanket under a flowering tree.'),
('Hokkaido','Snowy Shiba','A playful pup discovers fresh snow.'),
('Nara','Deer Park','A gentle deer visits a lantern garden.'),
('On the Rails','Bullet Train','A smiling train races past the mountains.'),
('At the Table','Ramen Time','A big bowl of noodles with toppings to color.'),
('Ocean','Koi Pond','Koi swim below a little arched bridge.'),
('Kyoto','Pagoda Garden','A five-story pagoda among clouds and flowers.'),
('Festival','Lantern Night','Lanterns, a fan and festival music.'),
('Good Fortune','Daruma Day','A daruma doll surrounded by lucky stars.'),
('Osaka','Takoyaki Stand','A street-food stall with a chef and snack tray.'),
('Countryside','Tea Time','A teapot and cups beside rolling hills.'),
('Tokyo','Lucky Cat Shop','A welcoming maneki-neko at a tiny shop.'),
('Castle Town','Samurai Castle','A castle tower, flags and a stone path.'),
('Garden','The Little Bridge','A stepping-stone path over a quiet stream.'),
('Lunchbox','Bento Picnic','A bento box filled with cheerful shapes.'),
('Island','Beach Day','A crab, shells and a seaside umbrella.'),
('Winter','Snow Monkey Soak','A monkey relaxes in a warm spring.'),
('Origami','Paper Crane','A large folded crane among paper stars.'),
('At Home','Tanuki Garden','A round tanuki rests beside a flower pot.'),
('Market','Fresh Strawberries','A market basket full of fruit and flowers.'),
('Music','Taiko Parade','A big drum, sticks and festival streamers.'),
('Morning','Mt. Fuji Sunrise','Sun rays, clouds and a tiny shrine.'),
('Adventure','Forest Fox','A fox finds a path through bamboo.'),
('On the Table','Sushi Friends','A plate of sushi, chopsticks and tea.'),
('City Lights','Tokyo Tower','A tall tower above rooftops and stars.'),
('Playtime','Robot Helper','An original friendly box-shaped robot.'),
('The Journey','Japan Adventure Map','A playful route linking sea, city and mountain.'),
]

def setup(c):
    c.setLineWidth(2.4); c.setLineCap(1); c.setLineJoin(1); c.setStrokeColor(INK); c.setFillColor(white)

def line(c,x1,y1,x2,y2,lw=None):
    if lw: c.setLineWidth(lw)
    c.line(x1,y1,x2,y2)

def ellipse(c,x,y,rx,ry=None,fill=0):
    ry=ry or rx; c.ellipse(x-rx,y-ry,x+rx,y+ry,stroke=1,fill=fill)

def circle(c,x,y,r,fill=0): ellipse(c,x,y,r,r,fill)

def arc(c,x,y,rx,ry,start,extent): c.arc(x-rx,y-ry,x+rx,y+ry,start,extent)

def poly(c,pts,close=True,fill=0):
    p=c.beginPath(); p.moveTo(*pts[0])
    for xy in pts[1:]: p.lineTo(*xy)
    if close: p.close()
    c.drawPath(p,stroke=1,fill=fill)

def cloud(c,x,y,s=1):
    c.setLineWidth(2.2)
    p=c.beginPath(); p.moveTo(x-38*s,y)
    p.curveTo(x-53*s,y+3*s,x-51*s,y+24*s,x-31*s,y+25*s)
    p.curveTo(x-27*s,y+48*s,x+2*s,y+49*s,x+12*s,y+31*s)
    p.curveTo(x+31*s,y+38*s,x+46*s,y+22*s,x+34*s,y+8*s)
    p.curveTo(x+30*s,y+2*s,x+20*s,y,x+12*s,y)
    c.drawPath(p,stroke=1,fill=0)

def flower(c,x,y,r=8):
    for a in range(5):
        t=2*pi*a/5; circle(c,x+cos(t)*r*.72,y+sin(t)*r*.72,r*.44)
    circle(c,x,y,r*.34)

def mountain(c,x,y,s=1):
    poly(c,[(x-155*s,y-45*s),(x-28*s,y+90*s),(x+5*s,y+54*s),(x+37*s,y+88*s),(x+150*s,y-45*s)])
    poly(c,[(x-28*s,y+90*s),(x-4*s,y+61*s),(x+5*s,y+70*s),(x+15*s,y+55*s),(x+37*s,y+88*s)],False)
    # snow cap details, light inner ridges
    line(c,x-100*s,y-5*s,x-30*s,y+58*s,1.4); line(c,x+62*s,y-5*s,x+11*s,y+55*s,1.4)

def tree(c,x,y,s=1, sakura=False):
    c.rect(x-9*s,y-90*s,18*s,125*s,stroke=1,fill=0)
    for dx,dy,r in [(-46,42,38),(0,72,45),(47,43,38),(-22,18,36),(24,18,36)]:
        circle(c,x+dx*s,y+dy*s,r*s)
    if sakura:
        for dx,dy in [(-48,42),(0,72),(45,42),(-23,18),(23,18)]: flower(c,x+dx*s,y+dy*s,7*s)

def torii(c,x,y,s=1):
    c.setLineWidth(8); c.line(x-100*s,y-65*s,x-100*s,y+65*s); c.line(x+100*s,y-65*s,x+100*s,y+65*s)
    c.setLineWidth(12); c.line(x-135*s,y+65*s,x+135*s,y+65*s); c.setLineWidth(7); c.line(x-115*s,y+35*s,x+115*s,y+35*s)
    c.setLineWidth(2.4)
    for px in [x-100*s,x+100*s]: line(c,px,y-65*s,px,y-83*s)

def pagoda(c,x,y,s=1):
    for i,(ww,yy) in enumerate([(150,0),(122,48),(96,95),(72,140),(50,184)]):
        c.rect(x-ww*s*.36,y+yy*s,ww*s*.72,31*s,stroke=1,fill=0)
        poly(c,[(x-ww*s*.67,y+(yy+30)*s),(x,y+(yy+46)*s),(x+ww*s*.67,y+(yy+30)*s)],False)
        circle(c,x,y+(yy+48)*s,4*s)
    line(c,x,y+230*s,x,y+270*s)

def shiba(c,x,y,s=1):
    # body, head, ears, legs, curled tail
    ellipse(c,x,y,75*s,43*s); circle(c,x+55*s,y+45*s,38*s)
    poly(c,[(x+28*s,y+68*s),(x+24*s,y+118*s),(x+54*s,y+87*s)])
    poly(c,[(x+65*s,y+70*s),(x+88*s,y+112*s),(x+91*s,y+65*s)])
    ellipse(c,x+67*s,y+33*s,24*s,15*s)
    circle(c,x+45*s,y+50*s,3*s); circle(c,x+72*s,y+50*s,3*s); circle(c,x+61*s,y+36*s,4*s)
    arc(c,x-57*s,y+36*s,31*s,28*s,200,300)
    for dx in [-42,26]: c.roundRect(x+dx*s,y-50*s,18*s,34*s,6*s,stroke=1,fill=0)

def cat(c,x,y,s=1):
    # Friendly seated cat with a clear silhouette and uncluttered coloring areas.
    c.roundRect(x-55*s,y-115*s,110*s,115*s,28*s,stroke=1,fill=0)
    circle(c,x,y+34*s,49*s)
    poly(c,[(x-43*s,y+61*s),(x-42*s,y+116*s),(x-7*s,y+77*s)])
    poly(c,[(x+7*s,y+77*s),(x+42*s,y+116*s),(x+43*s,y+61*s)])
    circle(c,x-18*s,y+39*s,3.8*s); circle(c,x+18*s,y+39*s,3.8*s)
    poly(c,[(x-8*s,y+22*s),(x+8*s,y+22*s),(x,y+13*s)])
    arc(c,x,y+12*s,11*s,8*s,200,140)
    line(c,x-35*s,y+24*s,x-65*s,y+29*s,1.5); line(c,x-35*s,y+13*s,x-64*s,y+8*s,1.5)
    line(c,x+35*s,y+24*s,x+65*s,y+29*s,1.5); line(c,x+35*s,y+13*s,x+64*s,y+8*s,1.5)
    arc(c,x+55*s,y-80*s,38*s,42*s,265,245)
    # paws and simple chest detail
    arc(c,x-26*s,y-100*s,22*s,15*s,0,180); arc(c,x+26*s,y-100*s,22*s,15*s,0,180)

def deer(c,x,y,s=1):
    ellipse(c,x,y,68*s,40*s); ellipse(c,x+57*s,y+45*s,34*s,28*s)
    circle(c,x+70*s,y+51*s,3*s); ellipse(c,x+89*s,y+36*s,20*s,12*s)
    for dx in [-45,33]: c.roundRect(x+dx*s,y-56*s,15*s,45*s,5*s,stroke=1,fill=0)
    line(c,x+44*s,y+67*s,x+31*s,y+110*s); line(c,x+31*s,y+110*s,x+19*s,y+124*s)
    line(c,x+67*s,y+69*s,x+80*s,y+108*s); line(c,x+80*s,y+108*s,x+94*s,y+119*s)

def train(c,x,y,s=1):
    # front-on friendly shinkansen
    p=c.beginPath(); p.moveTo(x-100*s,y-85*s); p.lineTo(x-100*s,y+40*s); p.curveTo(x-100*s,y+115*s,x-48*s,y+145*s,x,y+145*s); p.curveTo(x+48*s,y+145*s,x+100*s,y+115*s,x+100*s,y+40*s); p.lineTo(x+100*s,y-85*s); p.close(); c.drawPath(p,stroke=1,fill=0)
    line(c,x-100*s,y+25*s,x+100*s,y+25*s,5)
    for dx in [-45,45]: ellipse(c,x+dx*s,y+82*s,23*s,30*s)
    c.roundRect(x-60*s,y-65*s,36*s,35*s,8*s,stroke=1,fill=0); c.roundRect(x+24*s,y-65*s,36*s,35*s,8*s,stroke=1,fill=0)
    line(c,x-82*s,y-86*s,x+82*s,y-86*s,5)

def bowl(c,x,y,s=1, label='RAMEN'):
    p=c.beginPath(); p.moveTo(x-120*s,y+25*s); p.lineTo(x-95*s,y-75*s); p.curveTo(x-75*s,y-102*s,x+75*s,y-102*s,x+95*s,y-75*s); p.lineTo(x+120*s,y+25*s); p.close(); c.drawPath(p,stroke=1,fill=0)
    arc(c,x,y+25*s,120*s,28*s,180,180)
    for dx,dy in [(-55,45),(-10,53),(39,40)]: ellipse(c,x+dx*s,y+dy*s,24*s,15*s)
    for i in range(3): arc(c,x-35*s+i*35*s,y+95*s,17*s,36*s,20,145)

def sushi(c,x,y,s=1):
    for i in range(3):
        xx=x+(i-1)*95*s
        c.roundRect(xx-38*s,y-30*s,76*s,62*s,14*s,stroke=1,fill=0)
        c.roundRect(xx-37*s,y+20*s,74*s,38*s,12*s,stroke=1,fill=0)
        for dx in [-12,10]: circle(c,xx+dx*s,y+35*s,4*s)

def lantern(c,x,y,s=1):
    c.roundRect(x-34*s,y-65*s,68*s,115*s,18*s,stroke=1,fill=0)
    line(c,x-26*s,y+22*s,x+26*s,y+22*s); line(c,x-24*s,y-34*s,x+24*s,y-34*s)
    line(c,x,y+50*s,x,y+70*s); line(c,x-40*s,y+70*s,x+40*s,y+70*s,4)
    line(c,x,y-65*s,x,y-95*s); poly(c,[(x-20*s,y-95*s),(x,y-122*s),(x+20*s,y-95*s)],False)

def castle(c,x,y,s=1):
    c.rect(x-78*s,y-96*s,156*s,104*s,stroke=1,fill=0)
    for i,(ww,yy) in enumerate([(180,8),(145,52),(108,96)]):
        poly(c,[(x-ww*s/2,y+yy*s),(x,y+(yy+22)*s),(x+ww*s/2,y+yy*s)],False)
        c.rect(x-ww*s*.35,y+(yy-43)*s,ww*s*.7,44*s,stroke=1,fill=0)
    c.rect(x-16*s,y+118*s,32*s,30*s,stroke=1,fill=0)
    line(c,x,y+148*s,x,y+177*s)

def daruma(c,x,y,s=1):
    ellipse(c,x,y,76*s,91*s); arc(c,x,y+13*s,52*s,47*s,195,150)
    circle(c,x-24*s,y+33*s,5*s); circle(c,x+24*s,y+33*s,5*s)
    arc(c,x,y+15*s,18*s,12*s,200,140)
    for side in [-1,1]:
        circle(c,x+side*51*s,y-14*s,11*s)
    for yy in [-48,-60]: arc(c,x,y+yy*s,38*s,7*s,0,180)

def bridge(c,x,y,s=1):
    p=c.beginPath(); p.moveTo(x-150*s,y-50*s); p.curveTo(x-90*s,y+110*s,x+90*s,y+110*s,x+150*s,y-50*s); c.drawPath(p,stroke=1,fill=0)
    line(c,x-150*s,y-50*s,x+150*s,y-50*s)
    for dx in [-100,-50,0,50,100]: line(c,x+dx*s,y-50*s,x+dx*s,y+30*s,1.5)
    for i in range(4): arc(c,x-90*s+i*60*s,y-110*s,48*s,35*s,0,180)

def robot(c,x,y,s=1):
    c.roundRect(x-75*s,y-72*s,150*s,130*s,25*s,stroke=1,fill=0)
    c.roundRect(x-59*s,y+58*s,118*s,92*s,22*s,stroke=1,fill=0)
    circle(c,x-25*s,y+105*s,6*s); circle(c,x+25*s,y+105*s,6*s)
    arc(c,x,y+92*s,20*s,12*s,200,140)
    line(c,x,y+150*s,x,y+175*s); circle(c,x,y+181*s,7*s)
    for dx in [-100,100]: line(c,x+dx*.65*s,y+23*s,x+dx*s,y-4*s)
    c.roundRect(x-101*s,y-17*s,24*s,48*s,9*s,stroke=1,fill=0); c.roundRect(x+77*s,y-17*s,24*s,48*s,9*s,stroke=1,fill=0)
    c.roundRect(x-55*s,y-115*s,36*s,45*s,10*s,stroke=1,fill=0); c.roundRect(x+19*s,y-115*s,36*s,45*s,10*s,stroke=1,fill=0)

def sun(c,x,y,r=35):
    circle(c,x,y,r)
    for a in range(0,360,45):
        t=a*pi/180; line(c,x+cos(t)*(r+9),y+sin(t)*(r+9),x+cos(t)*(r+22),y+sin(t)*(r+22),1.5)

def stars(c,x,y,s=1):
    for dx,dy,r in [(-135,70,13),(130,110,17),(145,-35,11),(-145,-15,9)]:
        poly(c,[(x+dx*s+cos(a*pi/180)*r*s,y+dy*s+sin(a*pi/180)*r*s) for a in range(0,360,72)])

def scene_art(c,idx):
    # Each scene combines original vector objects; central composition remains generous and easy to color.
    c.saveState(); setup(c)
    c.setLineWidth(2.4)
    x,y=306,438
    # ground and sky accents
    if idx in [1,6,24]: mountain(c,x,y-60,1.0)
    if idx==0:
        sun(c,115,586,27); cat(c,306,438,.82); cloud(c,470,595,.9)
        # simple shop fronts and crossing stripes
        for xx in [95,500]:
            c.rect(xx-35,402,70,126,stroke=1,fill=0); c.rect(xx-43,530,86,20,stroke=1,fill=0)
            c.rect(xx-18,425,36,55,stroke=1,fill=0)
        for j in range(5): poly(c,[(95+j*85,270),(135+j*85,270),(152+j*85,315),(112+j*85,315)],False)
    elif idx==1:
        mountain(c,x,460,1.1); sun(c,115,610,28); cloud(c,454,620,1)
        arc(c,x,255,230,48,0,180); ellipse(c,405,252,38,22); poly(c,[(395,254),(415,254),(405,270)])
        line(c,83,222,529,222,1.5)
    elif idx==2:
        for yy in [315,405,495,585]: torii(c,x,yy,.8)
        tree(c,116,360,.75,True); tree(c,500,360,.75,True); line(c,170,255,442,255)
    elif idx==3:
        tree(c,306,420,1.05,True); c.roundRect(200,268,220,80,18,stroke=1,fill=0)
        line(c,310,268,310,348); line(c,200,308,420,308)
        sun(c,105,604,25); flower(c,151,249,12); flower(c,466,264,13)
    elif idx==4:
        shiba(c,300,370,1.15); cloud(c,130,600,1); cloud(c,470,618,.85)
        for xx in [120,480]:
            poly(c,[(xx-28,300),(xx,365),(xx+28,300)])
            line(c,xx,300,xx,260)
        sun(c,510,520,18)
    elif idx==5:
        deer(c,306,372,1.25); lantern(c,120,380,.75); lantern(c,493,380,.75)
        tree(c,82,497,.65,True); tree(c,530,497,.65,True); line(c,90,255,520,255)
    elif idx==6:
        train(c,306,360,1.25); mountain(c,306,585,.65); cloud(c,125,590,.75); cloud(c,490,600,.7)
        for xx in [110,500]:
            line(c,xx,265,xx,344,2); line(c,xx-20,274,xx+20,274,2)
    elif idx==7:
        bowl(c,306,365,1.25); c.setLineWidth(5); line(c,410,558,515,430,4); line(c,435,570,535,440,4)
        sun(c,130,586,24); cloud(c,475,620,.75)
    elif idx==8:
        for xx,yy,ss in [(208,376,1),(334,465,.8),(398,337,.75)]:
            ellipse(c,xx,yy,72*ss,31*ss); poly(c,[(xx-55*ss,yy),(xx-100*ss,yy+35*ss),(xx-95*ss,yy-15*ss)])
            circle(c,xx+35*ss,yy+8*ss,3*ss)
        bridge(c,306,360,.8); flower(c,130,290,14); flower(c,489,306,14)
    elif idx==9:
        pagoda(c,306,278,1.02); tree(c,117,345,.62,True); tree(c,495,345,.62,True)
        cloud(c,160,610,.75); cloud(c,455,620,.75)
    elif idx==10:
        for xx,yy in [(150,555),(306,600),(460,552)]: lantern(c,xx,yy,.8)
        for j in range(7): line(c,85+j*70,655,150+j*44,738,1.2)
        c.ellipse(190,276,420,390,stroke=1,fill=0); c.rect(190,276,230,65,stroke=1,fill=0)
        for xx in [240,370]: c.ellipse(xx-31,270,xx+31,332,stroke=1,fill=0)
        stars(c,x,430,1)
    elif idx==11:
        daruma(c,306,414,1.35); stars(c,x,440,1.1); flower(c,136,330,15); flower(c,475,348,15)
    elif idx==12:
        c.rect(115,320,382,175,stroke=1,fill=0); c.rect(95,495,422,28,stroke=1,fill=0)
        for xx in [150,250,360,460]: c.rect(xx-22,390,44,68,stroke=1,fill=0)
        c.rect(205,275,200,65,stroke=1,fill=0)
        for xx in [250,306,362]: circle(c,xx,342,7)
        circle(c,306,572,57); ellipse(c,306,570,33,22); circle(c,292,580,4); circle(c,320,580,4)
        poly(c,[(261,609),(266,650),(291,620)]); poly(c,[(323,620),(349,650),(351,609)])
    elif idx==13:
        ellipse(c,306,360,120,75); arc(c,306,360,120,75,0,180); c.rect(270,430,72,50,stroke=1,fill=0)
        for xx in [140,470]: c.roundRect(xx-40,320,80,90,14,stroke=1,fill=0)
        flower(c,130,560,16); flower(c,480,565,14); mountain(c,306,590,.55)
    elif idx==14:
        cat(c,306,370,1.3); c.rect(165,285,282,28,stroke=1,fill=0); c.rect(200,313,212,35,stroke=1,fill=0)
        for xx in [130,482]: lantern(c,xx,476,.65)
        stars(c,x,438,.85)
    elif idx==15:
        castle(c,306,350,1.2); mountain(c,306,595,.55); tree(c,120,350,.65); tree(c,490,350,.65)
        line(c,185,255,427,255)
    elif idx==16:
        bridge(c,306,355,1.05); tree(c,105,430,.72,True); tree(c,505,430,.72,True)
        for xx in [230,380]: ellipse(c,xx,250,24,10)
        flower(c,155,275,13); flower(c,465,282,12)
    elif idx==17:
        c.roundRect(140,318,332,183,25,stroke=1,fill=0); line(c,140,440,472,440)
        for xx in [205,306,407]:
            circle(c,xx,394,30); circle(c,xx,374,13); circle(c,xx-12,403,4); circle(c,xx+12,403,4)
        for xx in [220,306,392]:
            c.roundRect(xx-28,458,56,30,8,stroke=1,fill=0)
        flower(c,115,560,14); flower(c,500,560,14)
    elif idx==18:
        sun(c,470,606,33); c.arc(80,250,535,440,0,180); c.rect(115,292,385,18,stroke=1,fill=0)
        # umbrella
        arc(c,210,470,92,70,0,180); line(c,118,470,302,470); line(c,210,470,210,312)
        for xx in [360,425]:
            poly(c,[(xx-28,300),(xx,330),(xx+28,300),(xx+20,270),(xx-20,270)])
            circle(c,xx-10,300,3); circle(c,xx+10,300,3)
        for xx in [125,500]:
            poly(c,[(xx-14,266),(xx,287),(xx+14,266)],False)
    elif idx==19:
        # monkey face in onsen
        ellipse(c,306,434,93,91); ellipse(c,306,415,43,34); circle(c,275,452,7); circle(c,337,452,7)
        ellipse(c,306,415,13,8); arc(c,306,402,20,13,200,140)
        for xx in [205,405]: circle(c,xx,455,31)
        arc(c,306,308,208,73,0,180); line(c,98,308,514,308,3)
        for xx in [156,456]: cloud(c,xx,583,.55)
    elif idx==20:
        # large stylized origami crane
        poly(c,[(130,430),(270,500),(352,445),(492,513),(390,390),(490,350),(345,370),(280,320),(240,403)])
        line(c,270,500,240,403); line(c,352,445,390,390); line(c,345,370,280,320)
        poly(c,[(130,430),(87,453),(108,410)],False); circle(c,143,438,4)
        for xx,yy in [(170,580),(435,580),(300,620)]:
            poly(c,[(xx,yy+20),(xx+5,yy+5),(xx+20,yy),(xx+5,yy-5),(xx,yy-20),(xx-5,yy-5),(xx-20,yy),(xx-5,yy+5)])
    elif idx==21:
        # round tanuki with leaf
        ellipse(c,306,388,110,117); ellipse(c,306,360,65,46); circle(c,275,414,5); circle(c,337,414,5)
        ellipse(c,306,390,20,13); arc(c,306,370,25,17,200,140)
        poly(c,[(205,470),(214,530),(263,494)]); poly(c,[(349,494),(398,530),(407,470)])
        c.roundRect(423,290,90,110,18,stroke=1,fill=0); flower(c,468,420,12)
    elif idx==22:
        c.roundRect(168,303,276,210,26,stroke=1,fill=0)
        for xx in [220,280,340,400]:
            circle(c,xx,425,35); line(c,xx-25,388,xx+25,388)
        tree(c,120,490,.58,True); sun(c,470,606,23)
        for xx in [240,306,372]: flower(c,xx,282,10)
    elif idx==23:
        c.ellipse(206,330,406,530,stroke=1,fill=0); c.ellipse(225,350,387,510,stroke=1,fill=0)
        for xx in [260,306,352]: c.roundRect(xx-13,300,26,82,7,stroke=1,fill=0)
        for xx in [120,490]:
            line(c,xx,520,xx,630,2); poly(c,[(xx,625),(xx+60,600),(xx,580)],False)
        stars(c,x,480,.7)
    elif idx==24:
        sun(c,306,625,48); mountain(c,306,476,1.15); torii(c,306,294,.65)
        cloud(c,122,550,.72); cloud(c,488,555,.72)
    elif idx==25:
        # fox among bamboo
        ellipse(c,306,365,76,51); circle(c,365,425,43)
        poly(c,[(331,454),(332,512),(369,470)]); poly(c,[(384,470),(423,505),(411,446)])
        ellipse(c,385,408,25,16); circle(c,353,435,4); circle(c,377,435,4)
        poly(c,[(298,365),(210,425),(250,342),(190,300),(305,324)])
        for xx in [110,165,470,520]:
            line(c,xx,265,xx,650,2); line(c,xx-18,390,xx+18,390,1.5); line(c,xx-18,500,xx+18,500,1.5)
        flower(c,120,280,13); flower(c,488,278,13)
    elif idx==26:
        sushi(c,306,408,1.02); c.roundRect(208,292,196,38,12,stroke=1,fill=0)
        for xx in [120,490]: lantern(c,xx,510,.58)
        # tea cup, kept separate from the sushi plate
        c.roundRect(127,278,82,52,10,stroke=1,fill=0); arc(c,215,306,20,18,270,180); arc(c,168,334,35,9,0,180)
    elif idx==27:
        # stylized Tokyo tower
        poly(c,[(306,686),(217,260),(395,260)])
        for yy,ww in [(595,116),(500,93),(400,67),(320,35)]:
            line(c,306-ww/2,yy,306+ww/2,yy,3)
        for yy in [535,445,355]: line(c,258,yy,354,yy,1.5)
        for xx,yy in [(130,330),(484,350),(110,445),(495,480)]:
            c.rect(xx-31,yy,62,105,stroke=1,fill=0); poly(c,[(xx-40,yy+105),(xx,yy+130),(xx+40,yy+105)],False)
        stars(c,x,570,.8)
    elif idx==28:
        robot(c,306,390,1.15); stars(c,x,448,.8); cloud(c,125,600,.75); cloud(c,490,605,.75)
    elif idx==29:
        # map-inspired route illustration with original simple landmarks
        c.ellipse(105,280,507,630,stroke=1,fill=0)
        mountain(c,390,500,.55); pagoda(c,170,355,.45); torii(c,405,355,.42)
        p=c.beginPath(); p.moveTo(170,325); p.curveTo(250,270,310,335,350,370); p.curveTo(390,410,330,485,389,500); c.setDash(5,6); c.drawPath(p,stroke=1,fill=0); c.setDash()
        for xx,yy in [(170,325),(350,370),(389,500)]: circle(c,xx,yy,8)
        sun(c,150,575,23); cloud(c,455,575,.65)
    # decorative frame with rounded corners
    c.setLineWidth(1.2); c.roundRect(60,245,492,430,22,stroke=1,fill=0)
    c.restoreState()

def draw_header(c,idx):
    loc,title,desc=SCENES[idx]
    c.setFillColor(ACCENT); c.setFont('Helvetica-Bold',10); c.drawString(65,735,f'{idx+1:02d}  /  {loc.upper()}')
    c.setFillColor(INK); c.setFont('Helvetica-Bold',23); c.drawString(65,704,title)
    c.setFont('Helvetica',10.5); c.setFillColor(HexColor('#50565A')); c.drawString(65,685,desc)
    c.setStrokeColor(PALE); c.setLineWidth(2); c.line(65,672,547,672)
    c.setFillColor(ACCENT); c.setFont('Helvetica-Bold',9); c.drawCentredString(W/2,218,'COLOR • NOTICE • IMAGINE')
    c.setFillColor(HexColor('#65696C')); c.setFont('Helvetica',8.5); c.drawCentredString(W/2,202,'One-sided pages help keep markers from showing through.')

def build_interior(path):
    c=canvas.Canvas(str(path),pagesize=letter,pageCompression=1)
    c.setTitle('Cute Japan Adventures: A Coloring Book for Curious Kids')
    c.setAuthor('Den')
    # 1 title
    setup(c); c.setFillColor(ACCENT); c.setFont('Helvetica-Bold',11); c.drawCentredString(W/2,706,'A COLORING ADVENTURE')
    c.setFillColor(INK); c.setFont('Helvetica-Bold',33); c.drawCentredString(W/2,650,'CUTE JAPAN')
    c.drawCentredString(W/2,610,'ADVENTURES')
    c.setFont('Helvetica',15); c.drawCentredString(W/2,578,'A coloring book for curious kids')
    c.roundRect(115,244,382,280,28,stroke=1,fill=0); mountain(c,306,375,.9); torii(c,306,285,.45); shiba(c,240,320,.48); cat(c,369,320,.42); sun(c,420,460,25); cloud(c,180,465,.65)
    c.setFont('Helvetica-Bold',12); c.drawCentredString(W/2,202,'30 ORIGINAL SCENES  •  SINGLE-SIDED PAGES')
    c.setFont('Helvetica',10); c.drawCentredString(W/2,177,'Created by Den'); c.showPage()
    # 2 note
    setup(c); c.setFillColor(ACCENT); c.setFont('Helvetica-Bold',12); c.drawString(72,700,'A NOTE FOR GROWN-UPS')
    c.setFillColor(INK); c.setFont('Helvetica-Bold',24); c.drawString(72,654,'Little pages, big imagination.')
    c.setFont('Helvetica',13); c.drawString(72,614,'This book contains 30 original Japan-inspired scenes,')
    c.drawString(72,592,'with a blank reverse side after every coloring page.')
    c.drawString(72,550,'For best results, place a sheet behind the page when')
    c.drawString(72,528,'using markers. Crayons and colored pencils work well.')
    c.setStrokeColor(PALE); c.setLineWidth(2); c.line(72,490,540,490)
    c.setFont('Helvetica-Bold',13); c.drawString(72,452,'AI-created illustrations')
    c.setFont('Helvetica',11); c.drawString(72,427,'Some artwork in this book was created with AI tools and')
    c.drawString(72,408,'reviewed and assembled for this coloring-book edition.')
    c.setFont('Helvetica',10); c.setFillColor(HexColor('#60666A')); c.drawString(72,90,'This is an independent original work and is not affiliated with any Japanese organization.')
    c.showPage()
    # 3 ownership page
    setup(c); c.setFillColor(INK); c.setFont('Helvetica-Bold',25); c.drawCentredString(W/2,650,'THIS BOOK BELONGS TO')
    c.setLineWidth(1.6); c.line(105,555,507,555); c.line(105,478,507,478); c.drawCentredString(W/2,410,'My favorite page is')
    c.line(105,360,507,360); c.setFont('Helvetica',11); c.setFillColor(HexColor('#62686B')); c.drawCentredString(W/2,300,'Draw a little picture here!')
    c.roundRect(180,115,252,145,20,stroke=1,fill=0); c.showPage()
    # 4 instructions
    setup(c); c.setFillColor(ACCENT); c.setFont('Helvetica-Bold',12); c.drawString(72,700,'READY, SET, COLOR!')
    c.setFillColor(INK); c.setFont('Helvetica-Bold',25); c.drawString(72,654,'Your Japan adventure')
    steps=[('1','Pick a scene','Choose a favorite place, animal or snack.'),('2','Make it yours','Use any colors you like. There are no wrong answers.'),('3','Try the back','Add your own drawing on a blank reverse page.'),('4','Explore','Can you spot the mountain, gate, train and lucky cat?')]
    yy=585
    for n,h,t in steps:
        circle(c,91,yy+4,16); c.setFont('Helvetica-Bold',11); c.drawCentredString(91,yy,n)
        c.setFont('Helvetica-Bold',15); c.drawString(125,yy+9,h); c.setFont('Helvetica',11); c.drawString(125,yy-11,t); yy-=92
    c.showPage()
    # 30 art pages each followed by blank back: total 64 pages
    for i in range(30):
        setup(c); draw_header(c,i); scene_art(c,i); c.showPage()
        setup(c); c.setStrokeColor(PALE); c.setLineWidth(.6); c.line(66,55,546,55); c.setFillColor(HexColor('#A1A4A4')); c.setFont('Helvetica',8); c.drawCentredString(W/2,39,'A blank page for your own ideas'); c.showPage()
    c.save()

def build_cover(path):
    # KDP full wrap for 64-page, 8.5 x 11, black ink, white paper, no bleed interior.
    page_count=64; spine=page_count*0.002252; bleed=.125
    cw=bleed+8.5+spine+8.5+bleed; ch=11+2*bleed
    c=canvas.Canvas(str(path),pagesize=(cw*72,ch*72),pageCompression=1)
    c.setTitle('Cute Japan Adventures — KDP Paperback Cover')
    # background
    c.setFillColor(HexColor('#FFF8EC')); c.rect(0,0,cw*72,ch*72,stroke=0,fill=1)
    # back panel (left)
    c.setFillColor(INK); c.setFont('Helvetica-Bold',17); c.drawString(.42*72,10.3*72,'A little trip to Japan!')
    c.setFont('Helvetica',11); c.setFillColor(HexColor('#363A3B'))
    lines=['Color a friendly train, a lucky cat,','Mt. Fuji, festival lanterns and more.','', 'Inside you’ll find:', '• 30 original Japan-inspired scenes','• One-sided coloring pages','• A blank page behind each picture','• Big shapes for little artists']
    yy=9.82
    for txt in lines:
        if txt.startswith('•'): c.setFont('Helvetica',10)
        else: c.setFont('Helvetica',11)
        c.drawString(.42*72,yy*72,txt); yy-=.31 if txt else .15
    # illustrative back decoration
    c.setStrokeColor(ACCENT); c.setLineWidth(2)
    for xx,yy in [(1.1,2.0),(2.1,2.55),(3.0,1.9),(4.1,2.4)]:
        c.circle(xx*72,yy*72,.28*72,stroke=1,fill=0)
    # reserve barcode area bottom right of back cover
    c.setFillColor(white); c.rect((.25+8.5-2.15)*72,.35*72,2*72,1.2*72,stroke=0,fill=1)
    # spine strip
    sx=(bleed+8.5)*72
    c.setFillColor(HexColor('#D95B4B')); c.rect(sx,0,spine*72,ch*72,stroke=0,fill=1)
    # front panel
    fx=(bleed+8.5+spine)*72
    c.setFillColor(ACCENT); c.setFont('Helvetica-Bold',10); c.drawCentredString(fx+4.25*72,10.55*72,'A COLORING ADVENTURE')
    c.setFillColor(INK); c.setFont('Helvetica-Bold',32); c.drawCentredString(fx+4.25*72,9.82*72,'CUTE JAPAN')
    c.drawCentredString(fx+4.25*72,9.25*72,'ADVENTURES')
    c.setFont('Helvetica',14); c.drawCentredString(fx+4.25*72,8.83*72,'A Coloring Book for Curious Kids')
    # colorful original cover illustration, arranged as a simple landscape
    c.setFillColor(HexColor('#DDEFF2')); c.roundRect(fx+1.0*72,3.2*72,6.5*72,4.8*72,24,stroke=0,fill=1)
    # sun and distant Mt. Fuji
    c.setFillColor(HexColor('#F4C96B')); c.circle(fx+5.9*72,7.15*72,.38*72,stroke=0,fill=1)
    c.setFillColor(HexColor('#7AA7B2')); c.setStrokeColor(HexColor('#7AA7B2')); poly(c,[(fx+1.35*72,4.95*72),(fx+3.65*72,7.25*72),(fx+5.95*72,4.95*72)])
    c.setFillColor(white); c.setStrokeColor(white); poly(c,[(fx+3.18*72,6.78*72),(fx+3.65*72,7.25*72),(fx+4.12*72,6.78*72),(fx+3.88*72,6.87*72),(fx+3.65*72,6.72*72),(fx+3.43*72,6.9*72)])
    # green foreground hill and water
    c.setFillColor(HexColor('#9FCB9B')); c.setStrokeColor(HexColor('#9FCB9B')); c.ellipse(fx+1.0*72,3.35*72,fx+7.5*72,5.15*72,stroke=0,fill=1)
    c.setFillColor(HexColor('#93C7D4')); c.setStrokeColor(HexColor('#93C7D4')); c.ellipse(fx+1.35*72,3.25*72,fx+7.25*72,4.15*72,stroke=0,fill=1)
    # red shrine gate
    c.setFillColor(HexColor('#C95645')); c.rect(fx+3.08*72,4.12*72,.17*72,1.35*72,stroke=0,fill=1); c.rect(fx+5.02*72,4.12*72,.17*72,1.35*72,stroke=0,fill=1); c.rect(fx+2.8*72,5.43*72,2.68*72,.19*72,stroke=0,fill=1); c.rect(fx+3.02*72,5.03*72,2.22*72,.11*72,stroke=0,fill=1)
    # playful flowers as small color accents
    c.setStrokeColor(HexColor('#D95B4B')); c.setLineWidth(2)
    for xx,yy in [(1.55,4.15),(6.85,4.25),(2.05,5.0),(6.3,5.0)]:
        c.circle(fx+xx*72,yy*72,.13*72,stroke=1,fill=0)
    # border on the art panel
    c.setStrokeColor(INK); c.setLineWidth(1.5); c.roundRect(fx+1.0*72,3.2*72,6.5*72,4.8*72,24,stroke=1,fill=0)
    c.setFillColor(INK); c.setFont('Helvetica-Bold',11); c.drawCentredString(fx+4.25*72,2.65*72,'30 ORIGINAL SCENES  •  SINGLE-SIDED PAGES')
    c.setFont('Helvetica',10); c.drawCentredString(fx+4.25*72,2.35*72,'Created by Den')
    c.showPage(); c.save()

if __name__=='__main__':
    build_interior(OUT/'cute-japan-adventures-interior.pdf')
    build_cover(OUT/'cute-japan-adventures-cover.pdf')
    print('built', OUT/'cute-japan-adventures-interior.pdf')
    print('built', OUT/'cute-japan-adventures-cover.pdf')
