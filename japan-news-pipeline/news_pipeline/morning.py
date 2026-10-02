"""Private upload of today's prepared edition; never replay old news."""
import argparse
import datetime as dt
from pathlib import Path
from . import rendered, youtube
from .core import Failure, Store, log, now, set_log_path

def edition_date(at):
    return at.astimezone(dt.timezone(dt.timedelta(hours=9))).date().isoformat()

def select_bundle(inbox,at):
    today=Path(inbox).resolve()/edition_date(at)
    ready=rendered.read(today/"ready.json")
    edition=ready["edition"]
    prefixes=tuple(country+"-news-"+edition_date(at).replace("-","")+"-" for country in ("japan","philippine","global","ai"))
    if not edition.startswith(prefixes):
        raise Failure("Morning inbox edition does not match a supported news category and today's Japan date.")
    bundle=(today/ready["bundle"]).resolve()
    if not bundle.is_relative_to(today) or bundle==today:
        raise Failure("Bundle path must stay inside today's inbox folder.")
    return edition,bundle

def approve_ready(ready,bundle,at):
    report=rendered.read(bundle/"validation.json")
    try: reviewed=dt.datetime.fromisoformat(ready["reviewed_at"].replace("Z","+00:00"))
    except (KeyError,ValueError,TypeError) as exc: raise Failure("Morning edition needs a producer factual-review timestamp.") from exc
    if not ready.get("reviewed_by") or ready.get("approved_video_sha256")!=report["video_sha256"] or reviewed.tzinfo is None or at-reviewed>dt.timedelta(hours=48) or reviewed-at>dt.timedelta(minutes=5):
        raise Failure("Producer factual approval is missing, stale, or belongs to a different render.")

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inbox",required=True); parser.add_argument("--state-root",required=True)
    parser.add_argument("--config",required=True); parser.add_argument("--dry-run",action="store_true")
    args=parser.parse_args(argv)
    try:
        at=now(); edition,bundle=select_bundle(args.inbox,at)
        approve_ready(rendered.read(Path(args.inbox)/edition_date(at)/"ready.json"),bundle,at)
        if args.dry_run:
            rendered.check_bundle(bundle,at); log("morning_dry_run",edition=edition,upload="skipped",cost_usd=0); return 0
        config=rendered.read(args.config); store=Store(args.state_root,edition)
        with store.lock():
            set_log_path(store.path/"events.jsonl")
            state=rendered.prepare(store,bundle,config.get("channel_id"),at)
            item=youtube.upload(store,state,youtube.API(config["oauth_token"]))
            log("video_confirmed",video_id=item["id"],url="https://www.youtube.com/watch?v="+item["id"],returned_visibility=item["status"]["privacyStatus"])
        return 0
    except (Failure,OSError,ValueError,KeyError,TypeError) as exc:
        log("failure",command="morning",error=str(exc)); return 1

if __name__=="__main__": raise SystemExit(main())
