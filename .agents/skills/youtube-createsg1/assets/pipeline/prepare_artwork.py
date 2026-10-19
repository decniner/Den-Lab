"""Derive ordered pencil contours from finished paintings; preserve source PNGs."""
from config import ROOT
from PIL import Image, ImageOps, ImageFilter
import json, math

SIZE=(1920,1080)
NAMES=['scene01-corporation','scene02-boardroom','scene03-takeover','scene04-final']
def fit_art(name):
    original=Image.open(ROOT/'artwork'/f'{name}.png').convert('RGB')
    paper=original.getpixel((0,0))
    image=Image.new('RGB',SIZE,paper)
    painting=ImageOps.contain(original,SIZE,Image.Resampling.LANCZOS)
    image.paste(painting,((SIZE[0]-painting.width)//2,(SIZE[1]-painting.height)//2))
    return image

def simplify(points,tolerance=.9):
    keep={0,len(points)-1}; pending=[(0,len(points)-1)]
    while pending:
        first,last=pending.pop()
        if last<=first+1: continue
        a=points[first]; b=points[last]; dx=b[0]-a[0]; dy=b[1]-a[1]; den=dx*dx+dy*dy
        worst=0; idx=None
        for i in range(first+1,last):
            p=points[i]
            u=0 if not den else max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den))
            dist=(p[0]-a[0]-u*dx)**2+(p[1]-a[1]-u*dy)**2
            if dist>worst: worst=dist; idx=i
        if worst>tolerance*tolerance:
            keep.add(idx); pending.extend([(first,idx),(idx,last)])
    return [points[i] for i in sorted(keep)]

def priority(name,points,w,h):
    x=sum(p[0] for p in points)/len(points)/w; y=sum(p[1] for p in points)/len(points)/h
    if name=='scene01-corporation':
        if .3<x<.82 and y<.8: return 0
        if x<.37 and y>.45: return 1
        return 2
    if name=='scene02-boardroom':
        if y<.30: return 0
        if y<.68 and (x<.32 or x>.77 or .39<x<.51 or .68<x<.8): return 1
        return 2
    if name=='scene03-takeover':
        return 0 if .18<x<.65 and y>.3 else 1
    return 0

def trace(name):
    image=fit_art(name); w,h=800,450
    gray=ImageOps.grayscale(image.resize((w,h),Image.Resampling.LANCZOS)).filter(ImageFilter.GaussianBlur(.45))
    edge=gray.filter(ImageFilter.FIND_EDGES); pix=edge.load(); lum=gray.load()
    nodes={(x,y) for y in range(12,h-12) for x in range(12,w-12) if pix[x,y]>44 and lum[x,y]<218}
    original_count=len(nodes)
    neighbors=[(-1,-1),(0,-1),(1,-1),(-1,0),(1,0),(-1,1),(0,1),(1,1)]
    paths=[]
    for start in sorted(nodes,key=lambda p:(p[1],p[0])):
        if start not in nodes: continue
        p=start; nodes.remove(p); chain=[p]; direction=None
        while len(chain)<350:
            candidates=[(p[0]+dx,p[1]+dy) for dx,dy in neighbors if (p[0]+dx,p[1]+dy) in nodes]
            if not candidates: break
            if direction:
                q=max(candidates,key=lambda q:((q[0]-p[0])*direction[0]+(q[1]-p[1])*direction[1])/math.dist(p,q))
            else: q=min(candidates,key=lambda q:(q[1],q[0]))
            direction=(q[0]-p[0],q[1]-p[1]); p=q; nodes.remove(p); chain.append(p)
        face=False
        mx=sum(p[0] for p in chain)/len(chain)/w; my=sum(p[1] for p in chain)/len(chain)/h
        if name=='scene02-boardroom': face=(.14<mx<.32 and .28<my<.58) or (.78<mx<.95 and .25<my<.57) or (.40<mx<.52 and .34<my<.62) or (.68<mx<.81 and .33<my<.64)
        if name=='scene03-takeover': face=(.30<mx<.48 and .21<my<.48) or (.54<mx<.65 and .26<my<.48)
        if len(chain)>=(4 if face else 10):
            points=simplify(chain)
            length=sum(math.dist(a,b) for a,b in zip(points,points[1:]))
            paths.append(dict(points=points,length=length,group=priority(name,points,w,h),face=face))
    # Favor meaningful contours; watercolor grain isn't treated as pencil ink.
    paths=sorted(paths,key=lambda p:p['length']*(5 if p['face'] else 1),reverse=True)[:950]
    ordered=[]; cursor=(w*.5,h*.15)
    for group in sorted({p['group'] for p in paths}):
        remaining=[p for p in paths if p['group']==group]
        while remaining:
            p=min(remaining,key=lambda p:min(math.dist(cursor,p['points'][0]),math.dist(cursor,p['points'][-1])))
            remaining.remove(p)
            if math.dist(cursor,p['points'][-1])<math.dist(cursor,p['points'][0]): p['points'].reverse()
            cursor=p['points'][-1]
            # One corner-cutting pass softens pixel-grid steps in the derived curves.
            source=p['points']; smooth=[source[0]]
            for a,b in zip(source,source[1:]):
                smooth.extend([(a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25),(a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75)])
            smooth.append(source[-1])
            ordered.append(dict(points=[[round(x*1920/w,3),round(y*1080/h,3)] for x,y in smooth],group=p['group'],width=1.6,color='#555246'))
    (ROOT/'paths'/f'{name}.json').write_text(json.dumps(ordered,separators=(',',':')))
    from PIL import ImageDraw
    sketch=Image.new('RGB',SIZE,image.getpixel((0,0))); d=ImageDraw.Draw(sketch)
    for p in ordered: d.line([tuple(v) for v in p['points']],fill=p['color'],width=2,joint='curve')
    sketch.save(ROOT/'review'/f'{name}-derived-contours.png')
    print(name,'edge pixels',original_count,'ordered contours',len(ordered),flush=True)
    return dict(name=name,source_size=list(Image.open(ROOT/'artwork'/f'{name}.png').size),contours=len(ordered),method='Strong raster edges linked into polylines, simplified, grouped and ordered; approximate derived contours, not original artist brush strokes')

if __name__=='__main__':
    report=[trace(name) for name in NAMES if (ROOT/'artwork'/f'{name}.png').exists()]
    (ROOT/'review/contour-preparation.json').write_text(json.dumps(report,indent=2))
