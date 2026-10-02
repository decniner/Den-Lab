"""Copy verified output into a shareable sample bundle; never copies OAuth/state."""
import shutil
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent))
from japan_facts import research
from japan_facts.core import Store, check_artifacts, digest, now

def stamp(seconds):
    ms=round(seconds*1000); hours,ms=divmod(ms,3600000); minutes,ms=divmod(ms,60000); secs,ms=divmod(ms,1000)
    return f'{hours:02}:{minutes:02}:{secs:02},{ms:03}'

if __name__=='__main__':
    edition='japan-explained-20261003-shinkansen-v1'; store=Store('state',edition)
    with store.lock():
        state=store.load(); check_artifacts(state)
        destination=Path('deliverables')/edition; destination.mkdir(parents=True,exist_ok=True)
        for name in ('video.mp4','narration.wav','script.json','captions.json','thumbnail.png','fact-pack.json',
                     'claims-to-sources.json','candidates.json','validation.json','audio-sample.mp3'):
            shutil.copyfile(store.path/name,destination/name)
        captions=research.read(destination/'captions.json')
        srt='\n\n'.join(f"{i}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}" for i,c in enumerate(captions,1))+'\n'
        (destination/'captions.srt').write_text(srt,encoding='utf-8')
        response=state.get('upload',{}).get('response',{})
        research.write(destination/'delivery.json',{'edition':edition,'at':now().isoformat(),'mode':'live',
            'video_sha256':digest(destination/'video.mp4'),'duration':state['duration'],'narration':'generated at normal speed',
            'video_validation':'passed','visual_frames_inspected':[2.88,13.26,27.1,41.52,53.63],
            'media_inspection':state.get('inspection',{'audio_listening':'pending; assistant audio input unavailable'}),
            'upload':'API-confirmed' if response else 'not attempted', 'video_id':response.get('id'),
            'url':'https://www.youtube.com/watch?v='+response['id'] if response else None,
            'returned_visibility':response.get('status',{}).get('privacyStatus'),
            'upload_status':response.get('status',{}).get('uploadStatus'),'paid_jobs':0,'schedule_enabled':False})
        print(f'Copied verified sample to {destination}; no credential or resumable-state files included.')
