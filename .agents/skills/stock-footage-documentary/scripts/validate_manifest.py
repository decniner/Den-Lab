#!/usr/bin/env python3
"""Fail-closed validation for documentary source manifests."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

PROVIDER_LICENSES = {
    "pexels": "https://www.pexels.com/license/",
    "pixabay": "https://pixabay.com/service/license-summary/",
    "mixkit": None,  # Mixkit requires the exact asset's Free/Restricted license evidence.
}


def is_http_url(value: Any) -> bool:
    try:
        parsed = urlparse(str(value))
        return parsed.scheme == "https" and bool(parsed.netloc)
    except ValueError:
        return False


def validate_manifest(data: dict[str, Any], base_dir: Path | None = None, check_files: bool = True) -> list[str]:
    errors: list[str] = []
    if not data.get("title"):
        errors.append("title is required")
    if data.get("format") not in {"shorts", "landscape"}:
        errors.append("format must be 'shorts' or 'landscape'")
    if not data.get("narration_path"):
        errors.append("narration_path is required")
    elif check_files and base_dir and not (base_dir / data["narration_path"]).is_file():
        errors.append(f"narration file missing: {data['narration_path']}")
    caption_path = data.get("captions_path")
    if not caption_path:
        errors.append("captions_path is required")
    elif check_files and base_dir and not (base_dir / caption_path).is_file():
        errors.append(f"captions file missing: {caption_path}")
    scenes = data.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        errors.append("scenes must be a non-empty list")
        return errors
    seen = set()
    for index, scene in enumerate(scenes, 1):
        prefix = f"scenes[{index}]"
        scene_id = str(scene.get("scene_id", "")).strip()
        if not scene_id:
            errors.append(f"{prefix}: scene_id is required")
        elif scene_id in seen:
            errors.append(f"{prefix}: duplicate scene_id {scene_id}")
        seen.add(scene_id)
        for field in ("clip_path", "creator", "asset_id"):
            if not scene.get(field):
                errors.append(f"{prefix}: {field} is required")
        if check_files and base_dir and scene.get("clip_path") and not (base_dir / scene["clip_path"]).is_file():
            errors.append(f"{prefix}: clip file missing: {scene['clip_path']}")
        provider = scene.get("provider")
        if provider not in PROVIDER_LICENSES:
            errors.append(f"{prefix}: provider must be pexels, pixabay, or mixkit")
        if not is_http_url(scene.get("source_url")):
            errors.append(f"{prefix}: source_url must be an HTTPS URL")
        acquisition = scene.get("acquisition_method", "provider-api")
        if acquisition == "provider-api":
            if provider == "mixkit":
                errors.append(f"{prefix}: mixkit is supported only through manual-provider-download")
            if not is_http_url(scene.get("download_url")):
                errors.append(f"{prefix}: download_url must be an HTTPS URL")
            if scene.get("downloaded_via_provider_ui") is True:
                errors.append(f"{prefix}: downloaded_via_provider_ui must be false for provider-api acquisition")
        elif acquisition == "manual-provider-download":
            if scene.get("downloaded_via_provider_ui") is not True:
                errors.append(f"{prefix}: downloaded_via_provider_ui must be true for manual provider downloads")
        else:
            errors.append(f"{prefix}: acquisition_method must be provider-api or manual-provider-download")
        if provider in PROVIDER_LICENSES and PROVIDER_LICENSES[provider] and scene.get("license_url") != PROVIDER_LICENSES[provider]:
            errors.append(f"{prefix}: license_url must match the provider's official license page")
        if provider == "mixkit" and not is_http_url(scene.get("license_url")):
            errors.append(f"{prefix}: mixkit license_url must link to the specific asset license")
        if not scene.get("download_date"):
            errors.append(f"{prefix}: download_date is required")
        if not isinstance(scene.get("source_in_seconds"), (int, float)) or scene["source_in_seconds"] < 0:
            errors.append(f"{prefix}: source_in_seconds must be a non-negative number")
        if not isinstance(scene.get("duration_seconds"), (int, float)) or scene["duration_seconds"] <= 0:
            errors.append(f"{prefix}: duration_seconds must be positive")
        review = scene.get("review") or {}
        if review.get("license_status") != "approved":
            errors.append(f"{prefix}: license review is not approved")
        if review.get("commercial_use_confirmed") is not True:
            errors.append(f"{prefix}: commercial_use_confirmed must be true after review")
        if review.get("third_party_rights") != "clear":
            errors.append(f"{prefix}: third_party_rights must be reviewed as clear")
        if not review.get("reviewer") or not review.get("reviewed_at"):
            errors.append(f"{prefix}: reviewer and reviewed_at are required")
        if not review.get("restrictions_checked"):
            errors.append(f"{prefix}: restrictions_checked must record the review")
        if not is_http_url(review.get("license_evidence_url")):
            errors.append(f"{prefix}: license_evidence_url must link to checked license evidence")
        if not review.get("release_review"):
            errors.append(f"{prefix}: release_review must record releases verified or not applicable")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--skip-file-checks", action="store_true")
    args = parser.parse_args()
    try:
        data = json.loads(args.manifest.read_text(encoding="utf-8"))
        errors = validate_manifest(data, args.manifest.resolve().parent, not args.skip_file_checks)
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Invalid manifest: {exc}", file=sys.stderr)
        return 2
    if errors:
        print(json.dumps({"valid": False, "errors": errors}, indent=2))
        return 1
    print(json.dumps({"valid": True, "scene_count": len(data["scenes"])}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
