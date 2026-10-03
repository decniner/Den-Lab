"""Neural voice discovery, immutable cached audio and explicit preview selection."""
import hashlib
import html
import math
import os
import re
import shutil
import subprocess
import sys
import uuid
import wave
from pathlib import Path
from .core import Failure, Store, canonical, digest, now
from .research import read, write

PREVIEW_TEXT=("Let's take a closer look at Japan. Imagine a trip from Tokyo to Kyoto, "
              "then Osaka and Shinjuku. You have 3 days, a sample budget of 2,500 yen, "
              "and a departure at 8:15. Those numbers are just examples. "
              "Now, here's the interesting part: an earthquake warning detects shaking "
              "that has already started. It doesn't predict the earthquake.")

def verify_resource(resource,keys,key,region):
    if resource.get('kind')!='SpeechServices' or resource.get('sku',{}).get('name')!='F0':
        raise Failure('Azure narration requires an existing SpeechServices F0 resource. Paid SKUs are blocked; no tier upgrade is performed.')
    if resource.get('location','').lower()!=region.lower() or not key or key not in (keys.get('key1'),keys.get('key2')):
        raise Failure('Azure key/region does not match the verified F0 resource. No speech request started.')

def find_voice(voices,name):
    found=next((v for v in voices if v.get('ShortName')==name),None)
    if not found: raise Failure('Selected voice is not in the current provider voice list; retrieve voices and select again.')
    return found

def settings(config,voice,provider):
    cfg=config.get('speech_settings',config)
    unknown=set(cfg)-{'rate_percent','pitch_hz','volume_percent','style','style_degree','sentence_pause_ms'} if 'speech_settings' in config else set()
    if unknown: raise Failure('Unsupported speech delivery setting.')
    rate=cfg.get('rate_percent',0); pitch=cfg.get('pitch_hz',0); volume=cfg.get('volume_percent',0)
    degree=cfg.get('style_degree',.8); pause=cfg.get('sentence_pause_ms',0); style=cfg.get('style','neutral')
    if any(type(v) not in (int,float) or not math.isfinite(v) for v in (rate,pitch,volume,degree,pause)) or not -10<=rate<=10 or not -2<=pitch<=2 or not -10<=volume<=0 or not .5<=degree<=1.2 or not 0<=pause<=350:
        raise Failure('Speech rate/pitch/volume/emphasis/pauses outside restrained supported ranges; edit the script instead of accelerating speech.')
    if style!='neutral' and (provider!='azure-speech' or style not in voice.get('StyleList',[])):
        raise Failure('Delivery style is not advertised by this provider/voice.')
    if provider=='edge-tts' and pause: raise Failure('edge-tts does not support custom SSML pauses; use natural punctuation.')
    return {'rate_percent':rate,'pitch_hz':pitch,'volume_percent':volume,'style':style,'style_degree':degree,'sentence_pause_ms':pause}

def map_words(text,events,duration):
    words=[]; cursor=0; previous=-1
    for event in events:
        try:
            value=html.unescape(event['text']).strip(); start=event['start']
            index=text.casefold().find(value.casefold(),cursor)
            if not value or index<0 or type(start) not in (int,float) or not math.isfinite(start) or not 0<=start<duration or start<previous:
                raise ValueError()
            # Provider events must cover the original transcript, not skip spoken words.
            if re.search(r'\w',text[cursor:index]): raise ValueError()
            words.append({'text':text[index:index+len(value)],'start':start,'index':index,'count':len(value)})
            cursor=index+len(value); previous=start
        except (KeyError,TypeError,ValueError): raise Failure('Neural word events do not map to the original transcript/audio clock. No guessed caption timing is allowed.')
    if not words or re.search(r'\w',text[cursor:]): raise Failure('Neural word events do not cover the complete transcript.')
    return words

def selection_binding(provider,voice,delivery,preview_sha):
    return hashlib.sha256(canonical({'provider':provider,'voice':voice,'settings':delivery,'preview_sha256':preview_sha})).hexdigest()

def speech_config(config):
    provider=config.get('tts_provider','azure-speech')
    if provider not in ('azure-speech','edge-tts'): raise Failure('Choose azure-speech or experimental edge-tts for neural narration.')
    if provider=='edge-tts' and not config.get('edge_experimental_opt_in'):
        raise Failure('edge-tts requires explicit experimental opt-in. It is a community integration, not an official Microsoft API.')
    return {k:config[k] for k in ('tts_provider','voice','speech_settings','azure_region','azure_resource_id','edge_experimental_opt_in') if k in config}

def worker(config,operation,directory,text=None,voice=None,delivery=None):
    directory=Path(directory); directory.mkdir(parents=True,exist_ok=True)
    job=directory/'request.json'; result=directory/'response.json'
    nonce=uuid.uuid4().hex
    result.unlink(missing_ok=True)
    write(job,{'request_id':nonce,'operation':operation,'config':speech_config(config),'text':text,'voice':voice,'settings':delivery})
    try:
        completed=subprocess.run([sys.executable,'-m','japan_facts.speech_worker',str(job.resolve()),str(result.resolve())],
            capture_output=True,text=True,timeout=95,check=False)
    except (OSError,subprocess.TimeoutExpired) as exc:
        raise Failure('Neural provider timed out after 95 seconds. No fallback or automatic synthesis retry was attempted.') from exc
    if not result.is_file(): raise Failure('Neural provider exited without a response. Check optional dependencies; no fallback used.')
    response=read(result)
    if response.get('request_id')!=nonce: raise Failure('Neural provider response is stale or belongs to another request; no live result accepted.')
    if completed.returncode or response.get('error'): raise Failure(response.get('error','Neural provider failed; no fallback used.'))
    return response

def voice_list(config,root='voice-previews'):
    result=worker(config,'list',Path(root)/'discovery')
    voices=result.get('voices')
    if not isinstance(voices,list) or not voices or any(not v.get('ShortName') or not v.get('Locale') for v in voices):
        raise Failure('Live neural voice list was empty or malformed; no voice IDs assumed.')
    write(Path(root)/'voices.json',{'provider':config['tts_provider'],'retrieved_at':now().isoformat(),'voices':voices})
    return voices

def cached_audio(config,text,voice,delivery,cache_root='speech-cache'):
    from .production import run, tool, wav_seconds, word_captions
    provider=config['tts_provider']
    key=hashlib.sha256(canonical({'schema':1,'provider':provider,'voice':voice['ShortName'],'settings':delivery,'text':text})).hexdigest()
    cache=Store(cache_root,key)
    with cache.lock():
        wav=cache.path/'audio.wav'; timing=cache.path/'words.json'; manifest=cache.path/'cache.json'
        if manifest.exists():
            record=read(manifest)
            if digest(wav)!=record['audio_sha256'] or digest(timing)!=record['word_sha256']:
                raise Failure('Cached narration changed or is corrupt; inspect/remove only this cache entry before retrying.')
            return wav,timing,record['duration'],True
        result=None
        # Recover completed synthesis when a later local conversion/validation step
        # failed. Bind both records to this exact cache identity; never reuse discovery.
        if (cache.path/'request.json').exists() and (cache.path/'response.json').exists():
            request=read(cache.path/'request.json'); prior=read(cache.path/'response.json')
            identity={'schema':1,'provider':request.get('config',{}).get('tts_provider'),
                      'voice':(request.get('voice') or {}).get('ShortName'),'settings':request.get('settings'),'text':request.get('text')}
            if request.get('operation')=='synthesize' and request.get('request_id') and prior.get('request_id')==request['request_id'] and hashlib.sha256(canonical(identity)).hexdigest()==key and not prior.get('error'):
                if prior.get('audio_file') in ('provider.wav','provider.mp3') and (cache.path/prior['audio_file']).is_file(): result=prior
        if result is None: result=worker(config,'synthesize',cache.path,text,voice,delivery)
        raw=cache.path/result['audio_file']
        run([tool(config,'ffmpeg'),'-y','-i',raw,'-map','0:a:0','-ac','1','-ar','24000','-c:a','pcm_s16le',wav],30)
        duration=wav_seconds(wav)
        if not math.isfinite(duration) or duration<=0 or duration>90: raise Failure('Neural audio duration is invalid or exceeded the bounded narration request.')
        words=map_words(text,result['events'],duration)
        # Native word indices/clock are required for auditions; phone-caption layout
        # is validated only when creating the full video from the selected voice.
        word_captions(text,words,duration,0)
        write(timing,words)
        write(manifest,{'schema':1,'key':key,'provider':provider,'voice':voice['ShortName'],'settings':delivery,
                        'duration':duration,'audio_sha256':digest(wav),'word_sha256':digest(timing),'created_at':now().isoformat()})
        return wav,timing,duration,False

def choose_previews(voices,provider):
    english=[v for v in voices if v['Locale']=='en-US' and 'Neural' in v.get('VoiceType',v['ShortName'])]
    if len(english)<3: raise Failure('Need three current English neural voices for comparable previews.')
    selected=[]
    preferences=[('conversational-1',['en-US-JennyNeural','en-US-AvaMultilingualNeural','en-US-AriaNeural'],['chat','friendly']),
                 ('conversational-2',['en-US-AndrewMultilingualNeural','en-US-GuyNeural','en-US-EmmaMultilingualNeural'],['chat','friendly']),
                 ('documentary',['en-US-GuyNeural','en-US-RyanMultilingualNeural','en-US-DavisNeural'],['narration-professional','documentary','newscast'])]
    for label,names,styles in preferences:
        available=[v for v in english if v['ShortName'] not in [x['voice']['ShortName'] for x in selected]]
        voice=next((v for name in names for v in available if v['ShortName']==name),available[0])
        style=next((s for s in styles if s in voice.get('StyleList',[])),'neutral') if provider=='azure-speech' else 'neutral'
        selected.append({'label':label,'voice':voice,'settings':settings({'style':style,'rate_percent':-3 if label=='documentary' else 0},voice,provider)})
    return selected

def previews(config,root='voice-previews'):
    voices=voice_list(config,root); chosen=choose_previews(voices,config['tts_provider']); root=Path(root)
    write(root/'passage.json',{'text':PREVIEW_TEXT,'numbers':'Illustrative pronunciation examples, not reported travel facts.'})
    entries=[]
    for item in chosen:
        wav,words,duration,hit=cached_audio(config,PREVIEW_TEXT,item['voice'],item['settings'],config.get('speech_cache','speech-cache'))
        target=root/(item['label']+'.wav'); shutil.copyfile(wav,target)
        shutil.copyfile(words,root/(item['label']+'.words.json'))
        entries.append({'label':item['label'],'provider':config['tts_provider'],'voice':item['voice']['ShortName'],
                        'settings':item['settings'],'path':str(target.resolve()),'duration':duration,'sha256':digest(target),'cache_hit':hit})
    report={'created_at':now().isoformat(),'purpose':'private voice audition only','passage':PREVIEW_TEXT,'previews':entries,
            'selection':'pending user choice','video_regenerated':False,'upload':'not attempted','paid_jobs':0}
    write(root/'previews.json',report); return report

def select_preview(config,label,approved,root='voice-previews',selection_path='voice-selection.json'):
    report=read(Path(root)/'previews.json'); entry=next((p for p in report['previews'] if p['label']==label),None)
    if not entry or entry['provider']!=config['tts_provider'] or approved!=entry['sha256'] or digest(entry['path'])!=approved:
        raise Failure('Voice selection must approve an existing exact preview from the configured provider.')
    entry=dict(entry,selected_at=now().isoformat(),binding=selection_binding(entry['provider'],entry['voice'],entry['settings'],approved))
    write(selection_path,entry); return entry

def edition_speech(store,config):
    key='edge_publication_rights' if config['tts_provider']=='edge-tts' else 'azure_publication_rights'
    rights=config.get(key,{})
    if not rights.get('reviewer') or not rights.get('terms_url') or not rights.get('permission_evidence'):
        raise Failure('Neural service publication rights are unverified. Full video synthesis is blocked. F0/private audition is not a publication-rights grant; document applicable permission without upgrading a tier.')
    selection=read(config.get('voice_selection','voice-selection.json'))
    voices=voice_list(config,config.get('voice_preview_root','voice-previews'))
    voice=find_voice(voices,config.get('voice','')); delivery=settings(config,voice,config['tts_provider'])
    if selection.get('binding')!=selection_binding(config['tts_provider'],voice['ShortName'],delivery,selection.get('sha256')) or digest(selection['path'])!=selection['sha256']:
        raise Failure('Select the exact preview first; changed voice/provider/delivery settings need a new audition.')
    script=read(store.path/'script.json'); folder=store.path/'speech'; folder.mkdir(exist_ok=True)
    for i,segment in enumerate(script['segments']):
        wav,timing,_,_=cached_audio(config,segment['text'],voice,delivery,config.get('speech_cache','speech-cache'))
        target=folder/f'segment-{i:04}.wav'; shutil.copyfile(wav,target); shutil.copyfile(timing,str(target)+'.words.json')
    write(store.path/'speech-provider.json',{'provider':config['tts_provider'],'voice':voice['ShortName'],'settings':delivery,
                                          'selection_binding':selection['binding'],'timing':'native neural word boundary events','fallback':False})
