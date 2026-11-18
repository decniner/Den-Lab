#!/usr/bin/env python3
"""Fail closed when reference approval and samples are missing."""
import json
import sys
from pathlib import Path

def validate(data):
    errors = []
    if data.get("status") != "LOCKED":
        errors.append("Reference style is not LOCKED")
    for key in ("reference_video_sha256", "reference_cover_sha256"):
        value = data.get(key)
        if not isinstance(value, str) or len(value) != 64 or any(c not in "0123456789abcdef" for c in value.lower()):
            errors.append(f"{key} must be a SHA256 hex digest")
    frames = data.get("frame_samples_seconds", [])
    if not isinstance(frames, list) or len(frames) < 5 or any(not isinstance(x, (int,float)) or x < 0 for x in frames):
        errors.append("At least five nonnegative frame timestamps required")
    if not data.get("approved_by") or not data.get("approved_at"):
        errors.append("Approval identity and timestamp required")
    return errors

if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python scripts/validate_manifest.py path/to/reference-manifest.json")
    issues = validate(json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")))
    for issue in issues:
        print("FAIL:", issue)
    sys.exit(1 if issues else 0)
