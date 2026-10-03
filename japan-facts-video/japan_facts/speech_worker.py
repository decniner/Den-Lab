"""Bounded child process for network/native SDK work. Never exposes provider secrets."""
import asyncio
import html
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.request import Request, build_opener, HTTPRedirectHandler
from .core import Failure
from .research import read, write
from .speech import verify_resource

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*args): return None

def arm(url,token,method='GET'):
    try:
        request=Request(url,headers={'Authorization':'Bearer '+token},method=method,data=b'' if method=='POST' else None)
        with build_opener(NoRedirect).open(request,timeout=20) as response: return json.loads(response.read(1_000_000))
    except Exception as exc: raise Failure('Azure resource verification failed. Check management permission/token; no speech or tier changes attempted.') from exc

def azure_credentials(config):
    key=os.environ.get('AZURE_SPEECH_KEY',''); region=os.environ.get('AZURE_SPEECH_REGION',config.get('azure_region',''))
    resource=os.environ.get('AZURE_SPEECH_RESOURCE_ID',config.get('azure_resource_id',''))
    if not key or not re.fullmatch(r'[a-z0-9]+',region) or not re.fullmatch(r'/subscriptions/[0-9a-f-]{36}/resourceGroups/[A-Za-z0-9_.()-]+/providers/Microsoft.CognitiveServices/accounts/[A-Za-z0-9-]+',resource,re.I):
        raise Failure('Configure AZURE_SPEECH_KEY, AZURE_SPEECH_REGION and AZURE_SPEECH_RESOURCE_ID privately. Existing F0 resource required.')
    token=os.environ.get('AZURE_MANAGEMENT_TOKEN','')
    if not token and shutil.which('az'):
        try: token=subprocess.run(['az','account','get-access-token','--resource','https://management.azure.com/','--query','accessToken','-o','tsv'],capture_output=True,text=True,check=True,timeout=20).stdout.strip()
        except Exception as exc: raise Failure('Azure CLI is not authenticated; sign in or provide AZURE_MANAGEMENT_TOKEN privately.') from exc
    if not token: raise Failure('Azure F0 verification needs Azure CLI login or AZURE_MANAGEMENT_TOKEN; a declared pricing tier is not sufficient.')
    base='https://management.azure.com'+resource
    metadata=arm(base+'?api-version=2023-05-01',token)
    # Reject paid resource before requesting its key metadata or touching speech.
    if metadata.get('sku',{}).get('name')!='F0': raise Failure('Azure resource is not F0. Paid speech is blocked and no SKU is modified.')
    keys=arm(base+'/listKeys?api-version=2023-05-01',token,'POST')
    verify_resource(metadata,keys,key,region); return key,region

def ssml(text,voice,settings):
    body=html.escape(text)
    if settings['sentence_pause_ms']:
        body=re.sub(r'([.!?])\s+',lambda m:m[1]+f'<break time="{settings["sentence_pause_ms"]}ms"/> ',body)
    body=f'<prosody rate="{settings["rate_percent"]:+g}%" pitch="{settings["pitch_hz"]:+g}Hz" volume="{settings["volume_percent"]:+g}%">{body}</prosody>'
    if settings['style']!='neutral': body=f'<mstts:express-as style="{html.escape(settings["style"],quote=True)}" styledegree="{settings["style_degree"]}">{body}</mstts:express-as>'
    locale=html.escape(voice['Locale'],quote=True); name=html.escape(voice['ShortName'],quote=True)
    return f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="{locale}"><voice name="{name}">{body}</voice></speak>'

def azure(job,folder):
    import azure.cognitiveservices.speech as sdk
    key,region=azure_credentials(job['config'])
    cfg=sdk.SpeechConfig(subscription=key,region=region)
    cfg.set_speech_synthesis_output_format(sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm)
    synth=sdk.SpeechSynthesizer(speech_config=cfg,audio_config=None)
    if job['operation']=='list':
        result=synth.get_voices_async().get()
        if result.reason!=sdk.ResultReason.VoicesListRetrieved: raise Failure('Azure voice discovery failed; no voices assumed.')
        return {'voices':[{'ShortName':v.short_name,'Locale':v.locale,'Gender':str(v.gender),
                           'StyleList':list(v.style_list),'VoiceType':str(v.voice_type)} for v in result.voices]}
    events=[]
    def boundary(event):
        if event.boundary_type==sdk.SpeechSynthesisBoundaryType.Word:
            events.append({'text':event.text,'start':event.audio_offset/10_000_000})
    synth.synthesis_word_boundary.connect(boundary)
    result=synth.speak_ssml_async(ssml(job['text'],job['voice'],job['settings'])).get()
    if result.reason!=sdk.ResultReason.SynthesizingAudioCompleted:
        raise Failure('Azure neural synthesis failed/canceled. Check F0 quota and voice/settings. No fallback or paid retry used.')
    (folder/'provider.wav').write_bytes(result.audio_data)
    return {'audio_file':'provider.wav','events':events}

async def edge(job,folder):
    import edge_tts
    if not job['config'].get('edge_experimental_opt_in'): raise Failure('Experimental edge-tts was not opted into.')
    if job['operation']=='list': return {'voices':await asyncio.wait_for(edge_tts.list_voices(),45)}
    cfg=job['settings']; events=[]
    stream=edge_tts.Communicate(job['text'],job['voice']['ShortName'],rate=f'{cfg["rate_percent"]:+g}%',
        pitch=f'{cfg["pitch_hz"]:+g}Hz',volume=f'{cfg["volume_percent"]:+g}%',boundary='WordBoundary',connect_timeout=15,receive_timeout=45)
    with (folder/'provider.mp3').open('wb') as audio:
        async for chunk in stream.stream():
            if chunk['type']=='audio': audio.write(chunk['data'])
            elif chunk['type']=='WordBoundary': events.append({'text':chunk['text'],'start':chunk['offset']/10_000_000})
    return {'audio_file':'provider.mp3','events':events}

if __name__=='__main__':
    result_path=Path(sys.argv[2])
    try:
        job=read(sys.argv[1]); folder=result_path.parent
        if job['config']['tts_provider']=='azure-speech': result=azure(job,folder)
        elif job['config']['tts_provider']=='edge-tts': result=asyncio.run(asyncio.wait_for(edge(job,folder),85))
        else: raise Failure('Unsupported neural provider; no fallback used.')
        write(result_path,dict(result,request_id=job['request_id']))
    except Failure as exc:
        write(result_path,{'error':str(exc),'request_id':job.get('request_id') if 'job' in locals() else None}); raise SystemExit(1)
    except Exception:
        # SDK/network exception strings can contain URLs/tokens. Do not log them.
        write(result_path,{'error':'Neural provider failed or returned malformed output. Check dependencies/network and selected voice; no fallback used.',
                           'request_id':job.get('request_id') if 'job' in locals() else None}); raise SystemExit(1)
