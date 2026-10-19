#!/usr/bin/env python3
"""Download one explicitly reviewed candidate from an official provider CDN."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ALLOWED_HOSTS = {
    "pexels": ("videos.pexels.com", "videos.pexels-cdn.com"),
    "pixabay": ("cdn.pixabay.com",),
}
MAX_BYTES = 1_000_000_000


def allowed_url(provider: str, url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname:
        return False
    return any(parsed.hostname == host or parsed.hostname.endswith("." + host)
               for host in ALLOWED_HOSTS.get(provider, ()))


def approved(candidate: dict) -> bool:
    review = candidate.get("license_review") or {}
    return (
        review.get("status") == "approved"
        and review.get("commercial_use_confirmed") is True
        and review.get("third_party_rights") == "clear"
        and bool(review.get("reviewer"))
        and bool(review.get("reviewed_at"))
        and review.get("restrictions_checked") is True
        and bool(review.get("license_evidence_url"))
        and bool(review.get("release_review"))
    )


def download(candidate: dict, output: Path) -> dict:
    provider = candidate.get("provider", "")
    url = candidate.get("download_url", "")
    if not approved(candidate):
        raise ValueError("candidate must have a complete human-approved license and third-party-rights review")
    if not allowed_url(provider, url):
        raise ValueError("download URL host is not an approved provider media host")
    output = output.resolve()
    if output.exists():
        raise FileExistsError(f"refusing to overwrite existing asset: {output}")
    output.parent.mkdir(parents=True, exist_ok=True)
    request = Request(url, headers={"User-Agent": "stock-footage-documentary/1.0"})
    temp_name = None
    digest = hashlib.sha256()
    total = 0
    try:
        with urlopen(request, timeout=45) as response:
            if not allowed_url(provider, response.geturl()):
                raise ValueError("provider redirected to a non-approved host")
            content_length = response.headers.get("Content-Length")
            if content_length and int(content_length) > MAX_BYTES:
                raise ValueError("asset exceeds the 1 GB download limit")
            with tempfile.NamedTemporaryFile(prefix=".stock-", suffix=".part", dir=output.parent, delete=False) as target:
                temp_name = target.name
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    total += len(chunk)
                    if total > MAX_BYTES:
                        raise ValueError("asset exceeded the 1 GB download limit")
                    digest.update(chunk)
                    target.write(chunk)
        if total == 0:
            raise ValueError("provider returned an empty file")
        os.replace(temp_name, output)
        temp_name = None
        return {"path": str(output), "bytes": total, "sha256": digest.hexdigest()}
    finally:
        if temp_name and os.path.exists(temp_name):
            os.unlink(temp_name)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidates", required=True, type=Path)
    parser.add_argument("--provider", required=True, choices=sorted(ALLOWED_HOSTS))
    parser.add_argument("--asset-id", required=True)
    parser.add_argument("--scene-id", required=True)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        data = json.loads(args.candidates.read_text(encoding="utf-8"))
        matches = [item for item in data.get("candidates", [])
                   if item.get("provider") == args.provider and str(item.get("asset_id")) == args.asset_id
                   and item.get("scene_id") == args.scene_id]
        if len(matches) != 1:
            raise ValueError(f"expected one matching candidate, found {len(matches)}")
        result = download(matches[0], args.output)
        print(json.dumps(result, indent=2))
        return 0
    except (OSError, HTTPError, URLError, ValueError, json.JSONDecodeError) as exc:
        print(f"Download failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
