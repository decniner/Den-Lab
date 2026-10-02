import json
import math
import shutil
import subprocess
from pathlib import Path
from .core import Failure, digest

def run(command, timeout):
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=timeout, check=True)
        return result.stdout
    except (OSError, subprocess.SubprocessError, TimeoutError) as exc:
        raise Failure("Media command failed or timed out; check FFmpeg/FFprobe and input media.") from exc

def probe(path):
    try:
        return json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)], 30))
    except ValueError as exc: raise Failure("Malformed FFprobe response.") from exc

def duration(info):
    try:
        value = float(info["format"]["duration"])
        if not math.isfinite(value) or value <= 0 or value > 1800: raise ValueError()
        return value
    except (KeyError, ValueError, TypeError) as exc: raise Failure("Invalid duration; allowed range is 0–1800 seconds.") from exc

def validate_captions(captions, length):
    end = 0
    if not captions: raise Failure("Captions are missing.")
    try:
        for caption in captions:
            start, stop = float(caption["start"]), float(caption["end"])
            if not all(map(math.isfinite, (start, stop))) or start < end or stop <= start or stop > length + .05:
                raise Failure("Caption timing is invalid, overlapping or outside the narration.")
            if not isinstance(caption["text"], str) or not caption["text"].strip(): raise Failure("Caption text missing.")
            # Permit a whole sentence per card, but reject unreadable pacing.
            if len(caption["text"]) / (stop - start) > 25: raise Failure("Captions exceed 25 characters/second.")
            end = stop
    except (KeyError, ValueError, TypeError) as exc: raise Failure("Malformed caption timings.") from exc

def stamp(seconds):
    value = round(seconds * 1000)
    hours, value = divmod(value, 3600000); minutes, value = divmod(value, 60000)
    seconds, ms = divmod(value, 1000)
    return f"{hours:02}:{minutes:02}:{seconds:02},{ms:03}"

def render(directory, script, audio, caption_path):
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise Failure("FFmpeg and FFprobe are required. Install them and add their bin folder to PATH.")
    audio = Path(audio).resolve(); caption_path = Path(caption_path).resolve()
    info = probe(audio); length = duration(info)
    if not any(s.get("codec_type") == "audio" for s in info.get("streams", [])): raise Failure("Narration has no audio stream.")
    try: captions = json.loads(caption_path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc: raise Failure("Caption JSON is missing or malformed.") from exc
    validate_captions(captions, length)
    if [c["text"] for c in captions] != [s["text"] for s in script["segments"]]:
        raise Failure("Captions must match every verified script segment in order.")
    directory = Path(directory).resolve()
    srt = directory / "captions.srt"
    srt.write_text("\n\n".join(f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}"
                             for i, c in enumerate(captions)), encoding="utf-8")
    # Burn with a relative filename to avoid Windows drive escaping in filter syntax.
    output = directory / "video.mp4"
    command = ["ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=0x172535:s=1280x720:r=25",
               "-i", str(audio), "-vf", "subtitles=captions.srt:force_style='Fontsize=28,MarginV=80'",
               "-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "aac",
               "-t", str(length), "-movflags", "+faststart", str(output)]
    try:
        subprocess.run(command, cwd=directory, capture_output=True, timeout=600, check=True)
    except (OSError, subprocess.SubprocessError) as exc: raise Failure("FFmpeg rendering failed; edition is not uploadable.") from exc
    rendered = probe(output); actual = duration(rendered)
    streams = rendered.get("streams", [])
    video_streams = [s for s in streams if s.get("codec_type") == "video"]
    if not video_streams or not any(s.get("codec_type") == "audio" for s in streams):
        raise Failure("Rendered output must contain video and audio.")
    if (video_streams[0].get("width"), video_streams[0].get("height")) != (1280, 720):
        raise Failure("Rendered dimensions invalid.")
    if abs(actual - length) > .3: raise Failure("Render duration differs from narration.")
    run(["ffmpeg", "-v", "error", "-xerror", "-i", str(output), "-f", "null", "-"], 600)
    return output, {str(audio): digest(audio), str(caption_path): digest(caption_path), str(srt): digest(srt)}, actual
