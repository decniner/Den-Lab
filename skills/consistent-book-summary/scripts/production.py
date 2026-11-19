#!/usr/bin/env python3
"""Portable fail-closed validator and Remotion still-image render orchestrator."""
from __future__ import annotations
import argparse
import hashlib
import json
import struct
import shutil
import subprocess
import sys
from pathlib import Path


def resolve_path(root: Path, value: str) -> Path:
    path = Path(value).expanduser()
    return path if path.is_absolute() else root / path


def run_step(args, cwd: Path, run=subprocess.run):
    if not isinstance(args, (list, tuple)) or not args or not all(isinstance(x, str) for x in args):
        raise ValueError("Each command must be a non-empty argument array of strings")
    try:
        result = run(list(args), cwd=str(cwd), shell=False, check=False)
    except FileNotFoundError as exc:
        raise RuntimeError(f"Required executable unavailable: {args[0]}") from exc
    if result.returncode:
        raise RuntimeError(f"Command failed ({result.returncode}): {args[0]}")
    return result


def _png_dimensions(path: Path):
    try:
        with path.open("rb") as stream:
            head = stream.read(24)
        if head[:8] != b"\x89PNG\r\n\x1a\n" or head[12:16] != b"IHDR":
            return None
        return struct.unpack(">II", head[16:24])
    except OSError:
        return None


def _validate_emotional_review(scenes):
    """Require a human-reviewed emotional context record for every scene."""
    errors = []
    if not isinstance(scenes, list) or not scenes:
        return ["Emotional review requires a non-empty scene list"]
    for index, scene in enumerate(scenes):
        review = scene.get("emotional_review") if isinstance(scene, dict) else None
        if not isinstance(review, dict):
            errors.append(f"Scene {index} requires an emotional_review record")
            continue
        for key in ("narration_meaning", "intended_tone", "facial_expression", "body_language", "environmental_mood"):
            if not isinstance(review.get(key), str) or not review[key].strip():
                errors.append(f"Scene {index} emotional_review.{key} is required")
        if review.get("human_review_status") != "approved":
            errors.append(f"Scene {index} emotional review must be human-approved before rendering")
        if review.get("intentional_contrast") is True and not str(review.get("contrast_justification", "")).strip():
            errors.append(f"Scene {index} intentional emotional contrast requires a story-based justification")
        tone = str(review.get("intended_tone", "")).lower()
        expressions = str(review.get("facial_expression", "")).lower()
        body = str(review.get("body_language", "")).lower()
        hardship = any(term in tone for term in ("hardship", "grief", "separation", "imprison", "illness", "suffering", "trauma"))
        cheerful = any(term in expressions for term in ("smile", "smiling", "grin", "cheerful", "happy", "joyful"))
        if hardship and cheerful and not (review.get("intentional_contrast") is True and str(review.get("contrast_justification", "")).strip()):
            errors.append(f"Scene {index} pairs hardship with a cheerful expression without justified intentional contrast")
        if hardship and not body.strip():
            errors.append(f"Scene {index} hardship body language must be explicitly reviewed")
    return errors


def validate_manifest(data, root: Path, check_imagegen=True, which=shutil.which):
    errors = []
    refs = data.get("references", {})
    for key, label, expected_name in (("video", "reference video", "Dracula_YouTube_Short_Painterly.mp4"),
                                      ("cover", "Dracula reference cover", "Dracula_Hook_Cover.png"),
                                      ("cover_style", "cover style reference", "A Room of One’s Own Legacy.png")):
        value = refs.get(key)
        if not isinstance(value, str) or not value:
            errors.append(f"Missing exact {label} path ({expected_name})")
        else:
            path = resolve_path(root, value)
            if not path.is_file():
                errors.append(f"Exact {label} missing: {path} (expected {expected_name})")
            elif path.name != expected_name:
                errors.append(f"{label} must be the exact file named {expected_name}")
            else:
                expected_hash = refs.get(f"{key}_sha256")
                if expected_hash:
                    actual_hash = hashlib.sha256(path.read_bytes()).hexdigest()
                    if actual_hash.lower() != expected_hash.lower():
                        errors.append(f"{label} SHA256 mismatch; expected approved exact reference {expected_hash}")
    duration = data.get("approved_duration_seconds")
    hook = data.get("hook_duration_seconds")
    if not isinstance(duration, (int, float)) or duration <= 0:
        errors.append("approved_duration_seconds must be positive")
    if not isinstance(hook, (int, float)) or hook <= 0 or (isinstance(duration, (int, float)) and hook >= duration):
        errors.append("Hook duration must be positive and shorter than approved video duration")
    artwork = data.get("artwork", {})
    for key in ("cover", "contact_sheet"):
        value = artwork.get(key)
        if not isinstance(value, str) or not value:
            errors.append(f"Missing artwork {key} path")
        elif Path(value).suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp"):
            errors.append(f"Artwork {key} must be a raster image; SVG/geometric vector placeholders are rejected")
        elif not resolve_path(root, value).is_file():
            errors.append(f"Artwork {key} file missing: {resolve_path(root, value)}")
    cover_path = resolve_path(root, str(artwork.get("cover", "")))
    dims = _png_dimensions(cover_path) if cover_path.is_file() else None
    if dims != (1080, 1920):
        errors.append("Hook cover must be a 1080x1920 PNG")
    expected_frames = round(duration * 30) if isinstance(duration, (int, float)) and duration > 0 else None
    scenes = artwork.get("scenes", [])
    if not isinstance(scenes, list) or not scenes:
        errors.append("At least one story-specific still illustration is required for the narration scenes")
    else:
        expected_start = 0
        for index, scene in enumerate(scenes):
            if isinstance(scene, str):
                image_path, start_ms, end_ms = scene, None, None
            elif isinstance(scene, dict):
                image_path = scene.get("image")
                start_ms, end_ms = scene.get("start_ms"), scene.get("end_ms")
            else:
                image_path, start_ms, end_ms = None, None, None
            if not isinstance(image_path, str) or Path(image_path).suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp") or not resolve_path(root, image_path).is_file():
                errors.append(f"Scene {index} must use an existing raster still image; primitive SVG characters are rejected")
            if not isinstance(start_ms, (int, float)) or not isinstance(end_ms, (int, float)) or start_ms != expected_start or end_ms <= start_ms:
                errors.append(f"Scene {index} must have contiguous valid start_ms/end_ms narration timing")
            else:
                expected_start = end_ms
        expected_end = expected_frames * 1000 / 30 if expected_frames else None
        if expected_end and expected_start != expected_end:
            errors.append("Still-image scene plan must cover the approved runtime without gaps or extension")
    errors.extend(_validate_emotional_review(scenes))
    review = artwork.get("review", {})
    checks = {"status": "approved", "premium_illustration": True, "consistent_character": True,
              "no_primitive_vectors": True}
    for key, expected in checks.items():
        if review.get(key) != expected:
            errors.append(f"Artwork quality gate requires {key}={expected!r}; review the contact sheet before rendering")
    tones = review.get("palette_tones")
    if not isinstance(tones, int) or not 2 <= tones <= 3:
        errors.append("Artwork palette_tones must be 2 or 3")
    if not review.get("reviewer"):
        errors.append("Artwork quality review requires reviewer")
    narration = data.get("narration")
    if data.get("narration_provider") != "kokoro":
        errors.append("narration_provider must be kokoro")
    if not isinstance(narration, str) or not resolve_path(root, narration).is_file():
        errors.append(f"Kokoro narration file missing: {narration}")
    voice = data.get("narration_voice")
    settings = data.get("narration_settings", {})
    if not isinstance(voice, str) or not voice.strip():
        errors.append("narration_voice must explicitly name the approved Kokoro voice")
    if settings.get("lang_code") != "a" or not isinstance(settings.get("speed"), (int, float)) or settings.get("speed") <= 0:
        errors.append("narration_settings must explicitly pin Kokoro lang_code and positive speed")
    visuals = data.get("visuals", {})
    if visuals.get("mode") != "still_images":
        errors.append("visuals.mode must be still_images")
    if visuals.get("character_animation") is not False:
        errors.append("Character animation/rigging is not part of this still-image workflow; set character_animation=false")
    timeline = data.get("timeline", {})
    if timeline.get("narration_start_frame") != 0:
        errors.append("Narration must remain at frame 0; do not offset the existing Kokoro track")
    if timeline.get("total_frames") != expected_frames:
        errors.append("timeline.total_frames must equal approved_duration_seconds × 30")
    if not isinstance(timeline.get("hook_frames"), int) or timeline.get("hook_frames", 0) <= 0 or (expected_frames and timeline.get("hook_frames", 0) >= expected_frames):
        errors.append("Hook must occupy frames inside the existing approved duration")
    if timeline.get("caption_component") != "components/Caption.tsx":
        errors.append("Use the shared components/Caption.tsx for consistent caption baselines")
    if not isinstance(timeline.get("caption_baseline_px"), (int, float)):
        errors.append("timeline.caption_baseline_px must define the single shared caption baseline")
    expected_hook_frames = round(hook * 30) if isinstance(hook, (int, float)) and hook > 0 else None
    if expected_hook_frames and abs(timeline.get("hook_frames", 0) - expected_hook_frames) > 1:
        errors.append("timeline.hook_frames must match hook_duration_seconds at 30 fps")
    image_generation = data.get("image_generation", {})
    if check_imagegen and image_generation.get("generation_pending") is not False:
        imagegen = image_generation.get("executable")
        candidate = str(resolve_path(root, imagegen)) if isinstance(imagegen, str) and (Path(imagegen).is_absolute() or Path(imagegen).parent != Path('.')) else imagegen
        if not candidate or not (Path(candidate).is_file() if Path(candidate).is_absolute() else which(candidate)):
            errors.append(f"Image-generation dependency unavailable: configure image_generation.executable (currently {imagegen!r})")
    render = data.get("render", {})
    for key in ("entry_point", "props", "output", "hook_output", "hook_composition", "full_composition", "remotion_cli"):
        if not render.get(key):
            errors.append(f"Missing render.{key}")
    for key in ("entry_point", "props"):
        if render.get(key) and not resolve_path(root, render[key]).is_file():
            errors.append(f"Render input missing: {resolve_path(root, render[key])}")
    cli = render.get("remotion_cli", [])
    if not isinstance(cli, list) or not cli or not all(isinstance(x, str) for x in cli):
        errors.append("render.remotion_cli must be a portable argv array, e.g. ['node','node_modules/remotion/cli/index.mjs']")
    elif not (Path(cli[0]).is_file() if Path(cli[0]).is_absolute() else which(cli[0])):
        errors.append(f"Remotion runtime executable unavailable: {cli[0]}")
    if not which("ffprobe"):
        errors.append("FFprobe unavailable; install/configure FFmpeg before rendering")
    return errors


def probe_video(path: Path, ffprobe="ffprobe", run=subprocess.run):
    try:
        result = run([ffprobe, "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)],
                     capture_output=True, text=True, shell=False, check=False)
    except FileNotFoundError as exc:
        raise RuntimeError(f"FFprobe unavailable: {ffprobe}") from exc
    if result.returncode:
        raise RuntimeError(f"FFprobe could not read {path}")
    metadata = json.loads(result.stdout)
    streams = metadata.get("streams", [])
    video = next((s for s in streams if s.get("codec_type") == "video"), None)
    audio = next((s for s in streams if s.get("codec_type") == "audio"), None)
    if not video or (video.get("width"), video.get("height")) != (1080, 1920):
        raise RuntimeError(f"Video must be 1080x1920: {path}")
    if video.get("r_frame_rate") != "30/1":
        raise RuntimeError(f"Video must be 30 FPS: {path}")
    if not audio:
        raise RuntimeError(f"Video has no narration/audio stream: {path}")
    duration = float(metadata.get("format", {}).get("duration", 0))
    return {"duration_seconds": duration, "width": video["width"], "height": video["height"],
            "frame_rate": video["r_frame_rate"], "audio": True}


def render(data, root: Path, ffprobe="ffprobe", run=subprocess.run):
    cfg = data["render"]
    cli = cfg["remotion_cli"]
    entry, props = str(resolve_path(root, cfg["entry_point"])), str(resolve_path(root, cfg["props"]))
    for comp, output in ((cfg["hook_composition"], cfg["hook_output"]), (cfg["full_composition"], cfg["output"])):
        dest = resolve_path(root, output)
        dest.parent.mkdir(parents=True, exist_ok=True)
        args = cli + ["render", entry, comp, str(dest), "--props", props]
        run_step(args, root, run=run)
        if not dest.is_file() or dest.stat().st_size == 0:
            raise RuntimeError(f"Remotion did not produce output: {dest}")
        meta = probe_video(dest, ffprobe, run=run)
        limit = min(data["approved_duration_seconds"], data["hook_duration_seconds"]) if comp == cfg["hook_composition"] else data["approved_duration_seconds"]
        if meta["duration_seconds"] > limit + 1 / 30:
            raise RuntimeError(f"Rendered {comp} exceeds its approved duration; hook must replace visual frames inside the existing timeline")
        if comp == cfg["full_composition"] and abs(meta["duration_seconds"] - data["approved_duration_seconds"]) > 1 / 30:
            raise RuntimeError("Final duration must match approved_duration_seconds within one frame")
    return {"hook": str(resolve_path(root, cfg["hook_output"])), "video": str(resolve_path(root, cfg["output"]))}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--ffprobe", default="ffprobe")
    args = parser.parse_args(argv)
    manifest_path = args.manifest.resolve()
    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        parser.exit(2, f"Cannot read production manifest {manifest_path}: {exc}\n")
    issues = validate_manifest(data, manifest_path.parent)
    if issues:
        parser.exit(2, "Production gate failed:\n" + "\n".join(f"- {e}" for e in issues) + "\n")
    if args.validate_only:
        print("Production manifest validated; human quality gate is recorded.")
        return 0
    try:
        result = render(data, manifest_path.parent, args.ffprobe)
    except (RuntimeError, ValueError, OSError) as exc:
        parser.exit(1, f"Production failed: {exc}\n")
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
