"""YouTube REST adapter and crash-recoverable upload orchestration.

No videos.insert call is retried. Only persisted resumable sessions are resumed.
"""
import hashlib
import json
import os
import re
import time
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, build_opener, HTTPRedirectHandler

from .core import Failure, canonical, check_artifacts, manifest_hash

BASE = "https://www.googleapis.com/youtube/v3/"
SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl"]
CHUNK = 1024 * 1024

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def approval_token(state):
    if not state.get("upload", {}).get("video_id"): raise Failure("Private upload must be confirmed before approving publishing.")
    value = {"manifest": manifest_hash(state), "video_id": state["upload"]["video_id"],
             "channel_id": state["channel_id"], "edition": state["edition"]}
    return hashlib.sha256(canonical(value)).hexdigest()

def checked_video(api, state, item, visibility=None):
    try:
        video_id = item["id"]
        if not isinstance(video_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", video_id): raise ValueError()
        if item["snippet"]["channelId"] != state["channel_id"]: raise Failure("Returned video belongs to the wrong channel.")
        if state.get("upload", {}).get("video_id") not in (None, video_id): raise Failure("API returned a different video ID.")
        privacy = item["status"]["privacyStatus"]
        if privacy not in ("private", "public", "unlisted"): raise ValueError()
        if item["status"].get("uploadStatus") in ("failed", "rejected", "deleted"):
            raise Failure("YouTube rejected or failed processing this video.")
        if visibility and privacy != visibility:
            raise Failure(f"API returned visibility {privacy}; expected {visibility}. No success recorded.")
        return item
    except (KeyError, TypeError, ValueError) as exc:
        raise Failure("Malformed API video response; no upload or publishing success recorded.") from exc

def record(store, state, api, item):
    # Persist returned ID before readback: a failed GET must not permit reupload.
    checked_video(api, state, item)
    state["upload"]["video_id"] = item["id"]
    state["upload"]["phase"] = "confirming"; store.save(state)
    item = checked_video(api, state, api.get_video(item["id"]), "private")
    state["upload"].update(phase="complete", response=item)
    state["stage"] = "uploaded"; store.save(state)
    return item

def reconcile(store, state, api):
    marker = state["upload"].get("marker")
    if not marker: raise Failure("Upload recovery marker missing; restore state or reconcile manually. New upload blocked.")
    matches = api.reconcile(marker)
    if len(matches) == 1: return record(store, state, api, matches[0])
    if len(matches) > 1: raise Failure("Multiple uploads match this edition; inspect the channel manually.")
    raise Failure("Ambiguous upload unresolved. No new upload allowed; inspect channel and retry reconciliation later.")

def upload(store, state, api):
    check_artifacts(state)
    api.check_channel(state["channel_id"])
    existing = state.get("upload", {})
    if existing.get("video_id"):
        item = checked_video(api, state, api.get_video(existing["video_id"]), "private")
        existing.update(phase="complete", response=item); state["stage"] = "uploaded"; store.save(state)
        return item
    if existing.get("phase") in ("initiating", "ambiguous", "expired") and not existing.get("session"):
        return reconcile(store, state, api)
    size = Path(state["video_path"]).stat().st_size
    if not size: raise Failure("Rendered video is empty.")
    marker = "edition-sha256:" + manifest_hash(state)
    if not existing.get("session"):
        state["upload"] = {"phase": "initiating", "marker": marker, "offset": 0}
        store.save(state)  # Crash after this point is ambiguous, never auto-initiate again.
        metadata = {"snippet": {"title": state["manifest"]["title"],
                                "description": state["manifest"]["description"] + "\n" + marker,
                                "categoryId": state["manifest"].get("categoryId", "27"),
                                "tags": state["manifest"].get("tags", ["Japan Explained", "Japan", "Shorts"])},
                    "status": {"privacyStatus": "private", "selfDeclaredMadeForKids": False,
                               "containsSyntheticMedia": state["manifest"]["containsSyntheticMedia"]}}
        try: session = api.start(metadata, size)
        except Exception as exc:
            state["upload"]["phase"] = "ambiguous"; store.save(state)
            raise Failure("Upload initiation was not confirmed. Reconcile before any new upload.") from exc
        state["upload"].update(session=session, phase="sending"); store.save(state)
        offset = 0
    else:
        offset = None  # Always query remote state on restart, even after a local checkpoint.
    failures = 0
    confirmed_offset = state["upload"].get("offset", 0)
    with Path(state["video_path"]).open("rb") as stream:
        while True:
            try:
                if offset is None:
                    code, headers, body = api.probe(state["upload"]["session"], size)
                else:
                    stream.seek(offset); data = stream.read(CHUNK)
                    if not data:
                        code, headers, body = api.probe(state["upload"]["session"], size)
                    else:
                        code, headers, body = api.put(state["upload"]["session"], data, offset, size)
                if code in (200, 201): return record(store, state, api, body)
                if code in (404, 410):
                    state["upload"].update(phase="expired")
                    state["upload"].pop("session", None); store.save(state)
                    return reconcile(store, state, api)
                if code == 308:
                    match = re.fullmatch(r"bytes=0-(\d+)", headers.get("Range", ""))
                    next_offset = int(match[1]) + 1 if match else 0
                    if next_offset > size or next_offset < confirmed_offset: raise Failure("Server returned invalid upload offset.")
                    if offset is not None and next_offset <= offset:
                        failures += 1
                        if failures >= 3: raise Failure("Upload made no progress after 3 attempts.")
                    if next_offset > confirmed_offset:
                        failures = 0
                        confirmed_offset = next_offset
                    offset = next_offset
                    state["upload"]["offset"] = offset; store.save(state)
                    continue
                if code not in (408, 429, 500, 502, 503, 504):
                    raise Failure(f"Upload rejected by API (HTTP {code}); resume only after resolving the error.")
                raise TimeoutError()
            except Failure: raise
            except (OSError, TimeoutError, ValueError) as exc:
                failures += 1
                state["upload"]["phase"] = "sending"; store.save(state)
                if failures >= 3:
                    raise Failure("Upload retry budget exhausted. Session retained; rerun to reconcile remote progress.") from exc
                time.sleep(2 ** (failures - 1)); offset = None

def publish(store, state, api, approval):
    from .research import read
    provenance=store.path/'speech-provider.json'
    if provenance.exists() and read(provenance).get('publication_scope')=='private-review-only':
        raise Failure('This edition is restricted to private review; public publishing requires verified provider rights and a new approved edition.')
    check_artifacts(state)
    if approval != approval_token(state): raise Failure("Approval does not match this exact rendered edition, video ID and channel.")
    api.check_channel(state["channel_id"])
    video_id = state["upload"]["video_id"]
    current = checked_video(api, state, api.get_video(video_id))
    if current["status"]["privacyStatus"] == "public":
        state["stage"] = "published"; state["upload"]["response"] = current; store.save(state)
        return current
    if current["status"]["privacyStatus"] != "private": raise Failure("Public publishing requires a confirmed private video.")
    if current["status"].get("uploadStatus") != "processed": raise Failure("Wait for YouTube processing before publishing.")
    state["publishing"] = {"approval": approval, "phase": "requested"}; store.save(state)
    try: returned = api.publish(video_id)
    except Exception as exc:
        # Do not repeat a side effect until readback resolves it.
        returned = api.get_video(video_id)
        if returned.get("status", {}).get("privacyStatus") != "public":
            raise Failure("Publishing response ambiguous; readback is not public. Retry this same approved command later.") from exc
    checked_video(api, state, returned, "public")
    current = checked_video(api, state, api.get_video(video_id), "public")
    state["stage"] = "published"; state["publishing"]["phase"] = "complete"
    state["upload"]["response"] = current; store.save(state)
    return current

class API:
    def __init__(self, token_path="token.json"):
        try:
            from google.oauth2.credentials import Credentials
            from google.auth.transport.requests import Request as AuthRequest
        except ImportError as exc: raise Failure("Install requirements-oauth.txt before live YouTube operations.") from exc
        try:
            self.credentials = Credentials.from_authorized_user_file(token_path, SCOPES)
            if not self.credentials.valid:
                self.credentials.refresh(AuthRequest())
                Path(token_path).write_text(self.credentials.to_json(), encoding="utf-8")
        except Exception as exc: raise Failure("OAuth token missing, expired or invalid; run the documented OAuth setup.") from exc
    def raw(self, method, url, data=None, headers=None):
        parsed = urlparse(url)
        if parsed.scheme != "https" or parsed.hostname not in ("www.googleapis.com", "youtube.googleapis.com"):
            raise Failure("Unexpected upload-session host; refusing to send credentials.")
        headers = {"Authorization": "Bearer " + self.credentials.token, **(headers or {})}
        request = Request(url, data=data, headers=headers, method=method)
        try:
            with build_opener(NoRedirect).open(request, timeout=30) as response:
                code = response.status; response_headers = dict(response.headers); raw = response.read(2_000_000)
        except HTTPError as exc:
            code = exc.code; response_headers = dict(exc.headers); raw = exc.read(2_000_000)
        body = json.loads(raw) if raw else {}
        return code, response_headers, body
    def get(self, endpoint, **query):
        for attempt in range(3):
            try:
                code, _, body = self.raw("GET", BASE + endpoint + "?" + urlencode(query))
                if code == 200: return body
                if code not in (408, 429, 500, 502, 503, 504): raise Failure(f"YouTube read failed (HTTP {code}). Check scopes, quota and channel.")
            except (OSError, ValueError):
                if attempt == 2: raise Failure("YouTube read failed after 3 attempts.")
            if attempt < 2: time.sleep(2 ** attempt)
        raise Failure("YouTube read retry budget exhausted.")
    def check_channel(self, channel):
        items = self.get("channels", part="id,contentDetails", mine="true").get("items", [])
        if len(items) != 1 or items[0].get("id") != channel:
            raise Failure("OAuth channel differs from configured channel_id; refusing upload/publishing.")
    def start(self, metadata, size):
        code, headers, _ = self.raw("POST", "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
            canonical(metadata), {"Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Length": str(size), "X-Upload-Content-Type": "video/mp4"})
        location = headers.get("Location")
        if code not in (200, 201) or not location: raise Failure("API did not return a resumable session.")
        parsed = urlparse(location)
        if parsed.scheme != "https" or parsed.hostname not in ("www.googleapis.com", "youtube.googleapis.com"):
            raise Failure("API returned an unexpected session host.")
        return location
    def probe(self, session, size):
        return self.raw("PUT", session, b"", {"Content-Length": "0", "Content-Range": f"bytes */{size}"})
    def put(self, session, data, start, size):
        return self.raw("PUT", session, data, {"Content-Type": "video/mp4", "Content-Length": str(len(data)),
                        "Content-Range": f"bytes {start}-{start + len(data) - 1}/{size}"})
    def get_video(self, video_id):
        items = self.get("videos", part="snippet,status", id=video_id).get("items", [])
        if len(items) != 1: raise Failure("Uploaded video is not visible to this OAuth account; no success confirmed.")
        return items[0]
    def reconcile(self, marker):
        channels = self.get("channels", part="contentDetails", mine="true").get("items", [])
        if len(channels) != 1: raise Failure("Cannot reconcile without exactly one channel.")
        playlist = channels[0]["contentDetails"]["relatedPlaylists"]["uploads"]
        matches = []; page = None
        # Bound reconciliation to 500 recent uploads. No match never authorizes a fresh upload.
        for _ in range(10):
            query = {"part": "contentDetails", "playlistId": playlist, "maxResults": 50}
            if page: query["pageToken"] = page
            result = self.get("playlistItems", **query)
            ids = [i["contentDetails"]["videoId"] for i in result.get("items", [])]
            if ids:
                videos = self.get("videos", part="snippet,status", id=",".join(ids)).get("items", [])
                matches.extend(v for v in videos if marker in v.get("snippet", {}).get("description", "").splitlines())
            page = result.get("nextPageToken")
            if not page: break
        return matches
    def publish(self, video_id):
        # GET first to preserve writable status values; omitted properties can be reset by update.
        current = self.get_video(video_id)["status"]
        writable = ("license", "embeddable", "publicStatsViewable", "selfDeclaredMadeForKids", "containsSyntheticMedia")
        status = {key: current[key] for key in writable if key in current}
        status["privacyStatus"] = "public"
        code, _, body = self.raw("PUT", BASE + "videos?part=status", canonical({"id": video_id, "status": status}),
                                  {"Content-Type": "application/json"})
        if code != 200: raise Failure(f"Public update returned HTTP {code}; project audit may be required.")
        # videos.update(part=status) does not return snippet, so read it for the ownership check.
        if body.get("id") != video_id or body.get("status", {}).get("privacyStatus") != "public":
            raise Failure("Public update response did not confirm the video ID and public visibility.")
        return self.get_video(video_id)

def oauth(client_secrets, token_path):
    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError as exc: raise Failure("Install requirements-oauth.txt first.") from exc
    flow = InstalledAppFlow.from_client_secrets_file(client_secrets, SCOPES)
    credentials = flow.run_local_server(port=0, timeout_seconds=180)
    Path(token_path).write_text(credentials.to_json(), encoding="utf-8")
