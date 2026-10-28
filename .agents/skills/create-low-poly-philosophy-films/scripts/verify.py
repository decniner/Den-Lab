import json,subprocess,wave,math
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont
import os
from common import load_project
P=Path(os.environ['PHILOSOPHY_FILM_PROJECT']).resolve()
cfg,rows=load_project(P)
video=P/(cfg['output_stem']+'.mp4')
edit=json.loads((P/'scenes.json').read_text())
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(video)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'])==(cfg['width'],round(cfg['width']*16/9))
assert v['codec_name']=='h264' and a['codec_name']=='aac' and a['channels']==2
num,den=map(float,v['r_frame_rate'].split('/'));assert abs(num/den-cfg['fps'])<.001
assert abs(float(probe['format']['duration'])-edit['duration'])<.1
assert edit['duration']>=cfg['min_duration_seconds']
for s in edit['scenes']:
    assert ' '.join(w['text'] for w in s['words'])==s['text']
    assert s['start']<s['end']<=edit['duration']
    assert all(0<=w['t']<s['dur'] for w in s['words'])
subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'],check=True)
with wave.open(str(P/'dialogue.wav')) as w:
    sound=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float)/32768
    sr=w.getframerate()
    for s in edit['scenes']:
        segment=sound[round(s['start']*sr):round((s['start']+s['dur'])*sr)]
        assert np.sqrt(np.mean(segment**2))>.003
all_times=[s['start']+min(2,s['dur']/2) for s in edit['scenes']]
times=[all_times[i] for i in np.linspace(0,len(all_times)-1,min(9,len(all_times)),dtype=int)]+[max(0,edit['duration']-2)]
sheet=Image.new('RGB',(900,math.ceil(len(times)/5)*345),'#dedede')
font=ImageFont.truetype('/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf',15)
for i,t in enumerate(times):
    p=P/f'export_{i:02d}.jpg'
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(video),'-frames:v','1',str(p)],check=True)
    im=Image.open(p);im.thumbnail((180,320));sheet.paste(im,((i%5)*180,(i//5)*345))
    ImageDraw.Draw(sheet).text(((i%5)*180+8,(i//5)*345+322),f'{t:.1f}s',fill='black',font=font)
sheet.save(P/'export_contact.jpg')
report={'duration':float(probe['format']['duration']),'width':v['width'],'height':v['height'],'fps':v['r_frame_rate'],'audio_channels':a['channels'],'full_decode':'passed','caption_content':'passed','voice_presence_all_turns':'passed','turns':len(edit['scenes']),'size_MiB':round(video.stat().st_size/1048576,2)}
(P/'verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
