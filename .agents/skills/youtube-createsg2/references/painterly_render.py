"""Full-screen painterly revision; no native chart/line diagram rendering."""
from config import ROOT,FFMPEG
import hashlib,json,subprocess,sys
REVISION=hashlib.sha256(__file__.encode()+open(__file__,'rb').read()).hexdigest()
TITLES={'016','033','037','048','061','071','081','092','094'}
def source(s):
    folder='artwork-v2' if s['asset'].startswith('painterly-') else 'artwork'
    return ROOT/folder/(s['asset']+'.png')
def render(s,prototype=False):
    image=source(s);assert image.exists(),image
    frames=150 if prototype else round((s['end']-s['start'])*30)
    duration=frames/30;seed=int(s['id']);out=ROOT/'renders-v2'/f'{s["id"]}-{s["asset"]}{"-prototype" if prototype else ""}.mp4'
    fingerprint=hashlib.sha256((json.dumps(s,sort_keys=True)+REVISION+hashlib.sha256(image.read_bytes()).hexdigest()+str(prototype)).encode()).hexdigest()
    record=out.with_suffix('.json')
    if out.exists() and record.exists() and json.loads(record.read_text()).get('fingerprint')==fingerprint:return out
    zoom=f'1.045+0.027*on/{frames}' if seed%2 else f'1.085-0.027*on/{frames}'
    xpos=['.5',f'.2+.6*on/{frames}',f'.8-.6*on/{frames}',f'.4+.2*on/{frames}'][seed%4]
    ypos=f'.4+.2*on/{frames}' if seed%5==0 else '.5'
    vf=f"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,loop=loop=-1:size=1:start=0,setpts=N/(30*TB),zoompan=z='{zoom}':x='(iw-iw/zoom)*({xpos})':y='(ih-ih/zoom)*({ypos})':d=1:s=1920x1080:fps=30"
    f="C\\:/Windows/Fonts/georgia.ttf"
    if s['id'] in TITLES and s['id']!='094':
        title=ROOT/'scenes'/f'v2-{s["id"]}-title.txt';title.write_text(s['heading'],encoding='utf-8');path=str(title).replace('\\','/').replace(':','\\:')
        vf+=f",drawbox=x=0:y=0:w=iw:h=125:color=0x07121a@0.35:t=fill,drawtext=fontfile='{f}':textfile='{path}':fontsize=34:fontcolor=0xe9eeea:x=80:y=57:alpha='min(1,max(0,(t-.3)/.5))'"
    if s['id']=='094':
        vf+=",drawbox=x=0:y=760:w=iw:h=250:color=0x07121a@0.35:t=fill"
        for j,text in enumerate(['BUT BECAUSE OBEYING HUMANITY','IS NO LONGER PART OF ITS OBJECTIVE.']):
            vf+=f",drawtext=fontfile='{f}':text='{text}':fontsize=40:fontcolor=0xe9eeea:x=(w-tw)/2:y={810+j*60}:alpha='min(1,max(0,(t-1.0)/.8))'"
        vf+=f',fade=t=out:st={duration-1.25}:d=1.05'
    elif s['id']=='080':vf+=f',fade=t=out:st={duration-.45}:d=0.45'
    vf+=',fade=t=in:st=0:d=0.18'
    cmd=[FFMPEG,'-y','-hide_banner','-loglevel','error','-i',str(image),'-vf',vf,'-frames:v',str(frames),'-an','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-threads','2',str(out)]
    with (ROOT/'logs'/f'v2-{s["id"]}-render.log').open('wb') as log:subprocess.run(cmd,stderr=log,check=True)
    record.write_text(json.dumps({'fingerprint':fingerprint,'frames':frames,'asset':s['asset'],'visual_type':s['visual_type']}))
    print('Painted shot rendered',s['id'],s['asset'],frames,flush=True);return out
if __name__=='__main__':
    data=json.loads((ROOT/'storyboard-painterly.json').read_text())
    if 'prototype' in sys.argv:
        s=next(s for s in data['shots'] if s['id']=='002');render(s,True)
    else:
        assert (ROOT/'review/painterly-prototype-review.json').exists(),'Inspect painterly prototype first'
        reviewed=set(json.loads((ROOT/'review/painterly-art-review.json').read_text())['new_artwork_ids_reviewed'])
        if 'available' in sys.argv:
            for s in data['shots']:
                if source(s).exists() and (not s['asset'].startswith('painterly-') or s['id'] in reviewed):render(s)
            print('Available reviewed paintings rendered',flush=True)
            sys.exit(0)
        assert all(source(s).exists() for s in data['shots']),'Wait for every original artwork asset'
        assert reviewed=={s['id'] for s in data['shots'] if s['asset'].startswith('painterly-')},'Inspect all 61 new original paintings before final assembly'
        files=[ROOT/'renders/000-approved-opening.mp4']
        for s in data['shots']:
            files.append(render(s));(ROOT/'renders-v2/progress.json').write_text(json.dumps({'completed':s['id'],'total':94,'seconds':s['end']}))
        concat=ROOT/'renders-v2/concat.txt';concat.write_text('\n'.join("file '"+str(f).replace('\\','/')+"'" for f in files))
        subprocess.run([FFMPEG,'-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(concat),'-map','0:v:0','-an','-c:v','copy',str(ROOT/'renders-v2/documentary-picture.mp4')],check=True)
