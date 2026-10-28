import hashlib,json,math,re
from contextlib import contextmanager
from pathlib import Path
SCENES={'two','human','ai','glass','clock','atom','wave','galaxy','horizon','timeline','ripple','eye'}
DEFAULTS={'title_lines':['A Moment, Considered'],'closing_lines':[],'output_stem':'Philosophy_Film','human_voice':'en-GB-RyanNeural','ai_voice':'en-GB-SoniaNeural','human_rate':'-8%','ai_rate':'-8%','width':1080,'fps':30,'lead_in_seconds':3.5,'tail_seconds':4,'min_duration_seconds':120,'workers':6,'show_chapter_labels':False,'inspiration_credit':''}
DEFAULTS.update({'audio_engine':'chatterbox','caption_font_size':44,'caption_y':920})
@contextmanager
def project_lock(root):
    # OS locks release on process exit; a leftover filename cannot strand a project.
    with (Path(root)/'.film.lock').open('a+b') as f:
        f.seek(0,2)
        if f.tell()==0:f.write(b'0');f.flush()
        f.seek(0)
        try:
            try:
                import fcntl
                fcntl.flock(f,fcntl.LOCK_EX|fcntl.LOCK_NB)
                unlock=lambda:fcntl.flock(f,fcntl.LOCK_UN)
            except ImportError:
                import msvcrt
                msvcrt.locking(f.fileno(),msvcrt.LK_NBLCK,1)
                unlock=lambda:msvcrt.locking(f.fileno(),msvcrt.LK_UNLCK,1)
        except OSError as e:raise ValueError('Another producer holds the project lock') from e
        try:yield
        finally:f.seek(0);unlock()
def load_project(root):
    root=Path(root);cfg=dict(DEFAULTS,**json.loads((root/'film.json').read_text()));lines=json.loads((root/'dialogue.json').read_text())
    if not isinstance(lines,list) or not lines:raise ValueError('dialogue.json must be a nonempty array')
    if not re.fullmatch(r'[A-Za-z0-9_-]+',cfg['output_stem']):raise ValueError('Unsafe output_stem')
    if cfg['width']%18 or not 180<=cfg['width']<=2160:raise ValueError('width must be a multiple of 18 between 180 and 2160')
    if not isinstance(cfg['fps'],int) or not 1<=cfg['fps']<=60:raise ValueError('fps must be an integer between 1 and 60')
    if not isinstance(cfg['workers'],int) or not 1<=cfg['workers']<=8:raise ValueError('workers must be between 1 and 8')
    for k in ['lead_in_seconds','tail_seconds','min_duration_seconds']:
        if not isinstance(cfg[k],(float,int)) or not math.isfinite(cfg[k]) or cfg[k]<0:raise ValueError(f'Invalid {k}')
    for k in ['title_lines','closing_lines']:
        if not isinstance(cfg[k],list) or len(cfg[k])>3 or any(not isinstance(v,str) or not v.strip() for v in cfg[k]):raise ValueError(f'Invalid {k}')
    if not cfg['title_lines']:raise ValueError('At least one title line is required')
    for i,line in enumerate(lines):
        if line.get('who') not in ['HUMAN','AI'] or not isinstance(line.get('text'),str) or not line['text'].strip():raise ValueError(f'Invalid speaker or text at turn {i}')
        if line.get('scene') not in SCENES:raise ValueError(f'Unsupported scene at turn {i}')
        if not isinstance(line.get('pause'),(int,float)) or not math.isfinite(line['pause']) or not 0<=line['pause']<=15:raise ValueError(f'Invalid pause at turn {i}')
    return cfg,lines
def fingerprint(line,cfg):
    p='human' if line['who']=='HUMAN' else 'ai'
    return hashlib.sha256(json.dumps({'text':line['text'],'voice':cfg[p+'_voice'],'rate':cfg[p+'_rate'],'schema':1},sort_keys=True).encode()).hexdigest()
def align_words(text,words,dur):
    tokens=text.split();norm=lambda s:''.join(c.lower() for c in s if c.isalnum())
    normalized=''.join(norm(w['text']) for w in words)
    authored=''.join(norm(w) for w in tokens)
    if normalized!=authored or not normalized:raise ValueError('Speech word boundaries do not align with the authored text; inspect the speech instead of approximating captions')
    char_times=[]
    for w in words:
        n=len(norm(w['text']))
        for i in range(n):char_times.append((w['t']+w['dur']*i/n,w['t']+w['dur']*(i+1)/n))
    result=[];cursor=0
    for token in tokens:
        n=len(norm(token))
        if not n:raise ValueError('Attach punctuation to a spoken token')
        start=char_times[cursor][0];end=char_times[cursor+n-1][1];cursor+=n
        result.append({'text':token,'t':start,'dur':max(.001,end-start)})
    return result
