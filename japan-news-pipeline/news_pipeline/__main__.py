import argparse
import datetime as dt
import json
import sys
from pathlib import Path

from . import evidence, media, youtube, rendered
from .core import Failure, Store, check_artifacts, digest, log, manifest_hash, now, require_content, set_log_path

def read_json(path):
    try: return json.loads(Path(path).read_text(encoding="utf-8-sig"))
    except (OSError, ValueError) as exc: raise Failure(f"JSON file missing or malformed: {path}") from exc

def write_json(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")

def output_video(item):
    log("video_confirmed", video_id=item["id"], url="https://www.youtube.com/watch?v=" + item["id"],
        returned_visibility=item["status"]["privacyStatus"], upload_status=item["status"].get("uploadStatus"))

def fetch(store, args, config):
    if (store.path / "edition.json").exists(): raise Failure("Edition already exists. Use a new ID; existing state is immutable.")
    state = {"edition": args.edition, "mode": "live", "stage": "fetching", "created_at": now().isoformat(),
             "channel_id": config.get("channel_id", "")}
    store.save(state)
    try:
        data = read_json(args.input)
        stories = evidence.fetch_and_verify(data, now(), config.get("source_hosts", []))
        state.update(stories=stories, review={"by": data["reviewed_by"], "at": data["reviewed_at"]}, stage="verified")
        store.save(state); log("news_verified", edition=args.edition, stories=len(stories), mode="live")
    except Exception:
        state["stage"] = "failed"; store.save(state); raise

def fresh(state):
    require_content(state)
    if "source_metadata" in state: rendered.validate_sources(state["source_metadata"], now())
    else: evidence.verify(state["stories"], now())

def script(store, state, model_output=None):
    if state["stage"] != "verified": raise Failure("Script generation requires a verified edition.")
    fresh(state)
    result = read_json(model_output) if model_output else evidence.generate_script(state["stories"])
    evidence.validate_script(result, state["stories"])
    script_path = store.path / "script.json"; write_json(script_path, result)
    state.update(stage="scripted", script_path=str(script_path), script_sha256=digest(script_path))
    store.save(state); log("script_generated", edition=state["edition"], provider="local-extractive", cost_usd=0)

def render(store, state, args):
    if state["stage"] != "scripted": raise Failure("Rendering requires a scripted edition.")
    fresh(state)
    if digest(state["script_path"]) != state["script_sha256"]: raise Failure("Script was modified after verification.")
    result = read_json(state["script_path"]); evidence.validate_script(result, state["stories"])
    output, artifacts, length = media.render(store.path, result, args.audio, args.captions)
    artifacts[state["script_path"]] = state["script_sha256"]
    evidence_path = store.path / "evidence.json"
    write_json(evidence_path, {"stories": state["stories"], "review": state["review"]})
    artifacts[str(evidence_path)] = digest(evidence_path)
    title = args.title
    if not title.strip() or len(title) > 100: raise Failure("Title must contain 1–100 characters.")
    description = "News source extracts. Synthetic narration; original sources below.\n" + "\n".join(
        f"{s['title']}: " + ", ".join(source["url"] for source in s["sources"]) for s in state["stories"])
    if len(description) > 4500: raise Failure("Source description exceeds YouTube metadata limit.")
    state.update(stage="validated", video_path=str(output),
                 manifest={"video_sha256": digest(output), "duration": length, "title": title,
                           "description": description, "containsSyntheticMedia": True, "artifacts": artifacts})
    state["render_manifest_sha256"] = manifest_hash(state)
    store.save(state); log("video_validated", edition=state["edition"], video_sha256=digest(output), duration=length)

def dry_run(store, args):
    if (store.path / "edition.json").exists(): raise Failure("Dry-run edition exists; use a new edition ID.")
    fixture = read_json(args.fixture)
    # Fixture clock is intentionally fixed: no relabeling historical examples as live news.
    at = dt.datetime.fromisoformat(fixture["fixture_clock"])
    state = {"edition": args.edition, "mode": "fixture", "stage": "dry_running", "created_at": now().isoformat()}
    store.save(state)
    try:
        stories = evidence.fetch_and_verify(fixture, at, [], fixture=True)
        result = evidence.generate_script(stories); evidence.validate_script(result, stories)
        length = sum(max(3, len(segment["text"]) / 15) for segment in result["segments"])
        captions = []; cursor = 0
        for segment in result["segments"]:
            stop = cursor + max(3, len(segment["text"]) / 15)
            captions.append({"start": cursor, "end": stop, "text": segment["text"]}); cursor = stop
        media.validate_captions(captions, length)
        write_json(store.path / "script.json", result); write_json(store.path / "captions.json", captions)
        report = {"mode": "fixture", "fixture_clock": at.isoformat(), "news_validation": "passed",
                  "script_validation": "passed", "caption_plan_validation": "passed",
                  "narration": "skipped (dry run)", "render": "skipped (dry run)",
                  "video_validation": "skipped (no rendered media)", "upload": "skipped (dry run)",
                  "public_publish": "blocked", "video_id": None, "url": None, "returned_visibility": None,
                  "cost_usd": 0}
        write_json(store.path / "dry-run-report.json", report)
        state.update(stage="dry_run_complete", stories=stories, report=report); store.save(state)
        log("dry_run_complete", edition=args.edition, **report)
    except Exception:
        state["stage"] = "failed"; store.save(state); raise

def parser():
    root = argparse.ArgumentParser(description="Private-first, reviewed-extract news video pipeline")
    root.add_argument("--state-root", default="state"); root.add_argument("--config", default="config.json")
    commands = root.add_subparsers(dest="command", required=True)
    for name in ("fetch-news", "generate-script", "render-video", "upload-private", "upload-rendered", "publish-approved", "inspect", "dry-run"):
        command = commands.add_parser(name); command.add_argument("--edition", required=True)
        if name == "fetch-news": command.add_argument("--input", required=True)
        if name == "upload-rendered": command.add_argument("--bundle", required=True)
        if name == "generate-script": command.add_argument("--model-output", help="Validate an externally supplied script JSON; no paid call")
        if name == "render-video":
            command.add_argument("--audio", required=True); command.add_argument("--captions", required=True)
            command.add_argument("--title", required=True)
        if name == "publish-approved": command.add_argument("--approve-render", required=True)
        if name == "dry-run": command.add_argument("--fixture", default="fixtures/news.json")
    oauth = commands.add_parser("oauth-setup")
    oauth.add_argument("--client-secrets", default="client_secrets.json"); oauth.add_argument("--token", default="token.json")
    return root

def main(argv=None):
    set_log_path(None)
    args = parser().parse_args(argv)
    try:
        if args.command == "oauth-setup":
            youtube.oauth(args.client_secrets, args.token); log("oauth_saved", token_file=args.token); return 0
        store = Store(args.state_root, args.edition)
        with store.lock():
            set_log_path(store.path / "events.jsonl")
            if args.command == "dry-run": dry_run(store, args); return 0
            config = read_json(args.config)
            if args.command == "fetch-news": fetch(store, args, config); return 0
            if args.command == "upload-rendered":
                state=rendered.prepare(store,args.bundle,config.get("channel_id"))
                output_video(youtube.upload(store,state,youtube.API(config.get("oauth_token","token.json"))))
                return 0
            state = store.load()
            expected_stage = {"generate-script": "verified", "render-video": "scripted"}.get(args.command)
            if expected_stage and state.get("stage") != expected_stage:
                raise Failure(f"{args.command} requires stage {expected_stage}; current edition remains unchanged.")
            try:
                if args.command == "generate-script": script(store, state, args.model_output)
                elif args.command == "render-video": render(store, state, args)
                elif args.command == "inspect":
                    fields = {"edition": state["edition"], "mode": state["mode"], "stage": state["stage"]}
                    if state.get("manifest"):
                        check_artifacts(state); fields.update(manifest_sha256=manifest_hash(state), video_path=state["video_path"])
                    if state.get("upload", {}).get("video_id"):
                        fields.update(video_id=state["upload"]["video_id"], approval_token=youtube.approval_token(state))
                    log("edition_inspected", **fields)
                else:
                    try: fresh(state)
                    except Failure:
                        state["stage"] = "failed"; store.save(state); raise
                    if not config.get("channel_id") or config["channel_id"] != state.get("channel_id"):
                        raise Failure("Configured channel_id missing or changed since edition creation.")
                    api = youtube.API(config.get("oauth_token", "token.json"))
                    item = youtube.upload(store, state, api) if args.command == "upload-private" else youtube.publish(store, state, api, args.approve_render)
                    output_video(item)
            except Exception:
                if args.command in ("generate-script", "render-video"):
                    state["stage"] = "failed"; store.save(state)
                raise
        return 0
    except (Failure, OSError, ValueError, KeyError, TypeError, AttributeError) as exc:
        log("failure", command=args.command, edition=getattr(args, "edition", None), error=str(exc)); return 1

if __name__ == "__main__": sys.exit(main())
