import os,sys,json,math
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from scipy.spatial import ConvexHull
import argparse
ap=argparse.ArgumentParser();ap.add_argument('--project',type=Path,required=True);args=ap.parse_args()
p=args.project.resolve();os.environ['PHILOSOPHY_FILM_PROJECT']=str(p);sys.path.insert(0,str(p/'pipeline/scripts'))
import render_film as r
import story_visuals
results=[]
for i in sorted(story_visuals.SHARED_TURNS):
 s=r.scenes[i]
 for frac in [.2,.5,.8]:
  t=s['start']+s['dur']*frac
  base=r.BASE.copy().convert('RGBA');r.scene3d(base,t,'two',s['speaker'])
  final=r.frame(t)
  cam=np.array([3.3+.09*math.sin(t*.18),-7.4,3.4]);target=np.array([0,0,1.05]);forward=target-cam;forward/=np.linalg.norm(forward);right=np.cross(forward,[0,0,1]);right/=np.linalg.norm(right);up=np.cross(right,forward)
  mask=Image.new('L',(r.W,r.H));d=ImageDraw.Draw(mask)
  for v,_,_ in r.world(t,s['speaker']):
   if len(v)!=70:continue
   pp=v-cam;z=pp@forward;q=np.column_stack((r.W/2+(pp@right)*1650/z,585-(pp@up)*1650/z));hull=ConvexHull(q)
   d.polygon([tuple(q[k]) for k in hull.vertices],fill=255)
  changed=np.any(np.array(final)!=np.array(base.convert('RGB')),axis=2)&(np.array(mask)>0)
  count=int(changed.sum());results.append(dict(turn=i,time=round(t,3),pixels_covered=count))
  assert count==0,(i,t,count)
(p/'face_clearance.json').write_text(json.dumps({'checks':results,'all_faces_clear':True},indent=2));print('Passed:',len(results),'checks; zero graphic pixels on either face.')
