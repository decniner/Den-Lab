import contextlib
import datetime as dt
import hashlib
import json
import os
import re
from pathlib import Path

LOG_PATH = None

def set_log_path(path):
    global LOG_PATH
    LOG_PATH = path

class Failure(Exception):
    """An actionable pipeline failure; no success may be inferred."""

def now():
    return dt.datetime.now(dt.timezone.utc)

def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()

def digest(path):
    result = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""): result.update(chunk)
    return result.hexdigest()

def manifest_hash(state):
    return hashlib.sha256(canonical(state["manifest"])).hexdigest()

def log(event, **fields):
    line = json.dumps({"time": now().isoformat(), "event": event, **fields}, ensure_ascii=False)
    print(line)
    if LOG_PATH:
        with Path(LOG_PATH).open("a", encoding="utf-8") as stream:
            stream.write(line + "\n")

class Store:
    def __init__(self, root, edition):
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,79}", edition):
            raise Failure("Edition ID must contain 1–80 letters, digits, underscores or hyphens.")
        self.path = Path(root).resolve() / edition
        self.edition = edition
    def load(self):
        try:
            return json.loads((self.path / "edition.json").read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            raise Failure("Edition state missing or corrupt; restore its backup, never guess upload state.") from exc
    def save(self, state):
        self.path.mkdir(parents=True, exist_ok=True)
        temp = self.path / "edition.json.tmp"
        with temp.open("w", encoding="utf-8") as stream:
            json.dump(state, stream, ensure_ascii=False, indent=2)
            stream.flush(); os.fsync(stream.fileno())
        os.replace(temp, self.path / "edition.json")
    @contextlib.contextmanager
    def lock(self):
        self.path.mkdir(parents=True, exist_ok=True)
        lock = self.path / ".lock"
        try: fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError as exc:
            raise Failure("Edition is locked; if its process crashed, verify no process is active before removing .lock.") from exc
        try:
            os.write(fd, str(os.getpid()).encode()); os.close(fd)
            yield
        finally: lock.unlink(missing_ok=True)

def require_content(state):
    if state.get("stage") == "failed": raise Failure("Edition failed content checks; create a corrected new edition.")

def check_artifacts(state):
    require_content(state)
    if state.get("mode") != "live": raise Failure("Fixture editions cannot be uploaded or published.")
    if state.get("stage") not in ("validated", "uploaded", "published"):
        raise Failure("Video must pass validation before upload.")
    if digest(state["video_path"]) != state["manifest"]["video_sha256"]:
        raise Failure("Rendered video changed; create and approve a new edition.")
    for path, expected in state["manifest"].get("artifacts", {}).items():
        if digest(path) != expected: raise Failure("Edition artifact changed; create a new edition.")
    recorded = state.get("render_manifest_sha256")
    if recorded and recorded != manifest_hash(state):
        raise Failure("Rendered edition metadata changed; create a new edition.")
