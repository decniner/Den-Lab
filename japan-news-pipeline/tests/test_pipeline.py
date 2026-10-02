import copy
import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from news_pipeline import evidence, media, youtube
from news_pipeline.core import Failure, Store, digest, manifest_hash
from news_pipeline.__main__ import main

NOW = dt.datetime(2026, 10, 2, tzinfo=dt.timezone.utc)

def stories():
    return [{"id": "s1", "title": "Fixture observatory update", "published_at": NOW.isoformat(),
             "sources": [{"url": "https://example.org/a", "text": "The observatory opened on Thursday."}],
             "claims": [{"text": "The observatory opened on Thursday.", "source": 0}]}]

class EvidenceTests(unittest.TestCase):
    def test_fresh_evidence(self):
        self.assertEqual(len(evidence.verify(stories(), NOW)), 1)

    def test_stale_and_future_news(self):
        for date in [NOW - dt.timedelta(days=4), NOW + dt.timedelta(days=1)]:
            data = stories(); data[0]["published_at"] = date.isoformat()
            with self.assertRaises(Failure): evidence.verify(data, NOW)

    def test_duplicate_id_title_and_claim(self):
        for key in ["id", "title", "claims"]:
            data = stories(); other = copy.deepcopy(data[0]); other["id"] = "s2"
            other["title"] = "Another story"; other["claims"][0]["text"] = "Other fact."
            other["sources"][0]["text"] += " Other fact."
            other[key] = copy.deepcopy(data[0][key]); data.append(other)
            with self.assertRaises(Failure): evidence.verify(data, NOW)

    def test_missing_source_and_unsupported_claim(self):
        for change in [lambda x: x[0].update(sources=[]),
                       lambda x: x[0]["claims"][0].update(text="Invented claim.")]:
            data = stories(); change(data)
            with self.assertRaises(Failure): evidence.verify(data, NOW)

    def test_model_output_cannot_add_claims(self):
        for output in [{}, {"segments": [{"text": "Invented claim.", "story_id": "s1", "source": 0}]}]:
            with self.assertRaises(Failure): evidence.validate_script(output, stories())

    def test_provider_failure_has_bounded_retries(self):
        calls = []
        def bad(*args, **kwargs): calls.append(1); raise TimeoutError()
        with patch("news_pipeline.evidence.urlopen", bad), patch("news_pipeline.evidence.time.sleep"):
            with self.assertRaises(Failure): evidence.fetch_text("https://example.org/a")
        self.assertEqual(len(calls), 3)

    def test_fixture_cannot_be_relabelled_live(self):
        data = {"fixture_only": True, "stories": stories(), "reviewed_by": "human", "reviewed_at": NOW.isoformat()}
        with patch("news_pipeline.evidence.fetch_text", return_value=stories()[0]["sources"][0]["text"]) as fetch:
            with self.assertRaises(Failure): evidence.fetch_and_verify(data, NOW, ["example.org"])
            fetch.assert_not_called()

    def test_malformed_review_timestamp(self):
        data = {"stories": stories(), "reviewed_by": "human", "reviewed_at": "invalid"}
        with patch("news_pipeline.evidence.fetch_text", return_value=stories()[0]["sources"][0]["text"]) as fetch:
            with self.assertRaises(Failure): evidence.fetch_and_verify(data, NOW, ["example.org"])
            fetch.assert_not_called()

class MediaTests(unittest.TestCase):
    def test_caption_timing(self):
        for captions in [[{"start": 2, "end": 1, "text": "x"}],
                         [{"start": 0, "end": 8, "text": "x"}],
                         [{"start": 0, "end": 2, "text": "x"}, {"start": 1, "end": 3, "text": "y"}]]:
            with self.assertRaises(Failure): media.validate_captions(captions, 5)

    def test_render_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch("news_pipeline.media.subprocess.run", side_effect=TimeoutError()):
                with self.assertRaises(Failure): media.run(["ffmpeg"], 1)

    def test_actual_render_timeout_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            captions = Path(directory) / "timing.json"
            captions.write_text(json.dumps([{"start": 0, "end": 5, "text": "Verified source sentence."}]))
            with patch("news_pipeline.media.shutil.which", return_value="tool"), \
                 patch("news_pipeline.media.probe", return_value={"format": {"duration": "5"}, "streams": [{"codec_type": "audio"}]}), \
                 patch("news_pipeline.media.subprocess.run", side_effect=__import__('subprocess').TimeoutExpired("ffmpeg", 600)):
                with self.assertRaises(Failure):
                    media.render(directory, {"segments": [{"text": "Verified source sentence."}]}, "audio.wav", captions)

class CLITests(unittest.TestCase):
    def test_offline_dry_run_never_calls_network_or_renderer(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch("news_pipeline.evidence.urlopen", side_effect=AssertionError("network used")), \
                 patch("news_pipeline.media.render", side_effect=AssertionError("renderer used")), \
                 patch("news_pipeline.youtube.API", side_effect=AssertionError("YouTube used")):
                self.assertEqual(main(["--state-root", directory, "dry-run", "--edition", "offline"]), 0)
            report = json.loads((Path(directory) / "offline" / "dry-run-report.json").read_text())
            self.assertIsNone(report["video_id"])
            self.assertIn("skipped", report["render"])
            self.assertEqual(main(["--state-root", directory, "dry-run", "--edition", "offline"]), 1)

    def test_factual_failure_persists_failed_edition(self):
        with tempfile.TemporaryDirectory() as directory:
            config = Path(directory) / "config.json"; config.write_text('{}')
            invalid = Path(directory) / "news.json"; invalid.write_text('{"stories": []}')
            self.assertEqual(main(["--state-root", directory, "--config", str(config), "fetch-news", "--edition", "bad", "--input", str(invalid)]), 1)
            self.assertEqual(Store(directory, "bad").load()["stage"], "failed")

    def test_invalid_transition_preserves_edition(self):
        with tempfile.TemporaryDirectory() as directory:
            config = Path(directory) / "config.json"; config.write_text('{}')
            store = Store(directory, "complete"); store.save({"edition": "complete", "mode": "live", "stage": "uploaded"})
            result = main(["--state-root", directory, "--config", str(config), "generate-script", "--edition", "complete"])
            self.assertEqual(result, 1)
            self.assertEqual(store.load()["stage"], "uploaded")

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
        with patch("news_pipeline.youtube.time.sleep"):
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
        with patch("news_pipeline.youtube.time.sleep"):
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
        with patch("news_pipeline.youtube.time.sleep"):
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
