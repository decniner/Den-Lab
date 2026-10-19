#!/usr/bin/env python3
"""Discover stock-video candidates from official Pexels/Pixabay APIs.

Search results are unreviewed candidates. This script does not download media or
grant rights approval. It uses only Python's standard library.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

PROVIDER_LICENSES = {
    "pexels": "https://www.pexels.com/license/",
    "pixabay": "https://pixabay.com/service/license-summary/",
}


def fetch_json(url: str, headers: dict[str, str] | None = None) -> dict[str, Any]:
    request = Request(url, headers={"User-Agent": "stock-footage-documentary/1.0", **(headers or {})})
    with urlopen(request, timeout=25) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status}")
        return json.loads(response.read().decode("utf-8"))


def parse_pexels(payload: dict[str, Any], query: str) -> list[dict[str, Any]]:
    results = []
    for video in payload.get("videos", []):
        files = [item for item in video.get("video_files", []) if item.get("link")]
        if not files:
            continue
        chosen = max(files, key=lambda item: (item.get("height", 0), item.get("width", 0)))
        creator = video.get("user") or {}
        results.append({
            "provider": "pexels",
            "acquisition_method": "provider-api",
            "downloaded_via_provider_ui": False,
            "query": query,
            "asset_id": str(video.get("id", "")),
            "title": "",
            "creator": creator.get("name", ""),
            "creator_url": creator.get("url", ""),
            "source_url": video.get("url", ""),
            "download_url": chosen.get("link", ""),
            "width": chosen.get("width"),
            "height": chosen.get("height"),
            "duration_seconds": video.get("duration"),
            "license_url": PROVIDER_LICENSES["pexels"],
            "license_review": {"status": "pending", "reviewer": None, "reviewed_at": None,
                               "license_evidence_url": "", "commercial_use_confirmed": None,
                               "third_party_rights": "unresolved", "release_review": "",
                               "restrictions_checked": False, "restrictions": [], "attribution": ""},
        })
    return results


def parse_pixabay(payload: dict[str, Any], query: str) -> list[dict[str, Any]]:
    results = []
    for video in payload.get("hits", []):
        variants = video.get("videos") or {}
        available = [item for item in variants.values() if item.get("url")]
        if not available:
            continue
        chosen = max(available, key=lambda item: (item.get("height", 0), item.get("width", 0)))
        user = video.get("user", "")
        user_id = video.get("user_id", "")
        results.append({
            "provider": "pixabay",
            "acquisition_method": "provider-api",
            "downloaded_via_provider_ui": False,
            "query": query,
            "asset_id": str(video.get("id", "")),
            "title": "",
            "creator": user,
            "creator_url": f"https://pixabay.com/users/{user}-{user_id}/" if user else "",
            "source_url": video.get("pageURL", ""),
            "download_url": chosen.get("url", ""),
            "width": chosen.get("width"),
            "height": chosen.get("height"),
            "duration_seconds": video.get("duration"),
            "license_url": PROVIDER_LICENSES["pixabay"],
            "license_review": {"status": "pending", "reviewer": None, "reviewed_at": None,
                               "license_evidence_url": "", "commercial_use_confirmed": None,
                               "third_party_rights": "unresolved", "release_review": "",
                               "restrictions_checked": False, "restrictions": [], "attribution": ""},
        })
    return results


def search_pexels(query: str, api_key: str, per_page: int = 15) -> list[dict[str, Any]]:
    url = "https://api.pexels.com/v1/videos/search?" + urlencode({"query": query, "per_page": per_page})
    return parse_pexels(fetch_json(url, {"Authorization": api_key}), query)


def search_pixabay(query: str, api_key: str, per_page: int = 20) -> list[dict[str, Any]]:
    url = "https://pixabay.com/api/videos/?" + urlencode({"key": api_key, "q": query, "per_page": per_page})
    return parse_pixabay(fetch_json(url), query)


def discover(brief: dict[str, Any], pexels_key: str = "", pixabay_key: str = "") -> dict[str, Any]:
    scenes = brief.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        raise ValueError("brief must contain a non-empty scenes list")
    candidates: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []
    for scene in scenes:
        scene_id = str(scene.get("scene_id", "")).strip()
        queries = scene.get("queries") or ([scene.get("query")] if scene.get("query") else [])
        if not scene_id or not queries:
            failures.append({"scene_id": scene_id, "provider": "brief", "error": "scene requires scene_id and query/queries"})
            continue
        for query in queries:
            query = str(query).strip()
            if not query:
                continue
            for provider, key, search in (("pexels", pexels_key, search_pexels), ("pixabay", pixabay_key, search_pixabay)):
                if not key:
                    continue
                for attempt in range(2):
                    try:
                        found = search(query, key)
                        for candidate in found:
                            candidate["scene_id"] = scene_id
                        candidates.extend(found)
                        break
                    except (HTTPError, URLError, TimeoutError, RuntimeError, ValueError) as exc:
                        if attempt == 1:
                            # Exception text is intentionally omitted: URLs may contain a provider key.
                            failures.append({"scene_id": scene_id, "provider": provider,
                                             "query": query, "error": type(exc).__name__})
                        else:
                            time.sleep(1)
    enabled = [name for name, key in (("pexels", pexels_key), ("pixabay", pixabay_key)) if key]
    if not enabled:
        failures.append({"scene_id": "", "provider": "configuration", "error": "no provider API key configured"})
    return {
        "schema_version": 1,
        "topic": str(brief.get("topic", "")),
        "discovered_at": datetime.now(timezone.utc).isoformat(),
        "enabled_providers": enabled,
        "candidates": candidates,
        "failures": failures,
        "notice": "Candidates are unreviewed. Check each source page, license, and relevant third-party rights before download or use.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--brief", required=True, type=Path, help="JSON with topic and scenes [{scene_id, queries}]")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        brief = json.loads(args.brief.read_text(encoding="utf-8"))
        result = discover(brief, os.environ.get("PEXELS_API_KEY", ""), os.environ.get("PIXABAY_API_KEY", ""))
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(json.dumps({"candidates": len(result["candidates"]), "failures": len(result["failures"]),
                          "providers": result["enabled_providers"], "output": str(args.output)}))
        return 0 if result["candidates"] else 2
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"Discovery failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
