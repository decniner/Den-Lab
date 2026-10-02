"""Import a source-backed rendered bundle without losing upload recovery state."""
import datetime as dt
import json
import shutil
import subprocess
from pathlib import Path
from urllib.parse import urlsplit

from .core import Failure, check_artifacts, digest, manifest_hash, now
from . import youtube, media

def read(path):
    try: return json.loads(Path(path).read_text(encoding="utf-8-sig"))
    except (OSError, ValueError) as exc: raise Failure(f"Missing or malformed JSON: {path}") from exc

def validate_sources(document, at):
    if document.get("fixture") is not False or not document.get("sources"):
        raise Failure("A live edition requires real source records.")
    ids=set(); urls=set()
    for source in document["sources"]:
        url=source["url"]; parsed=urlsplit(url)
        if parsed.scheme != "https" or not parsed.hostname or source["id"] in ids or url in urls:
            raise Failure("Source IDs and HTTPS URLs must be present and unique.")
        ids.add(source["id"]); urls.add(url)
        stamp=source.get("published_at")
        if stamp:
            published=dt.datetime.fromisoformat(stamp.replace("Z","+00:00"))
        else:
            published=dt.datetime.fromisoformat(source["published_date_tokyo"]).replace(tzinfo=dt.timezone(dt.timedelta(hours=9)))
        if published.tzinfo is None or at-published > dt.timedelta(hours=48) or published-at > dt.timedelta(minutes=5):
            raise Failure("News source is stale, future-dated, or missing its timezone.")
    return ids

def executable(name):
    found=shutil.which(name)
    if found: return found
    portable=Path(__file__).resolve().parent.parent/".tools"/"ffmpeg"
    matches=list(portable.glob(f"*/bin/{name}.exe"))
    if len(matches)==1: return str(matches[0])
    raise Failure(f"Install {name} and add its bin directory to PATH.")

def validate_video(path):
    try:
        probe=subprocess.run([executable("ffprobe"),"-v","error","-show_streams","-show_format","-of","json",str(path)],capture_output=True,text=True,timeout=30,check=True)
        info=json.loads(probe.stdout); streams=info["streams"]
        video=next(s for s in streams if s["codec_type"]=="video")
        audio=next(s for s in streams if s["codec_type"]=="audio")
        if (video["width"],video["height"])!=(1080,1920) or abs(float(info["format"]["duration"])-80)>0.1 or video["codec_name"]!="h264" or audio["codec_name"]!="aac":
            raise Failure("Video must be an 80-second 1080x1920 H.264/AAC edition.")
        subprocess.run([executable("ffmpeg"),"-v","error","-xerror","-i",str(path),"-f","null","-"],capture_output=True,timeout=600,check=True)
    except (subprocess.SubprocessError, ValueError, KeyError, StopIteration) as exc:
        raise Failure("Video probing or complete decode failed.") from exc

def check_bundle(bundle, at=None):
    bundle=Path(bundle).resolve(); report=read(bundle/"validation.json")
    script=read(bundle/"script.json"); sources=read(bundle/"sources.json")
    if report.get("fixture") is not False or report.get("mode")!="live-news" or script.get("mode")!="live-news" or report.get("edition")!=script.get("edition") or report.get("decode_validation")!="passed":
        raise Failure("Bundle is not a validated live-news edition.")
    filename=report.get("video_file","japan-news-80s-tiktok.mp4")
    if not isinstance(filename,str) or Path(filename).name!=filename or '/' in filename or '\\' in filename or not filename.endswith('.mp4'):
        raise Failure("Video filename must be a local MP4 basename.")
    title=report.get("title","Japan News in 80 Seconds | "+report["edition"])
    if not isinstance(title,str) or not title.strip() or len(title)>100: raise Failure("Video title must contain 1-100 characters.")
    files={"video":bundle/filename,"script":bundle/"script.json","sources":bundle/"sources.json"}
    for key,path in files.items():
        if digest(path)!=report.get(key+"_sha256"): raise Failure(f"Bundle {key} checksum differs from its validation report.")
    ids=validate_sources(sources,at or now())
    if not script.get("segments"): raise Failure("Spoken script is missing.")
    for segment in script["segments"]:
        if not segment.get("text") or (segment.get("story") not in ("intro","outro") and segment.get("source") not in ids):
            raise Failure("A script claim is missing a source reference.")
    media.validate_captions(read(bundle/"captions.json"),80)
    validate_video(files["video"])
    return report, sources

def prepare(store,bundle,channel,at=None):
    if not channel: raise Failure("Configure the exact YouTube channel ID before importing an edition.")
    bundle=Path(bundle).resolve(); report,sources=check_bundle(bundle,at)
    if report["edition"]!=store.edition: raise Failure("Bundle edition ID differs from requested edition.")
    if (store.path/"edition.json").exists():
        state=store.load(); check_artifacts(state)
        if state.get("channel_id")!=channel: raise Failure("Edition belongs to a different YouTube channel.")
        if state["manifest"]["video_sha256"]!=report["video_sha256"]: raise Failure("Edition ID already binds a different render.")
        for name in ("script.json","sources.json","captions.json"):
            if digest(bundle/name)!=digest(store.path/"bundle"/name): raise Failure("Edition editorial artifacts changed.")
        return state
    target=store.path/"bundle"; target.mkdir(parents=True,exist_ok=True)
    names=[report.get("video_file","japan-news-80s-tiktok.mp4"),"script.json","sources.json","captions.json","validation.json"]
    if (bundle/"narration-80s.wav").exists(): names.append("narration-80s.wav")
    for name in names: shutil.copyfile(bundle/name,target/name)
    state={"edition":store.edition,"mode":"live","stage":"validated","created_at":now().isoformat(),"channel_id":channel,
           "source_metadata":sources,"video_path":str(target/names[0]),
           "manifest":{"video_sha256":report["video_sha256"],"duration":80,"title":report.get("title","Japan News in 80 Seconds | "+store.edition),
                       "description":"Source-backed news. Synthetic narration; original graphics. Sources:\n"+"\n".join(s["url"] for s in sources["sources"]),
                       "containsSyntheticMedia":True,"artifacts":{str(target/name):digest(target/name) for name in names[1:]}}}
    state["render_manifest_sha256"]=manifest_hash(state); store.save(state)
    return state

def upload_bundle(store,bundle,channel,api,at=None):
    with store.lock(): return youtube.upload(store,prepare(store,bundle,channel,at),api)
