"""Save an original cover preview and research bundle; this is not a video render."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent))
from japan_facts import research, production

if __name__=='__main__':
    config=research.read('config.json')
    original=Path('state/japan-explained-20261003-shinkansen-v1')
    destination=Path('deliverables/shinkansen-research-preview'); destination.mkdir(parents=True,exist_ok=True)
    for name in ('fact-pack.json','claims-to-sources.json','candidates.json','script.json'):
        research.write(destination/name,research.read(original/name))
    research.write(destination/'status.json',{'mode':'live-research-preview','research':'verified with attributed browser excerpts',
        'script':'reviewed original wording','thumbnail':'original schematic cover preview',
        'narration':'blocked by Windows voice execution security','captions':'not generated; require final narration',
        'video':'not rendered','upload':'not attempted','video_id':None,'returned_visibility':None,'paid_jobs':0})
    production.composition(destination/'cover.ass',5,[],[{'start':0,'end':5,'scene':'hook'}],config)
    production.run([production.tool(config,'ffmpeg'),'-y','-f','lavfi','-i','color=c=0x08151e:s=1080x1920:r=30:d=1',
        '-vf','setpts=PTS+1/TB,ass=cover.ass,scale=720:1280','-frames:v','1','-update','1','thumbnail.png'],30,destination)
    for scene in ('waves','sensor','brakes','limits','takeaway'):
        production.composition(destination/f'{scene}.ass',5,[],[{'start':0,'end':5,'scene':scene}],config)
        production.run([production.tool(config,'ffmpeg'),'-y','-f','lavfi','-i','color=c=0x08151e:s=1080x1920:r=30:d=1',
            '-vf',f'setpts=PTS+1/TB,ass={scene}.ass,scale=720:1280','-frames:v','1','-update','1',f'storyboard-{scene}.png'],30,destination)
    research.write(destination/'dry-run-report.json',research.read('state/local-fixture-20261003/dry-run-report.json'))
    print('Research/script bundle and original thumbnail preview saved. No narration, captions, video or upload success claimed.')
