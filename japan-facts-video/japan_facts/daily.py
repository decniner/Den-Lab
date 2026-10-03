"""One persistent private edition per Japan date, with safe stage resumption."""
import datetime as dt
from pathlib import Path
from . import research,production,youtube
from .core import Store,Failure,log,now,set_log_path

def edition_id(at=None):
    local=(at or now()).astimezone(dt.timezone(dt.timedelta(hours=9)))
    return 'japan-explained-'+local.strftime('%Y%m%d')+'-daily'

def upload_existing(store,config):
    from .__main__ import require_ready
    state=store.load(); require_ready(store,state,config,allow_audio_waiver=True)
    item=youtube.upload(store,state,youtube.API(config['oauth_token']))
    research.write(store.path.parent/'end-to-end.json',{'edition':store.edition,'at':now().isoformat(),'private_upload_verified':True,'video_id':item['id']})
    log('video_confirmed',edition=store.edition,video_id=item['id'],url='https://www.youtube.com/watch?v='+item['id'],returned_visibility=item['status']['privacyStatus'],upload_status=item['status']['uploadStatus'])
    return item

def run_daily(root,config,at=None):
    authorization=config.get('daily_private_authorization','').strip()
    if not config.get('schedule_enabled') or not authorization or config.get('private_review_only') is not True:
        raise Failure('Daily uploads need explicit standing private-only authorization and schedule_enabled=true.')
    proof=research.read(Path(root)/'end-to-end.json')
    if not proof.get('private_upload_verified') or not proof.get('video_id'):
        raise Failure('Daily schedule requires a verified private end-to-end upload first.')
    store=Store(root,edition_id(at)); gate=Store(root,'daily-run')
    from .__main__ import content_failure_guard,inspection
    with gate.lock(),store.lock():
        set_log_path(store.path/'events.jsonl')
        try:
            state=store.load() if (store.path/'edition.json').exists() else None
            if state and state['stage']=='uploaded': return upload_existing(store,config)
            if state and state['stage']=='failed':
                raise Failure('Daily edition previously failed; inspect its events and recover the same edition. No replacement or repeated topic created.')
            if state is None:
                with content_failure_guard(store,'research'): research.research_edition(store,config)
                state=store.load()
            if state['stage']=='researched':
                with content_failure_guard(store,'script'): production.create_script(store)
                state=store.load()
            if state['stage']=='scripted':
                with content_failure_guard(store,'render'): production.render(store,config)
                state=store.load()
            if state['stage']=='rendered':
                with content_failure_guard(store,'validate'): production.validate(store,config)
                state=store.load()
            if state['stage']!='validated': raise Failure('Daily edition has an unsupported stage; manual recovery required.')
            inspection(store,'Automated private media checks; standing owner daily authorization',state['manifest']['video_sha256'],False,authorization)
            state=store.load(); state['inspection']['human_frames_reviewed']=False
            state['inspection']['automated_checks_only']=True; store.save(state)
            return upload_existing(store,config)
        finally: set_log_path(None)
