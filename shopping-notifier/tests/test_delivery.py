import copy
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from delivery import deliver, format_digest, send_telegram, utf16_length
from state import FileState, GitHubState, RunLock, StateError
from sources import SourceResult
from test_deals import CONFIG, NOW, deal
from helpers import temporary_directory


class MemoryState:
    def __init__(self): self.saved = []; self.prepared = False
    def prepare(self): self.prepared = True
    def save(self, data): self.saved.append(copy.deepcopy(data))


class DeliveryTests(unittest.TestCase):
    def test_mobile_digest_has_exact_details_and_split_product_blocks(self):
        from dataclasses import replace
        deals = [replace(deal(id=n + 1), name="Coat 😀" * 15, shipping="Unknown; confirm at checkout") for n in range(10)]
        chunks = format_digest(deals, [SourceResult("Shop")], NOW, test=True)
        self.assertGreater(len(chunks), 1)
        combined = "\n".join(c.text for c in chunks)
        for text in ["TEST DIGEST", "Blue / M", "New (retail listing)", "JPY 10,000", "JPY 5,000",
                     "MSRP", "50.00%", "Unknown", "JST", "not usual market", "variant="]:
            self.assertIn(text, combined)
        self.assertTrue(all(utf16_length(c.text) <= 3800 for c in chunks))
        self.assertEqual(sum(len(c.deals) for c in chunks), 10)

    def test_empty_failed_and_suppressed_scans_are_distinct(self):
        normal = format_digest([], [SourceResult("Shop")], NOW)[0].text
        self.assertIn("No verified qualifying deals today", normal)
        failed = format_digest([], [SourceResult("Shop", status="failed", errors=["HTTP 403"])], NOW)[0].text
        self.assertIn("Coverage incomplete", failed)
        self.assertIn("scan failed", failed)
        self.assertNotIn("No verified qualifying deals today", failed)
        suppressed = format_digest([], [SourceResult("Shop")], NOW, suppressed=3)[0].text
        self.assertIn("3 unchanged", suppressed)

    def test_failed_later_chunk_records_only_acknowledged_deals(self):
        from delivery import Chunk
        first, second = deal(id=1), deal(id=2)
        chunks = [Chunk("part one", [first]), Chunk("part two", [second])]
        history = {"version": 1, "sent": {}}
        state = MemoryState()
        calls = []
        def sender(text):
            calls.append(text)
            if len(calls) == 2: raise RuntimeError("send failed")
        with self.assertRaises(RuntimeError):
            deliver(chunks, history, state, sender, NOW)
        self.assertIn(first.key, state.saved[-1]["sent"])
        self.assertNotIn(second.key, state.saved[-1]["sent"])
        self.assertNotIn("last_digest", state.saved[-1])

    def test_first_delivery_failure_never_marks_sent(self):
        history = {"version": 1, "sent": {}}
        state = MemoryState()
        with self.assertRaises(RuntimeError):
            deliver(format_digest([deal()], [], NOW), history, state,
                    lambda _: (_ for _ in ()).throw(RuntimeError("failed")), NOW)
        self.assertFalse(history["sent"])
        self.assertFalse(state.saved)

    def test_test_digest_and_dry_run_never_write_sent_state(self):
        history = {"version": 1, "sent": {}}
        state = MemoryState()
        calls = []
        chunks = format_digest([deal()], [], NOW, test=True)
        deliver(chunks, history, state, calls.append, NOW, test=True)
        self.assertEqual(len(calls), len(chunks))
        self.assertFalse(state.saved)
        self.assertFalse(history["sent"])
        deliver(chunks, history, state, calls.append, NOW, dry_run=True)
        self.assertEqual(len(calls), len(chunks))
        self.assertFalse(state.prepared)

    def test_successful_delivery_marks_history_and_digest_date(self):
        history = {"version": 1, "sent": {}}
        state = MemoryState()
        deliver(format_digest([deal()], [], NOW), history, state, lambda _: None, NOW)
        self.assertEqual(state.saved[-1]["sent"][deal().key]["sale_price"], "5000")
        self.assertEqual(state.saved[-1]["last_digest"]["date"], "2026-10-03")

    def test_deduplication_timestamp_is_delivery_acknowledgement_time(self):
        from datetime import timedelta
        acknowledged_at = NOW + timedelta(minutes=5)
        history = {"version": 1, "sent": {}}
        state = MemoryState()
        deliver(format_digest([deal()], [], NOW), history, state, lambda _: None, NOW,
                clock=lambda: acknowledged_at)
        self.assertEqual(state.saved[-1]["sent"][deal().key]["sent_at"], acknowledged_at.isoformat(timespec="seconds"))

    def test_secret_errors_never_expose_tokens(self):
        import os
        from unittest.mock import patch
        from urllib.error import URLError
        with patch.dict(os.environ, {"TELEGRAM_BOT_TOKEN": "test-private-token", "TELEGRAM_CHAT_ID": "private-chat"}):
            with self.assertRaises(RuntimeError) as caught:
                send_telegram("test", opener=lambda *a, **k: (_ for _ in ()).throw(URLError("test-private-token")))
        self.assertNotIn("test-private-token", str(caught.exception))
        self.assertNotIn("private-chat", str(caught.exception))

    def test_telegram_explicit_rejection_not_treated_as_success(self):
        import os
        from unittest.mock import patch
        class Response:
            def __enter__(self): return self
            def __exit__(self, *a): pass
            def read(self, *a): return b'{"ok": false}'
        with patch.dict(os.environ, {"TELEGRAM_BOT_TOKEN": "test-token", "TELEGRAM_CHAT_ID": "test-chat"}):
            with self.assertRaises(RuntimeError):
                send_telegram("test", opener=lambda *a, **k: Response())

    def test_corrupt_history_fails_instead_of_resetting(self):
        with temporary_directory() as directory:
            path = Path(directory) / "state.json"
            store = FileState(path)
            self.assertEqual(store.load()["sent"], {})
            for body in ["broken", '{"version":1,"sent":[]}', '{"version":1,"sent":{"a":{"sale_price":"NaN","sent_at":"bad"}}}']:
                path.write_text(body)
                with self.assertRaises(StateError): store.load()

    def test_atomic_state_roundtrip_and_exclusive_lock(self):
        with temporary_directory() as directory:
            path = Path(directory) / "state.json"
            store = FileState(path)
            data = {"version": 1, "sent": {deal().key: {"sale_price": "5000", "sent_at": NOW.isoformat()}}}
            store.save(data)
            self.assertEqual(store.load(), data)
            self.assertFalse(path.with_suffix(".json.tmp").exists())
            with RunLock(Path(directory) / ".run.lock"):
                with self.assertRaises(StateError):
                    with RunLock(Path(directory) / ".run.lock"): pass
            self.assertFalse((Path(directory) / ".run.lock").exists())

    def test_github_state_missing_existing_file_is_a_blocker(self):
        class API:
            def request(self, path, **kwargs):
                if "git/ref/heads/" in path: return {"object": {"sha": "abc"}}
                raise StateError("GitHub HTTP 404")
        with temporary_directory() as directory:
            remote = GitHubState("owner/repo", FileState(Path(directory) / "state.json"), api=API())
            with self.assertRaises(StateError): remote.load()

    def test_github_state_initialization_and_acknowledged_history_use_only_dedicated_branch(self):
        import base64
        class API:
            def __init__(self): self.calls = []; self.exists = False; self.contents = None
            def request(self, path, method="GET", payload=None):
                self.calls.append((path, method, payload))
                if method == "POST": self.exists = True; return {"ref": payload["ref"]}
                if method == "PUT":
                    self.contents = json.loads(base64.b64decode(payload["content"]))
                    return {"content": {"sha": "saved-sha"}}
                if path == "owner/repo": return {"default_branch": "main"}
                if "git/ref/heads/shopping-notifier-state" in path and not self.exists:
                    raise StateError("GitHub HTTP 404")
                return {"object": {"sha": "main-sha"}}
        with temporary_directory() as directory:
            api = API()
            remote = GitHubState("owner/repo", FileState(Path(directory) / "backup.json"), api=api)
            history = remote.load()
            self.assertEqual(history["sent"], {})
            remote.prepare()
            self.assertFalse(api.contents["sent"])
            history["sent"][deal().key] = {"sale_price": "5000", "sent_at": NOW.isoformat()}
            remote.save(history)
            writes = [payload for _, method, payload in api.calls if method == "PUT"]
            self.assertTrue(all(p["branch"] == "shopping-notifier-state" for p in writes))
            self.assertEqual(writes[-1]["sha"], "saved-sha")
            self.assertEqual(remote.backup.load()["sent"], api.contents["sent"])


if __name__ == "__main__": unittest.main()
