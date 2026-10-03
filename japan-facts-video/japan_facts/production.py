"""Normal-speed narration, original vector animation and measured media checks."""
import hashlib
import json
import math
import os
import re
import shutil
import struct
import subprocess
import textwrap
import wave
from pathlib import Path
from .core import Failure, canonical, digest, manifest_hash, now
from .research import read, write, review_hash, check_providers

ROOT=Path(__file__).resolve().parent.parent

def run(args,timeout=600,cwd=None):
    try: return subprocess.run([str(a) for a in args],capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=timeout,check=True,cwd=cwd)
    except (subprocess.SubprocessError,OSError) as exc:
        # Do not print commands/config/provider credentials into logs.
        raise Failure('Media/provider command failed or timed out. Check installed tools and local edition inputs.') from exc
def tool(config,name):
    value=config.get(name,name)
    if Path(value).is_file(): return str(Path(value).resolve())
    found=shutil.which(value)
    if found: return found
    raise Failure(f'Missing {name}; install FFmpeg/FFprobe and configure its absolute path.')
def check_duration(seconds):
    if not 45<=seconds<=60: raise Failure(f'Natural narration is {seconds:.2f}s; revise the script to 45-60 seconds. Speech is never accelerated automatically.')
def wav_seconds(path):
    with wave.open(str(path),'rb') as audio: return audio.getnframes()/audio.getframerate()
def check_captions(captions,duration):
    previous=0
    if not isinstance(captions,list) or not captions: raise Failure('Captions are missing.')
    for c in captions:
        try:
            a,b=c['start'],c['end']; text=c['text']
            if type(a) not in (int,float) or type(b) not in (int,float) or not 0<=a<b<=duration or a<previous-.001 or not text.strip(): raise ValueError()
            if len(text)/(b-a)>25 or len(textwrap.wrap(text,25,break_long_words=False))>2: raise ValueError()
            previous=b
        except (KeyError,TypeError,ValueError,AttributeError): raise Failure('Caption timing, overlap, phone readability or reading speed validation failed.')
def word_captions(text,words,length,offset):
    if not isinstance(words,list) or not words: raise Failure('Narration word timings are missing.')
    previous=-1; previous_index=-1
    for word in words:
        try:
            if type(word['index']) is not int or type(word['count']) is not int or not 0<=word['index']<len(text) or not 0<word['count']<=len(text)-word['index'] or not 0<=word['start']<length:
                raise ValueError()
            if word['start']<previous or word['index']<=previous_index: raise ValueError()
            previous=word['start']; previous_index=word['index']
        except (KeyError,TypeError,ValueError): raise Failure('Malformed/non-monotonic narration word timing or text index.')
    captions=[]; at=0
    while at<len(words):
        stop=at+1
        while stop<len(words) and stop-at<5 and len(text[words[at]['index']:words[stop]['index']+words[stop]['count']])<=42:
            stop+=1
        end_index=words[stop]['index'] if stop<len(words) else len(text)
        finish=words[stop]['start'] if stop<len(words) else length
        captions.append({'start':offset+words[at]['start'],'end':offset+finish,'text':text[words[at]['index']:end_index].strip()})
        at=stop
    return captions

def font_path(config=None):
    candidates=[(config or {}).get('font',''), 'C:/Windows/Fonts/arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
    for p in candidates:
        if p and Path(p).is_file(): return Path(p)
    raise Failure('Configure an installed TrueType font for measured text bounds.')

def text_bounds(text,size,x,y,max_width=794,max_height=180,font=None):
    """TrueType advance metrics, plus conservative kerning/outline safety margin."""
    if x<80 or x>=900 or y<90 or y+max_height>1560: raise Failure('Text rectangle enters the phone interface safe area.')
    max_width=min(max_width,900-x)
    data=Path(font or font_path()).read_bytes()
    u16=lambda at:struct.unpack_from('>H',data,at)[0]
    tables={data[12+i*16:16+i*16].decode('ascii'):struct.unpack_from('>II',data,20+i*16) for i in range(u16(4))}
    units=u16(tables['head'][0]+18); hhea=tables['hhea'][0]; count=u16(hhea+34); hmtx=tables['hmtx'][0]
    cmap=tables['cmap'][0]; subtables=[]
    for i in range(u16(cmap+2)):
        platform,encoding,offset=struct.unpack_from('>HHI',data,cmap+4+8*i)
        if platform in (0,3) and u16(cmap+offset)==4: subtables.append(cmap+offset)
    if not subtables: raise Failure('Font lacks a supported Unicode cmap; choose Arial/DejaVu Sans.')
    at=subtables[-1]; n=u16(at+6)//2
    ends=at+14; starts=ends+2*n+2; deltas=starts+2*n; ranges=deltas+2*n
    def glyph(char):
        code=ord(char)
        for i in range(n):
            if u16(starts+2*i)<=code<=u16(ends+2*i):
                delta=u16(deltas+2*i); distance=u16(ranges+2*i)
                if not distance: return (code+delta)%65536
                result=u16(ranges+2*i+distance+2*(code-u16(starts+2*i)))
                return (result+delta)%65536 if result else 0
        return 0
    lines=text.split('\n'); widths=[]
    for line in lines:
        total=0
        for char in line:
            gid=glyph(char)
            if gid==0 and not char.isspace(): raise Failure('Font cannot render a script character; configure a suitable font.')
            total+=u16(hmtx+4*min(gid,count-1))
        widths.append(total*size/units+12)
    if max(widths,default=0)>max_width or len(lines)*size*1.25>max_height: raise Failure('Text clipping detected by measured font bounds; shorten or resize copy.')
    return max(widths,default=0),len(lines)*size*1.25

def check_research(store,state):
    pack=read(store.path/'fact-pack.json'); evidence=read(store.path/'claims-to-sources.json')
    if review_hash(pack)!=state['pack_sha256'] or pack['review']['content_sha256']!=state['pack_sha256'] or hashlib.sha256(canonical(evidence)).hexdigest()!=state['research_sha256']:
        raise Failure('Reviewed fact pack or source manifest changed after research.')
    return pack

def create_script(store):
    state=store.load()
    if state['stage']!='researched': raise Failure('Scripting requires a researched edition.')
    pack=check_research(store,state)
    script=dict(pack['script'],edition=store.edition,mode='live',language='en',fact_id=pack['fact_id'],
                review_hash=pack['review']['content_sha256'])
    write(store.path/'script.json',script); state['script_sha256']=digest(store.path/'script.json')
    state['stage']='scripted'; store.save(state); return script

def synthesize(store,config):
    check_providers(config)
    if config.get('tts_provider') in ('azure-speech','edge-tts'):
        from .speech import edition_speech
        return edition_speech(store,config)
    if os.name!='nt': raise Failure('Default local narration requires Windows System.Speech and an installed voice. Supply a reviewed local narration adapter on other systems.')
    try:
        run(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',ROOT/'tools'/'narrate.ps1',
             '-EditionDirectory',store.path,'-Voice',config.get('voice','Microsoft Zira Desktop')],180)
    except Failure as exc:
        raise Failure('Windows narration failed. Check the installed voice and execute in a normal Windows PowerShell session; no narration or video success recorded.') from exc

def retry_render(store,config):
    state=store.load()
    if state.get('stage')!='failed' or state.get('upload'):
        raise Failure('Retry requires a failed, never-uploaded edition with unchanged reviewed script and sources.')
    pack=check_research(store,state)
    script=read(store.path/'script.json')
    expected=dict(pack['script'],edition=store.edition,mode='live',language='en',fact_id=pack['fact_id'],review_hash=pack['review']['content_sha256'])
    if script!=expected or digest(store.path/'script.json')!=state['script_sha256']:
        raise Failure('Reviewed script changed; retry refused.')
    state['stage']='scripted'; state.pop('failure',None); store.save(state)
    return render(store,config)

def combine_speech(store,script):
    target=store.path/'narration.wav'; captions=[]; spans=[]; offset=0; expected=None
    with wave.open(str(target),'wb') as final:
        for i,segment in enumerate(script['segments']):
            path=store.path/'speech'/f'segment-{i:04}.wav'
            with wave.open(str(path),'rb') as audio:
                params=audio.getparams(); signature=params[:3]
                if expected is None: expected=signature; final.setparams(params)
                if expected!=signature: raise Failure('Narration segment WAV formats differ.')
                length=params.nframes/params.framerate; final.writeframes(audio.readframes(params.nframes))
            words=read(str(path)+'.words.json')
            captions.extend(word_captions(segment['text'],words,length,offset))
            spans.append({'start':offset,'end':offset+length,'phase':segment['phase'],'heading':segment.get('heading',''),
                          'scene':segment.get('scene','flow'),'word_file':str(path)+'.words.json','word_sha256':digest(str(path)+'.words.json')})
            offset+=length
    # One second of breathing room gives a complete final takeaway, never a speed change.
    if offset<45:
        raise Failure('Narration is too short; expand the explanation and regenerate speech.')
    check_duration(offset); check_captions(captions,offset)
    write(store.path/'captions.json',captions)
    write(store.path/'caption-sync.json',{'narration_sha256':digest(target),'script_sha256':digest(store.path/'script.json'),
                                        'duration':offset,'segments':spans,'tempo_factor':1.0,'method':'native provider word boundary events on the final unchanged audio clock'})
    return offset,captions,spans

def ass_time(value):
    cs=round(value*100); h,cs=divmod(cs,360000); m,cs=divmod(cs,6000); s,cs=divmod(cs,100)
    return f'{h}:{m:02}:{s:02}.{cs:02}'
def color(rgb): return '&H'+rgb[4:6]+rgb[2:4]+rgb[0:2]+'&'
def escape(text): return text.replace('\\','').replace('{','').replace('}','').replace('\n','\\N')

def composition(path,duration,captions,spans,config):
    events=[]; font=font_path(config); family='Arial' if 'arial' in font.name.lower() else 'DejaVu Sans'
    def event(a,b,layer,content,style='Graphic'):
        events.append(f'Dialogue: {layer},{ass_time(a)},{ass_time(b)},{style},,0,0,0,,{content}')
    def text(a,b,content,x,y,size=36,rgb='EAF0F1',bold=True,height=180):
        text_bounds(content,size,x,y,max_height=height,font=font)
        tags=f'\\an7\\pos({x},{y})\\fad(180,120)\\fs{size}\\b{int(bold)}\\1c{color(rgb)}\\bord0\\shad0'
        event(a,b,4,'{'+tags+'}'+escape(content))
    def shape(a,b,x,y,drawing,rgb,layer=1,extra=''):
        placement='' if '\\move(' in extra else f'\\pos({x},{y})'
        event(a,b,layer,'{'+f'\\an7{placement}\\p1\\1c{color(rgb)}\\bord0\\shad0'+extra+'}'+drawing+'{\\p0}')
    def box(a,b,x,y,w,h,rgb,layer=1): shape(a,b,x,y,f'm 0 0 l {w} 0 {w} {h} 0 {h}',rgb,layer)
    def train(a,b,x,y,w=360,motion=None):
        drawing=f'm 0 0 l {w-80} 0 b {w-25} 0 {w} 50 {w} 80 l 0 80'
        shape(a,b,x,y,drawing,'EAF0F1',2)
        for wx in range(30,w-95,60): box(a,b,x+wx,y+18,42,25,'213847',3)
        box(a,b,x,y+57,w-14,8,'7CE8D0',3)
    box(0,duration,80,105,6,55,'7CE8D0')
    text(0,duration,'JAPAN EXPLAINED',106,110,31)
    text(0,duration,'ENGINEERING / EARTHQUAKE EARLY WARNING',80,202,21,'96AFBA',False)
    # Slow background grid pulses; entirely original vector geometry.
    for x in range(80,900,82): box(0,duration,x,580,1,600,'12232D',0)
    for y in range(580,1181,75): box(0,duration,80,y,820,1,'12232D',0)
    headings={
      'hook':('BRAKING BEFORE\nSTRONG SHAKING','A head start, when conditions allow.'),
      'context':('DETECTION.\nNOT PREDICTION.','The earthquake has already started.'),
      'waves':('ONE EARTHQUAKE.\nDIFFERENT WAVES.','P waves arrive first.'),
      'sensor':('DETECT THE\nFIRST ARRIVAL.','A sensor sends the warning.'),
      'brakes':('POWER OFF.\nBRAKES ON.','The railway system acts on the warning.'),
      'signal':('THE SIGNAL\nGETS A HEAD START.','Communications outrun seismic waves.'),
      'limits':('LESS DISTANCE.\nLESS WARNING.','Close to the source, warning may be late.'),
      'takeaway':('USE THE\nTIME DIFFERENCE.','Earlier detection can reduce risk.')}
    for span in spans:
        a,b=span['start'],span['end']; scene=span['scene']
        if scene not in headings: raise Failure('This fact pack needs a supported reviewed diagram scene.')
        heading,subtitle=headings[scene]
        text(a,b,heading,80,300,64,height=180)
        text(a,b,subtitle,80,505,26,'96AFBA',False,height=80)
        box(a,b,80,645,800,510,'10212B',1)
        if scene in ('hook','context','brakes','takeaway'):
            box(a,b,115,1000,700,5,'96AFBA',2)
            for x in range(130,820,40): box(a,b,x,1010,22,5,'4E626D',2)
            train(a,b,270,895)
            text(a,b,'EARLY WARNING' if scene!='brakes' else 'EMERGENCY BRAKING',120,690,29,'7CE8D0')
            text(a,b,'P WAVE  >  DETECTION  >  RESPONSE',120,785,25,'EAF0F1',False)
            if scene=='brakes':
                box(a,b,685,878,8,100,'FFB46A',3); text(a,b,'POWER CUT',120,1080,24,'FFB46A')
            else: text(a,b,'A chance to start slowing sooner',120,1080,26,'96AFBA',False)
        elif scene in ('waves','sensor','signal'):
            text(a,b,'EARLIER: P WAVE',120,695,29,'7CE8D0')
            text(a,b,'LATER: STRONGER SHAKING',120,935,27,'FFB46A')
            for row,rgb,fraction in [(830,'7CE8D0',.85),(1070,'FFB46A',.50)]:
                box(a,b,120,row,670,3,'4E626D',2)
                # Repeated wave-front motion communicates ordering, not numerical speed.
                for t in range(0,math.ceil(b-a),3):
                    start=a+t; end=min(b,start+3)
                    if end<=start: continue
                    shape(start,end,150,row-28,'m 0 0 l 8 0 8 56 0 56',rgb,3,
                          f'\\move(150,{row-28},{int(150+600*fraction)},{row-28},0,{int((end-start)*1000)})')
            if scene=='sensor':
                box(a,b,735,770,9,94,'EAF0F1',4); text(a,b,'SENSOR',605,730,25)
            if scene=='signal':
                text(a,b,'ELECTRICAL WARNING',120,865,24,'7CE8D0')
        elif scene=='limits':
            text(a,b,'NEAR THE EARTHQUAKE',120,700,29,'FFB46A')
            box(a,b,120,830,180,5,'FFB46A',2)
            shape(a,b,130,790,'m 0 0 l 26 20 0 40 26 60','FFB46A',3)
            train(a,b,365,790,320)
            text(a,b,'The warning may arrive too late.',120,995,31)
            text(a,b,'Braking early is not a stop guarantee.',120,1070,26,'96AFBA',False)
        text(a,b,'SCHEMATIC / NOT TO SCALE',80,1220,20,'96AFBA',False,height=60)
    for c in captions:
        lines=textwrap.wrap(c['text'],width=25,break_long_words=False,break_on_hyphens=False)
        for line in lines: text_bounds(line,52,95,1380,max_width=785,max_height=140,font=font)
        event(c['start'],c['end'],7,'{\\fad(30,30)}'+escape('\n'.join(lines)),'Caption')
    # Disclosures stay outside captions; source links are in the description.
    event(0,duration,4,'{\\an7\\pos(80,1630)\\fs20\\1c&HBAAF96&\\bord0}Original diagrams / Synthetic narration')
    header=f'''[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Graphic,{family},36,&H00EAF0F1,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,7,80,180,0,1
Style: Caption,{family},52,&H00EAF0F1,&H00FFFFFF,&H000A100E,&H000A100E,-1,0,0,0,100,100,0,0,1,4,1,2,95,190,400,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
    Path(path).write_text(header+'\n'.join(events)+'\n',encoding='utf-8')

def render(store,config):
    state=store.load()
    if state['stage']!='scripted': raise Failure('Render requires a scripted edition; never overwrite an uploaded render.')
    check_research(store,state)
    if digest(store.path/'script.json')!=state['script_sha256']: raise Failure('Reviewed script changed; start a corrected edition.')
    synthesize(store,config)
    script=read(store.path/'script.json'); duration,captions,spans=combine_speech(store,script)
    composition(store.path/'composition.ass',duration,captions,spans,config)
    ffmpeg=tool(config,'ffmpeg'); video=store.path/'video.mp4'
    run([ffmpeg,'-y','-f','lavfi','-i',f'color=c=0x08151e:s=1080x1920:r=30:d={duration}',
         '-i',store.path/'narration.wav','-vf','ass=composition.ass',
         '-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k',
         '-af','loudnorm=I=-16:TP=-1.5:LRA=7','-t',str(duration),'-movflags','+faststart',video],600,store.path)
    # Original clean opening cover, rendered from the same diagram without captions.
    composition(store.path/'cover.ass',duration,[],spans,config)
    run([ffmpeg,'-y','-f','lavfi','-i',f'color=c=0x08151e:s=1080x1920:r=30:d=1',
         '-vf','setpts=PTS+1/TB,ass=cover.ass,scale=720:1280','-frames:v','1','-update','1',store.path/'thumbnail.png'],30,store.path)
    state['stage']='rendered'; state['duration']=duration; store.save(state)
    return validate(store,config)

def validate(store,config):
    state=store.load()
    if state['stage'] not in ('rendered','validated'): raise Failure('Validation requires a rendered edition.')
    check_research(store,state)
    video=store.path/'video.mp4'; sync=read(store.path/'caption-sync.json'); script=read(store.path/'script.json')
    if digest(store.path/'script.json')!=state['script_sha256'] or digest(store.path/'narration.wav')!=sync['narration_sha256'] or sync['script_sha256']!=state['script_sha256']:
        raise Failure('Final narration/script checksum no longer matches caption timings.')
    expected=[]
    for i,(span,seg) in enumerate(zip(sync['segments'],script['segments'])):
        if digest(span['word_file'])!=span['word_sha256']: raise Failure('Word timing artifact changed.')
        expected.extend(word_captions(seg['text'],read(span['word_file']),span['end']-span['start'],span['start']))
    captions=read(store.path/'captions.json')
    if captions!=expected or len(sync['segments'])!=len(script['segments']): raise Failure('Captions are not synchronized to final narration word events.')
    check_duration(sync['duration']); check_captions(captions,sync['duration'])
    probe=json.loads(run([tool(config,'ffprobe'),'-v','error','-show_streams','-show_format','-of','json',video],30).stdout)
    vs=[s for s in probe['streams'] if s['codec_type']=='video']; aus=[s for s in probe['streams'] if s['codec_type']=='audio']
    duration=float(probe['format']['duration']); check_duration(duration)
    if len(vs)!=1 or len(aus)!=1 or (vs[0]['width'],vs[0]['height'],vs[0]['codec_name'],aus[0]['codec_name'])!=(1080,1920,'h264','aac') or abs(duration-sync['duration'])>.1:
        raise Failure('Video geometry/codecs or final audio duration failed validation.')
    ffmpeg=tool(config,'ffmpeg')
    run([ffmpeg,'-v','error','-xerror','-i',video,'-f','null','-'],600)
    vol=run([ffmpeg,'-i',video,'-af','volumedetect','-f','null','-'],120).stderr
    match=re.search(r'mean_volume: ([\-\d.]+) dB',vol)
    if not match or not -35<float(match[1])<-3: raise Failure('Audio missing, silent or outside acceptable level range.')
    preview_times=[round(duration*f,2) for f in (.05,.23,.47,.72,.93)]
    for i,t in enumerate(preview_times): run([ffmpeg,'-y','-ss',str(t),'-i',video,'-frames:v','1','-update','1',store.path/f'preview-{i+1}.jpg'],30)
    run([ffmpeg,'-y','-ss','12','-i',video,'-t','12','-ac','1','-ar','24000','-c:a','libmp3lame','-b:a','48k',store.path/'audio-sample.mp3'],30)
    evidence=read(store.path/'claims-to-sources.json')
    report={'edition':store.edition,'mode':'live','validated_at':now().isoformat(),'decode':'passed','duration':duration,
            'width':1080,'height':1920,'mean_audio_db':float(match[1]),'caption_groups':len(captions),
            'caption_sync':'native final narration events, regenerated and compared','text_bounds':'TrueType metrics and safe-area checks passed',
            'video_sha256':digest(video),'tempo_factor':1.0,'preview_times':preview_times,'human_inspection':'pending','paid_jobs':0}
    write(store.path/'validation.json',report)
    artifacts=('fact-pack.json','claims-to-sources.json','candidates.json','script.json','captions.json','caption-sync.json','narration.wav','thumbnail.png','composition.ass','validation.json')
    if (store.path/'speech-provider.json').exists(): artifacts+=('speech-provider.json',)
    state['stage']='validated'; state['video_path']=str(video); state['channel_id']=config.get('channel_id','')
    state['manifest']={'title':script['title'],'description':script.get('description','Japan Explained: how it works and why it matters.')+
                       '\nOriginal illustrative diagrams, not documentary footage. Synthetic narration.\nSources:\n'+'\n'.join(s['url'] for s in evidence['sources']),
                       'video_sha256':digest(video),'duration':duration,'containsSyntheticMedia':True,'categoryId':'27',
                       'tags':['Japan Explained','Japan','Shinkansen','earthquake early warning','engineering','Shorts'],
                       'artifacts':{str(store.path/name):digest(store.path/name) for name in artifacts}}
    state['render_manifest_sha256']=manifest_hash(state); state.pop('inspection',None); store.save(state); return report
