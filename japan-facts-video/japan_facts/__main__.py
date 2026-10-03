"""Separate, fail-closed commands for Japan Explained editions."""
import argparse
import contextlib
import datetime as dt
import hashlib
from pathlib import Path
from . import research, production, youtube
from .core import Failure, Store, check_artifacts, digest, log, manifest_hash, now, set_log_path

@contextlib.contextmanager
def content_failure_guard(store,command):
    """Called inside the edition lock; invalid transitions never mutate state."""
    expected={'research':None,'prepare':None,'script':'researched','render':'scripted','retry-render':'failed','validate':('rendered','validated')}
    if command not in expected:
        yield; return
    exists=(store.path/'edition.json').exists()
    initial=store.load() if exists else {}
    stage=initial.get('stage'); wanted=expected[command]
    eligible=(not exists) if wanted is None else stage in (wanted if isinstance(wanted,tuple) else (wanted,))
    try: yield
    except (Failure,OSError,ValueError,KeyError,TypeError) as exc:
        if eligible:
            current=store.load() if (store.path/'edition.json').exists() else {'edition':store.edition,'mode':'live'}
            if not current.get('upload') and current.get('stage') not in ('uploaded','published'):
                current.update(stage='failed',previous_stage=current.get('stage',stage),failed_command=command,failure=str(exc))
                store.save(current)
        raise

def require_ready(store,state,config,allow_audio_waiver=False):
    check_artifacts(state)
    if not config.get('channel_id','').startswith('UC') or config['channel_id']!=state['channel_id']:
        raise Failure('Configure the exact intended channel; this edition is bound to another or missing channel ID.')
    inspection=state.get('inspection',{})
    audio_approved=inspection.get('audio_listened') or (allow_audio_waiver and inspection.get('private_audio_waiver'))
    if inspection.get('video_sha256')!=state['manifest']['video_sha256'] or inspection.get('manifest_sha256')!=manifest_hash(state) or not audio_approved:
        raise Failure('Inspect the representative frames and audio sample, then use inspect-media for this exact render before upload.')
    evidence=research.read(store.path/'claims-to-sources.json')
    checked=dt.datetime.fromisoformat(evidence['checked_at'])
    if checked.tzinfo is None or not dt.timedelta(minutes=-5)<=now()-checked<=dt.timedelta(days=config.get('review_max_age_days',30)):
        raise Failure('Live source verification expired; research and review a new edition.')

def inspection(store,reviewer,approved,audio_listened,private_audio_waiver=None):
    state=store.load(); check_artifacts(state)
    report=research.read(store.path/'validation.json')
    if not reviewer or approved!=state['manifest']['video_sha256'] or not (audio_listened or (private_audio_waiver and private_audio_waiver.strip())) or (audio_listened and private_audio_waiver):
        raise Failure('Inspection requires an exact video hash and either actual listening or an explicit private-only audio waiver.')
    if not all((store.path/f'preview-{i}.jpg').is_file() for i in range(1,6)) or not (store.path/'audio-sample.mp3').is_file():
        raise Failure('Representative frames or audio sample are missing.')
    # Attestation is separate from immutable validation artifacts, so its binding is stable.
    state['inspection']={'reviewer':reviewer,'at':now().isoformat(),'video_sha256':approved,
                         'manifest_sha256':manifest_hash(state),'audio_listened':bool(audio_listened),'frames':report['preview_times']}
    if private_audio_waiver: state['inspection']['private_audio_waiver']=private_audio_waiver.strip()
    store.save(state); return state['inspection']

def dry_run(store):
    if (store.path/'edition.json').exists(): raise Failure('Dry-run edition already exists; use a new edition ID.')
    fixture=research.read(production.ROOT/'fixtures'/'fact-pack.json')
    at=dt.datetime.fromisoformat(fixture['review']['reviewed_at'])
    texts=research.read(production.ROOT/'fixtures'/'source-texts.json')
    research.verify_pack(fixture,texts,at)
    ranking=research.rank_candidates(research.read(production.ROOT/'facts'/'catalog.json')['candidates'])
    selected=research.choose(ranking,[],store.edition)
    research.write(store.path/'script.json',fixture['script'])
    report={'edition':store.edition,'mode':'fixture','fixture_clock':at.isoformat(),'candidates':len(ranking),
            'ranking':'passed','claim_support':'fixture evidence passed','script':'review checksum passed','topic_selection':selected['fact_id'],
            'narration':'skipped','render':'skipped','actual_media_validation':'skipped; no dry-run video generated',
            'upload':'skipped','public_publish':'blocked','video_id':None,'url':None,'returned_visibility':None,'paid_jobs':0,'estimated_paid_api_usd':0}
    research.write(store.path/'dry-run-report.json',report); store.save({'edition':store.edition,'mode':'fixture','stage':'dry-run-complete'})
    return report

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config',default='config.json'); parser.add_argument('--state-root',default='state')
    sub=parser.add_subparsers(dest='command',required=True)
    for name in ('research','script','render','retry-render','validate','upload-private','inspect','dry-run','prepare'):
        p=sub.add_parser(name); p.add_argument('--edition',required=True)
    p=sub.add_parser('inspect-media'); p.add_argument('--edition',required=True); p.add_argument('--reviewer',required=True)
    p.add_argument('--approve-video',required=True); p.add_argument('--audio-listened',action='store_true')
    p.add_argument('--private-audio-waiver',help='Explicit owner authorization to upload privately without a listening check; never authorizes public publishing.')
    p=sub.add_parser('publish-approved'); p.add_argument('--edition',required=True); p.add_argument('--approve-render',required=True)
    p=sub.add_parser('oauth-setup'); p.add_argument('--client-secrets',required=True); p.add_argument('--token',default='token.json')
    for name in ('speech-voices','voice-previews'):
        p=sub.add_parser(name); p.add_argument('--output',default='voice-previews')
    p=sub.add_parser('select-voice'); p.add_argument('--preview',required=True); p.add_argument('--approve-preview',required=True)
    p.add_argument('--preview-root',default='voice-previews'); p.add_argument('--selection',default='voice-selection.json')
    p=sub.add_parser('revise-edition'); p.add_argument('--edition',required=True)
    p.add_argument('--parent',required=True); p.add_argument('--approve-parent',required=True)
    sub.add_parser('daily-private')
    args=parser.parse_args(argv); store=None
    try:
        if args.command=='daily-private':
            from .daily import run_daily
            run_daily(args.state_root,research.read(args.config)); return 0
        if args.command in ('speech-voices','voice-previews','select-voice'):
            from . import speech
            config=research.read(args.config)
            if args.command=='speech-voices':
                result=speech.voice_list(config,args.output); log('neural_voices_retrieved',provider=config['tts_provider'],voices=len(result),output=str(Path(args.output)/'voices.json'))
            elif args.command=='voice-previews':
                result=speech.previews(config,args.output); log('neural_previews_saved',**result)
            else:
                result=speech.select_preview(config,args.preview,args.approve_preview,args.preview_root,args.selection)
                log('voice_selected',provider=result['provider'],voice=result['voice'],settings=result['settings'],selection=args.selection,full_regeneration='not started')
            return 0
        if args.command=='oauth-setup':
            youtube.oauth(args.client_secrets,args.token); log('oauth_saved',token_file=args.token); return 0
        store=Store(args.state_root,args.edition)
        with store.lock(), content_failure_guard(store,args.command):
            set_log_path(store.path/'events.jsonl')
            if args.command=='dry-run': log('dry_run_complete',**dry_run(store)); return 0
            config=research.read(args.config); research.check_providers(config)
            if args.command=='revise-edition':
                from .revision import create_revision
                result=create_revision(store,args.parent,args.approve_parent)
                log('revision_created',edition=args.edition,parent=result['revision_of'],fact_id=result['fact_id'],topic_history='preserved')
            elif args.command=='research':
                state=research.research_edition(store,config); log('research_verified',edition=args.edition,fact_id=state['fact_id'],mode='live')
            elif args.command=='script':
                result=production.create_script(store); log('script_created',edition=args.edition,segments=len(result['segments']),provider='reviewed-template')
            elif args.command in ('render','validate'):
                result=getattr(production,args.command)(store,config); log('video_validated',**result)
            elif args.command=='retry-render':
                result=production.retry_render(store,config); log('video_validated',**result)
            elif args.command=='prepare':
                research.research_edition(store,config); production.create_script(store); result=production.render(store,config)
                log('edition_prepared',**result,upload='pending exact-render media inspection')
            elif args.command=='inspect-media':
                log('media_inspected',edition=args.edition,**inspection(store,args.reviewer,args.approve_video,args.audio_listened,args.private_audio_waiver))
            elif args.command in ('upload-private','publish-approved'):
                state=store.load(); require_ready(store,state,config,allow_audio_waiver=args.command=='upload-private')
                api=youtube.API(config['oauth_token'])
                item=youtube.upload(store,state,api) if args.command=='upload-private' else youtube.publish(store,state,api,args.approve_render)
                log('video_confirmed',edition=args.edition,video_id=item['id'],url='https://www.youtube.com/watch?v='+item['id'],
                    returned_visibility=item['status']['privacyStatus'],upload_status=item['status']['uploadStatus'])
                if args.command=='upload-private':
                    research.write(Path(args.state_root)/'end-to-end.json',{'edition':args.edition,'at':now().isoformat(),'private_upload_verified':True,'video_id':item['id']})
            elif args.command=='inspect':
                state=store.load(); result={'edition':args.edition,'stage':state['stage'],'local_state_only':True,'video_path':state.get('video_path'),
                                            'manifest':state.get('manifest'),'inspection':state.get('inspection')}
                if state.get('upload',{}).get('video_id'): result['public_approval_token']=youtube.approval_token(state)
                log('edition_inspection',**result)
        return 0
    except (Failure,OSError,ValueError,KeyError,TypeError) as exc:
        log('failure',command=args.command,edition=getattr(args,'edition',None),error=str(exc)); return 1
    finally: set_log_path(None)

if __name__=='__main__': raise SystemExit(main())
