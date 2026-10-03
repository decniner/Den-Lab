"""Isolated history, atomic local backup, and dedicated GitHub state branch."""
from __future__ import annotations

import base64
import json
import os
import re
import time
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from deals import yen

STATE_BRANCH = "shopping-notifier-state"
REMOTE_PATH = "shopping-notifier/state.json"


class StateError(RuntimeError):
    pass


def validated(data):
    if not isinstance(data, dict) or data.get("version") != 1 or not isinstance(data.get("sent"), dict):
        raise StateError("Invalid shopping history schema; refusing to reset deduplication")
    try:
        for key, entry in data["sent"].items():
            if not isinstance(key, str) or not isinstance(entry, dict):
                raise ValueError()
            yen(entry["sale_price"])
            if datetime.fromisoformat(entry["sent_at"]).tzinfo is None:
                raise ValueError()
        if "last_digest" in data:
            if not isinstance(data["last_digest"], dict):
                raise ValueError()
            datetime.fromisoformat(data["last_digest"]["date"])
    except (ValueError, TypeError, KeyError):
        raise StateError("Invalid shopping history entries; restore the backup before sending") from None
    return data


class FileState:
    def __init__(self, path):
        self.path = Path(path)

    def load(self):
        try:
            return validated(json.loads(self.path.read_text(encoding="utf-8")))
        except FileNotFoundError:
            return {"version": 1, "sent": {}}
        except (OSError, ValueError):
            raise StateError("Cannot read shopping history; refusing to reset deduplication") from None

    def prepare(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        # Permission check before Telegram. Existing sent entries are preserved.
        self.save(self.load())

    def save(self, data):
        validated(data)
        temporary = self.path.with_suffix(self.path.suffix + ".tmp")
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with temporary.open("w", encoding="utf-8", newline="\n") as stream:
                stream.write(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
                stream.flush()
                os.fsync(stream.fileno())
            os.replace(temporary, self.path)
        except OSError:
            raise StateError("Cannot save shopping history; inspect local backup before retrying") from None


class RunLock:
    def __init__(self, path): self.path = Path(path)

    def __enter__(self):
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self.fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            os.write(self.fd, str(os.getpid()).encode())
        except FileExistsError:
            raise StateError("Another shopping run holds .run.lock; check for a running/stale process") from None
        return self

    def __exit__(self, *args):
        os.close(self.fd)
        self.path.unlink()


class GitHubAPI:
    def __init__(self):
        self.token = os.environ.get("GITHUB_TOKEN", "").strip()
        if not self.token:
            raise StateError("GITHUB_TOKEN unavailable for shopping state persistence")

    def request(self, path, *, method="GET", payload=None):
        request = Request("https://api.github.com/repos/" + path, method=method,
                          data=json.dumps(payload).encode() if payload is not None else None,
                          headers={"Authorization": "Bearer " + self.token, "Accept": "application/vnd.github+json",
                                   "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json",
                                   "User-Agent": "DenLabShoppingNotifier/1.0"})
        for attempt in range(3 if method == "GET" else 1):
            try:
                with urlopen(request, timeout=20) as response:
                    return json.loads(response.read(4 * 1024 * 1024))
            except HTTPError as exc:
                status = exc.code
                exc.close()
                if method == "GET" and status in (429, 500, 502, 503, 504) and attempt < 2:
                    time.sleep(2 ** attempt)
                    continue
                raise StateError(f"GitHub HTTP {status}") from None
            except (URLError, OSError, ValueError) as exc:
                if method == "GET" and attempt < 2:
                    time.sleep(2 ** attempt)
                    continue
                raise StateError(f"GitHub state request unconfirmed ({type(exc).__name__}); retain local backup") from None


class GitHubState:
    def __init__(self, repository, backup: FileState, *, api=None):
        if not re.fullmatch(r"[\w.-]+/[\w.-]+", repository):
            raise StateError("Invalid GITHUB_REPOSITORY")
        self.repository, self.backup = repository, backup
        self.api = api or GitHubAPI()
        self.sha, self.branch_exists = None, False
        self.loaded = None

    def load(self):
        try:
            self.api.request(f"{self.repository}/git/ref/heads/{STATE_BRANCH}")
        except StateError as exc:
            if str(exc) != "GitHub HTTP 404":
                raise
            self.loaded = {"version": 1, "sent": {}}
            return self.loaded
        self.branch_exists = True
        content = self.api.request(f"{self.repository}/contents/{REMOTE_PATH}?ref={STATE_BRANCH}")
        try:
            self.loaded = validated(json.loads(base64.b64decode(content["content"], validate=False)))
            self.sha = content["sha"]
        except (ValueError, KeyError, TypeError):
            raise StateError("Invalid remote shopping history; refusing to reset deduplication") from None
        return self.loaded

    def prepare(self):
        if self.loaded is None:
            raise StateError("Shopping state must be loaded before delivery")
        if not self.branch_exists:
            repo = self.api.request(self.repository)
            default = quote(repo["default_branch"], safe="")
            ref = self.api.request(f"{self.repository}/git/ref/heads/{default}")
            self.api.request(f"{self.repository}/git/refs", method="POST",
                             payload={"ref": f"refs/heads/{STATE_BRANCH}", "sha": ref["object"]["sha"]})
            self.branch_exists = True
        # Write identical history as a permissions preflight, never mark unsent deals.
        self.save(self.loaded)

    def save(self, data):
        self.backup.save(data)
        payload = {"message": "Persist Japan shopping notification history", "branch": STATE_BRANCH,
                   "content": base64.b64encode((json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode()).decode()}
        if self.sha:
            payload["sha"] = self.sha
        result = self.api.request(f"{self.repository}/contents/{REMOTE_PATH}", method="PUT", payload=payload)
        try:
            self.sha = result["content"]["sha"]
            self.loaded = data
        except (KeyError, TypeError):
            raise StateError("Shopping history write not acknowledged; retain local backup") from None
