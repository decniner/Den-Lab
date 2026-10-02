import unittest
import tempfile
from pathlib import Path
from unittest.mock import patch
from japan_facts import youtube
from japan_facts.core import Failure, Store, digest, manifest_hash

tempfile.tempdir=str(Path(__file__).resolve().parent.parent/'.test-tmp')
Path(tempfile.tempdir).mkdir(exist_ok=True)

class FakeAPI:
    def __init__(self):
        self.starts = 0; self.puts = 0; self.publishes = 0
        self.channel = "expected"; self.privacy = "private"; self.ambiguous = False
        self.probes = []; self.matches = []
    def check_channel(self, channel):
        if self.channel != channel: raise Failure("wrong channel")
    def start(self, metadata, size):
        self.starts += 1
        if self.ambiguous: raise TimeoutError()
        return "https://www.googleapis.com/upload/session"
    def probe(self, session, size):
        return self.probes.pop(0) if self.probes else (200, {}, self.video())
    def put(self, session, data, start, size):
        self.puts += 1
        if self.ambiguous: raise TimeoutError()
        return 200, {}, self.video()
    def video(self):
        return {"id": "real-id", "snippet": {"channelId": self.channel},
                "status": {"privacyStatus": self.privacy, "uploadStatus": "processed"}}
    def get_video(self, video_id): return self.video()
    def reconcile(self, marker): return self.matches
    def publish(self, video_id): self.publishes += 1; self.privacy = "public"; return self.video()

class UploadTests(unittest.TestCase):
    def test_educational_category_and_relevant_tags(self):
        captured=[]; original=self.api.start
        def start(metadata,size): captured.append(metadata); return original(metadata,size)
        self.api.start=start
        self.state['manifest'].update(categoryId='27',tags=['Japan Explained','Shinkansen'])
        self.upload()
        self.assertEqual(captured[0]['snippet']['categoryId'],'27')
        self.assertEqual(captured[0]['snippet']['tags'],['Japan Explained','Shinkansen'])
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.store = Store(Path(self.temp.name), "edition")
        self.store.path.mkdir(parents=True, exist_ok=True)
        self.video = self.store.path / "video.mp4"; self.video.write_bytes(b"rendered bytes")
        self.state = {"edition": "edition", "mode": "live", "stage": "validated",
                      "manifest": {"video_sha256": digest(self.video), "title": "News",
                                   "description": "Sources", "containsSyntheticMedia": True},
                      "video_path": str(self.video), "channel_id": "expected"}
        self.store.save(self.state); self.api = FakeAPI()
    def upload(self): return youtube.upload(self.store, self.state, self.api)
    def test_wrong_channel_protection(self):
        self.api.channel = "wrong"
        with self.assertRaises(Failure): self.upload()
        self.assertEqual(self.api.starts, 0)
    def test_duplicate_upload_returns_existing_checked_video(self):
        self.upload(); result = self.upload()
        self.assertEqual(self.api.starts, 1); self.assertEqual(result["id"], "real-id")
    def test_ambiguous_initiation_never_creates_second_session(self):
        self.api.ambiguous = True
        with self.assertRaises(Failure): self.upload()
        self.state = self.store.load()
        with self.assertRaises(Failure): self.upload()
        self.assertEqual(self.api.starts, 1)
    def test_ambiguous_chunk_is_reconciled(self):
        self.api.ambiguous = True
        self.state["upload"] = {"session": "https://www.googleapis.com/upload/session", "phase": "sending"}
        result = self.upload()
        self.assertEqual(result["id"], "real-id"); self.assertEqual(self.api.puts, 0)
    def test_expired_session_blocks_reupload(self):
        self.state["upload"] = {"session": "https://www.googleapis.com/upload/session", "phase": "sending"}
        self.api.probes = [(404, {}, {})]
        with self.assertRaises(Failure): self.upload()
        self.assertEqual(self.api.starts, 0)
    def test_fixture_and_modified_video_blocked(self):
        for mode in ["fixture", "live"]:
            self.state["mode"] = mode
            if mode == "live": self.video.write_bytes(b"changed")
            with self.assertRaises(Failure): self.upload()
    def test_public_gate_binds_exact_manifest(self):
        self.upload()
        with self.assertRaises(Failure): youtube.publish(self.store, self.state, self.api, "no")
        approval = youtube.approval_token(self.state)
        self.state["manifest"]["title"] = "Changed"
        with self.assertRaises(Failure): youtube.publish(self.store, self.state, self.api, approval)
        self.assertEqual(self.api.publishes, 0)
    def test_public_response_must_be_public(self):
        self.upload(); approval = youtube.approval_token(self.state)
        self.api.publish = lambda _: self.api.video()
        with self.assertRaises(Failure): youtube.publish(self.store, self.state, self.api, approval)
    def test_publish_approved_exact_edition(self):
        self.upload()
        result = youtube.publish(self.store, self.state, self.api, youtube.approval_token(self.state))
        self.assertEqual(result["status"]["privacyStatus"], "public")

    def test_malformed_completion_keeps_session(self):
        self.api.put = lambda *args: (200, {}, {})
        with self.assertRaises(Failure): self.upload()
        self.assertTrue(self.store.load()["upload"]["session"])
        self.assertEqual(self.api.starts, 1)

    def test_lost_final_chunk_response_recovers_video(self):
        self.api.put = lambda *args: (_ for _ in ()).throw(TimeoutError())
        with patch("japan_facts.youtube.time.sleep"):
            result = self.upload()
        self.assertEqual(result["id"], "real-id")
        self.assertEqual(self.api.starts, 1)

    def test_confirmed_id_persisted_before_failed_readback(self):
        self.api.get_video = lambda _: (_ for _ in ()).throw(Failure("read unavailable"))
        with self.assertRaises(Failure): self.upload()
        self.assertEqual(self.store.load()["upload"]["video_id"], "real-id")

    def test_chunk_failure_exhausts_budget(self):
        self.api.put = lambda *args: (_ for _ in ()).throw(TimeoutError())
        self.api.probe = lambda *args: (_ for _ in ()).throw(TimeoutError())
        with patch("japan_facts.youtube.time.sleep"):
            with self.assertRaises(Failure): self.upload()
        self.assertEqual(self.api.starts, 1)
        self.assertTrue(self.store.load()["upload"]["session"])

    def test_manifest_mutation_after_render_is_blocked(self):
        self.state["render_manifest_sha256"] = manifest_hash(self.state)
        self.state["manifest"]["description"] = "changed"
        with self.assertRaises(Failure): self.upload()

    def test_processing_failure_blocks_success(self):
        original = self.api.video
        def rejected():
            item = original(); item["status"]["uploadStatus"] = "rejected"; return item
        self.api.video = rejected
        with self.assertRaises(Failure): self.upload()

    def test_unchanged_probe_does_not_reset_retry_budget(self):
        puts = []
        def timeout(*args):
            puts.append(1)
            if len(puts) > 3: raise AssertionError("unbounded upload retries")
            raise TimeoutError()
        self.api.put = timeout
        self.api.probe = lambda *args: (308, {}, {})
        with patch("japan_facts.youtube.time.sleep"):
            with self.assertRaises(Failure): self.upload()
        self.assertLessEqual(len(puts), 3)

    def test_private_recovery_updates_stage(self):
        self.upload()
        self.state["stage"] = "validated"; self.state["upload"]["phase"] = "confirming"
        self.upload()
        self.assertEqual(self.store.load()["stage"], "uploaded")

    def test_private_recovery_rejects_public_readback(self):
        self.upload(); self.api.privacy = "public"
        self.state["upload"]["phase"] = "confirming"
        with self.assertRaises(Failure): self.upload()

if __name__ == "__main__": unittest.main()
