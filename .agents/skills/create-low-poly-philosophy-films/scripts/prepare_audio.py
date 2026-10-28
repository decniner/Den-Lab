import asyncio,json,os,ssl,subprocess,wave
from pathlib import Path
import edge_tts,edge_tts.communicate
from common import load_project,fingerprint,align_words
P=Path(os.environ['PHILOSOPHY_FILM_PROJECT']).resolve();cfg,rows=load_project(P)
for key in ['SSL_CERT_FILE','REQUESTS_CA_BUNDLE']:
    value=os.environ.get(key)
    if value and Path(value).is_file():edge_tts.communicate._SSL_CTX.load_verify_locations(value)
(P/'audio').mkdir(exist_ok=True)
async def one(i,row):
    p=P/'audio'/f'{i:02d}.mp3';wordfile=p.with_suffix('.json');cache=p.with_suffix('.cache');wanted=fingerprint(row,cfg)
    if not(p.exists() and p.stat().st_size>100 and wordfile.exists() and cache.exists() and cache.read_text()==wanted):
        prefix='human' if row['who']=='HUMAN' else 'ai'
        for attempt in range(3):
            words=[];partial=p.with_suffix('.partial.mp3')
            try:
                with partial.open('wb') as out:
                    async for ch in edge_tts.Communicate(row['text'],cfg[prefix+'_voice'],rate=cfg[prefix+'_rate'],boundary='WordBoundary').stream():
                        if ch['type']=='audio':out.write(ch['data'])
                        elif ch['type']=='WordBoundary':words.append({'t':ch['offset']/1e7,'dur':ch['duration']/1e7,'text':ch['text']})
                if not words or partial.stat().st_size<100:raise ValueError('Narration returned no speech')
                os.replace(partial,p);wordfile.write_text(json.dumps(words));cache.write_text(wanted);break
            except Exception:
                partial.unlink(missing_ok=True)
                if attempt==2:raise
                await asyncio.sleep(1)
    wav=p.with_suffix('.wav');subprocess.run(['ffmpeg','-v','error','-y','-i',str(p),'-ar','48000','-ac','1',str(wav)],check=True)
    with wave.open(str(wav)) as f:dur=f.getnframes()/f.getframerate()
    print(f'Voice {i+1}/{len(rows)} ready',flush=True)
    return {'speaker':row['who'],'text':row['text'],'scene':row['scene'],'chapter':row.get('chapter',''),'pause':row['pause'],'dur':dur,'file':str(wav),'words':align_words(row['text'],json.loads(wordfile.read_text()),dur)}
async def main():
    sem=asyncio.Semaphore(3)
    async def limited(i,r):
        async with sem:return await one(i,r)
    scenes=await asyncio.gather(*(limited(i,r) for i,r in enumerate(rows)));cursor=cfg['lead_in_seconds']
    for s in scenes:s['start']=cursor;cursor+=s['dur']+s['pause'];s['end']=cursor
    duration=cursor+cfg['tail_seconds']
    if duration<cfg['min_duration_seconds']:raise ValueError(f'Natural runtime is {duration:.1f}s; extend the dialogue to meet the requested minimum rather than padding or stretching it')
    with wave.open(str(P/'dialogue.wav'),'wb') as out:
        out.setparams((1,2,48000,0,'NONE','not compressed'));out.writeframes(bytes(round(cfg['lead_in_seconds']*48000)*2))
        for s in scenes:
            with wave.open(s['file']) as f:out.writeframes(f.readframes(f.getnframes()))
            out.writeframes(bytes(round(s['pause']*48000)*2))
        out.writeframes(bytes(round(cfg['tail_seconds']*48000)*2))
    (P/'scenes.json').write_text(json.dumps({'duration':duration,'scenes':scenes},indent=2))
    print(f'Natural runtime: {duration:.2f}s',flush=True)
if __name__=='__main__':asyncio.run(main())
