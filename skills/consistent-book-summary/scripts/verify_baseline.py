#!/usr/bin/env python3
"""Verify the immutable approved production package against its SHA-256 manifest."""
from __future__ import annotations
import hashlib
import json
import sys
from pathlib import Path


MANIFEST = Path(__file__).parents[1] / "baseline" / "SHA256SUMS.json"
BASE = MANIFEST.parent


def digest(path: Path) -> str:
    sha = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            sha.update(chunk)
    return sha.hexdigest()


def verify(manifest_path: Path = MANIFEST):
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    root = manifest_path.parent
    expected = data.get("files", {})
    errors = []
    for relative, record in expected.items():
        path = root / relative
        if not path.is_file():
            errors.append(f"Missing baseline file: {relative}")
        elif digest(path) != record.get("sha256"):
            errors.append(f"SHA-256 mismatch: {relative}")
        elif path.stat().st_size != record.get("bytes"):
            errors.append(f"Size mismatch: {relative}")
    actual = {path.relative_to(root).as_posix() for path in root.rglob("*") if path.is_file() and path != manifest_path}
    for relative in sorted(actual - set(expected)):
        errors.append(f"Unmanifested baseline file: {relative}")
    return errors


if __name__ == "__main__":
    issues = verify()
    if issues:
        print("Baseline verification FAILED:")
        for issue in issues:
            print(f"- {issue}")
        sys.exit(1)
    print("Approved production baseline verified.")
