#!/usr/bin/env python3
"""Verify exact reference approval, names, files, hashes, and sample frames."""
import hashlib
import json
import sys
from pathlib import Path


def validate(data, root=Path.cwd()):
    errors = []
    if data.get("status") != "LOCKED":
        errors.append("Reference style is not LOCKED")
    for key, label, expected_name in (
        ("reference_video", "reference video", "Dracula_YouTube_Short_Painterly.mp4"),
        ("reference_cover", "Dracula reference cover", "Dracula_Hook_Cover.png"),
        ("cover_style_reference", "cover style reference", "A Room of One’s Own Legacy.png"),
    ):
        value = data.get(key)
        digest = data.get(f"{key}_sha256")
        if not isinstance(value, str) or not value:
            errors.append(f"{key} path is required")
            continue
        path = Path(value).expanduser()
        if not path.is_absolute():
            path = root / path
        if path.name != expected_name:
            errors.append(f"{key} must name exact {expected_name}")
        if not path.is_file():
            errors.append(f"Exact {label} missing: {path}")
        elif isinstance(digest, str) and len(digest) == 64:
            actual = hashlib.sha256(path.read_bytes()).hexdigest()
            if actual.lower() != digest.lower():
                errors.append(f"{label} SHA256 mismatch")
        else:
            errors.append(f"{key}_sha256 must be a SHA256 hex digest")
    frames = data.get("frame_samples_seconds", [])
    if not isinstance(frames, list) or len(frames) < 5 or any(not isinstance(x, (int, float)) or x < 0 for x in frames):
        errors.append("At least five nonnegative frame timestamps required")
    if not data.get("approved_by") or not data.get("approved_at"):
        errors.append("Approval identity and timestamp required")
    return errors


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python scripts/validate_manifest.py path/to/reference-manifest.json")
    manifest = Path(sys.argv[1]).resolve()
    try:
        data = json.loads(manifest.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        sys.exit(f"Cannot read reference manifest {manifest}: {exc}")
    issues = validate(data, manifest.parent)
    for issue in issues:
        print("FAIL:", issue)
    sys.exit(1 if issues else 0)
