#!/usr/bin/env python3
"""Render a reviewed stock-footage project using local FFmpeg/FFprobe."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

from validate_manifest import validate_manifest


def timeline_duration(scenes: list[dict[str, Any]], transition: float) -> float:
    lengths = [float(scene["duration_seconds"]) for scene in scenes]
    if transition < 0:
        raise ValueError("transition duration cannot be negative")
    if len(lengths) > 1 and any(length <= transition for length in lengths):
        raise ValueError("each scene must be longer than the dissolve duration")
    return sum(lengths) - max(0, len(lengths) - 1) * transition


def ffprobe_duration(ffprobe: str, path: Path) -> float:
    result = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)],
        check=True, capture_output=True, text=True,
    )
    payload = json.loads(result.stdout)
    return float(payload["format"]["duration"])


def ffprobe_info(ffprobe: str, path: Path) -> dict[str, Any]:
    result = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name,width,height,r_frame_rate",
         "-of", "json", str(path)],
        check=True, capture_output=True, text=True,
    )
    return json.loads(result.stdout)


def _escape_filter_path(path: Path) -> str:
    # The subtitles filter has its own parser in addition to subprocess argument parsing.
    value = str(path.resolve()).replace("\\", "/")
    for character in ("\\", ":", "'", ",", "[", "]"):
        value = value.replace(character, "\\" + character)
    return value


def build_filter(scenes: list[dict[str, Any]], width: int, height: int, fps: int,
                 transition: float, captions: Path) -> str:
    parts = []
    for index, _scene in enumerate(scenes):
        parts.append(
            f"[{index}:v]setpts=PTS-STARTPTS,scale={width}:{height}:force_original_aspect_ratio=increase,"
            f"crop={width}:{height},setsar=1,fps={fps},format=yuv420p[v{index}]"
        )
    if len(scenes) == 1:
        video_label = "v0"
    else:
        prior_duration = float(scenes[0]["duration_seconds"])
        prior_label = "v0"
        for index in range(1, len(scenes)):
            offset = prior_duration - transition
            next_label = f"x{index}"
            parts.append(
                f"[{prior_label}][v{index}]xfade=transition=fade:duration={transition:.3f}:offset={offset:.3f}[{next_label}]"
            )
            prior_duration += float(scenes[index]["duration_seconds"]) - transition
            prior_label = next_label
        video_label = prior_label
    margin = 430 if height > width else 72
    style = f"FontName=Arial,FontSize=30,PrimaryColour=&H00FFFFFF,OutlineColour=&H90000000,BorderStyle=1,Outline=2,Shadow=1,Alignment=2,MarginV={margin}"
    parts.append(f"[{video_label}]subtitles=filename='{_escape_filter_path(captions)}':force_style='{style}'[vout]")
    return ";".join(parts)


def render(manifest_path: Path, output: Path, ffmpeg: str = "ffmpeg", ffprobe: str = "ffprobe",
           overwrite: bool = False) -> dict[str, Any]:
    manifest_path = manifest_path.resolve()
    base = manifest_path.parent
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    errors = validate_manifest(data, base, check_files=True)
    if errors:
        raise ValueError("manifest validation failed: " + "; ".join(errors))
    ffmpeg_path, ffprobe_path = shutil.which(ffmpeg), shutil.which(ffprobe)
    if not ffmpeg_path or not ffprobe_path:
        raise FileNotFoundError("FFmpeg and FFprobe must both be installed and available on PATH")

    scenes = data["scenes"]
    transition = float(data.get("transition_seconds", 0.25 if len(scenes) > 1 else 0))
    expected = timeline_duration(scenes, transition)
    narration = (base / data["narration_path"]).resolve()
    captions = (base / data["captions_path"]).resolve()
    narration_duration = ffprobe_duration(ffprobe_path, narration)
    if abs(expected - narration_duration) > 0.15:
        raise ValueError(f"scene timeline is {expected:.3f}s but narration is {narration_duration:.3f}s")

    width, height = (1080, 1920) if data["format"] == "shorts" else (1920, 1080)
    fps = int(data.get("fps", 30))
    if not 1 <= fps <= 60:
        raise ValueError("fps must be between 1 and 60")
    output = output.resolve()
    if output.exists() and not overwrite:
        raise FileExistsError(f"output already exists (use --overwrite to replace): {output}")
    output.parent.mkdir(parents=True, exist_ok=True)

    command = [ffmpeg_path, "-hide_banner", "-nostdin"]
    for scene in scenes:
        clip = (base / scene["clip_path"]).resolve()
        command.extend(["-ss", str(float(scene["source_in_seconds"])), "-t", str(float(scene["duration_seconds"])), "-i", str(clip)])
    command.extend(["-i", str(narration)])
    command.extend([
        "-filter_complex", build_filter(scenes, width, height, fps, transition, captions),
        "-map", "[vout]", "-map", f"{len(scenes)}:a:0",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(fps),
        "-c:a", "aac", "-b:a", "192k", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-t", f"{narration_duration:.3f}", "-movflags", "+faststart",
        "-y" if overwrite else "-n", str(output),
    ])
    result = subprocess.run(command, cwd=base, capture_output=True, text=True)
    if result.returncode:
        detail = result.stderr[-4000:]
        raise RuntimeError(f"FFmpeg failed with exit {result.returncode}:\n{detail}")
    info = ffprobe_info(ffprobe_path, output)
    actual = float(info["format"]["duration"])
    if abs(actual - narration_duration) > 0.15:
        raise RuntimeError(f"rendered duration {actual:.3f}s differs from narration {narration_duration:.3f}s")
    streams = info.get("streams", [])
    video = next((stream for stream in streams if stream.get("codec_type") == "video"), {})
    audio = next((stream for stream in streams if stream.get("codec_type") == "audio"), {})
    if video.get("codec_name") != "h264" or video.get("width") != width or video.get("height") != height:
        raise RuntimeError(f"unexpected video stream properties: {video}")
    if audio.get("codec_name") != "aac":
        raise RuntimeError(f"unexpected audio codec: {audio.get('codec_name')}")
    decoded = subprocess.run([ffmpeg_path, "-v", "error", "-i", str(output), "-f", "null", "-"],
                             capture_output=True, text=True)
    if decoded.returncode:
        raise RuntimeError("complete output decode failed: " + decoded.stderr[-2000:])
    return {"output": str(output), "duration_seconds": actual, "width": width, "height": height,
            "fps": fps, "video_codec": "h264", "audio_codec": "aac", "full_decode": "passed"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--ffmpeg", default="ffmpeg")
    parser.add_argument("--ffprobe", default="ffprobe")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()
    try:
        print(json.dumps(render(args.manifest, args.output, args.ffmpeg, args.ffprobe, args.overwrite), indent=2))
        return 0
    except (OSError, ValueError, KeyError, json.JSONDecodeError, RuntimeError) as exc:
        print(f"Render failed: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
