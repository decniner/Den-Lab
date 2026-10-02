import copy
import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from news_pipeline import rendered, morning
from news_pipeline.core import Failure, Store, digest
from test_pipeline import FakeAPI

NOW = dt.datetime(2026,10,2,14,30,tzinfo=dt.timezone.utc)

def bundle(root):
    target = Path(root) / "bundle"; target.mkdir()
    video = target / "japan-news-80s-tiktok.mp4"; video.write_bytes(b"verified portrait video")
    script = {"edition":"japan-news-20261002-en", "mode":"live-news", "segments":[{"story":"news","source":"s1","text":"Source backed claim."}]}
    sources = {"fixture":False,"sources":[{"id":"s1","url":"https://example.org/news", "published_at":NOW.isoformat()}]}
    (target/"script.json").write_text(json.dumps(script))
    (target/"sources.json").write_text(json.dumps(sources))
    (target/"captions.json").write_text(json.dumps([{"start":0,"end":3,"text":"Source backed claim."}]))
    report={"edition":script["edition"],"mode":"live-news","fixture":False,"duration_seconds":80.0,
            "width":1080,"height":1920,"decode_validation":"passed","video_sha256":digest(video),
            "script_sha256":digest(target/"script.json"),"sources_sha256":digest(target/"sources.json")}
    (target/"validation.json").write_text(json.dumps(report))
    return target

class RenderedTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name); self.target=bundle(self.root)
        self.store=Store(self.root/"state","japan-news-20261002-en")
    def prepare(self):
        with patch("news_pipeline.rendered.validate_video"):
            return rendered.prepare(self.store,self.target,"expected",NOW)
    def test_import_binds_actual_render_and_editorial_artifacts(self):
        state=self.prepare()
        self.assertEqual(state["stage"],"validated")
        self.assertEqual(state["manifest"]["video_sha256"],digest(self.target/"japan-news-80s-tiktok.mp4"))
        self.assertIn(str(self.store.path/"bundle"/"captions.json"),state["manifest"]["artifacts"])
        self.assertEqual(state["mode"],"live")
    def test_repeat_import_does_not_erase_saved_upload(self):
        state=self.prepare(); state["upload"]={"phase":"ambiguous","marker":"saved"}; self.store.save(state)
        self.assertEqual(self.prepare()["upload"]["phase"],"ambiguous")
    def test_changed_bundle_does_not_reuse_edition_id(self):
        self.prepare(); (self.target/"japan-news-80s-tiktok.mp4").write_bytes(b"changed")
        with self.assertRaises(Failure): self.prepare()
    def test_missing_channel_rejected_before_state_created(self):
        with self.assertRaises(Failure): rendered.prepare(self.store,self.target,"",NOW)
        self.assertFalse((self.store.path/"edition.json").exists())
    def test_fixture_bundle_blocked(self):
        report=json.loads((self.target/"validation.json").read_text()); report["fixture"]=True
        (self.target/"validation.json").write_text(json.dumps(report))
        with self.assertRaises(Failure): self.prepare()
    def test_stale_source_rejected(self):
        with self.assertRaises(Failure): rendered.validate_sources(json.loads((self.target/"sources.json").read_text()),NOW+dt.timedelta(days=4))
    def test_decode_failure_prevents_import(self):
        with patch("news_pipeline.rendered.validate_video",side_effect=Failure("decode failed")):
            with self.assertRaises(Failure): rendered.prepare(self.store,self.target,"expected",NOW)
        self.assertFalse((self.store.path/"edition.json").exists())
    def test_private_upload_duplicate_protection_survives_import(self):
        api=FakeAPI()
        with patch("news_pipeline.rendered.validate_video"):
            item=rendered.upload_bundle(self.store,self.target,"expected",api,NOW)
            item2=rendered.upload_bundle(self.store,self.target,"expected",api,NOW)
        self.assertEqual(item["id"],item2["id"]); self.assertEqual(api.starts,1)
    def test_wrong_channel_change_is_rejected(self):
        self.prepare()
        with patch("news_pipeline.rendered.validate_video"):
            with self.assertRaises(Failure): rendered.prepare(self.store,self.target,"other",NOW)

class MorningTests(unittest.TestCase):
    def test_morning_requires_exact_render_factual_approval(self):
        with tempfile.TemporaryDirectory() as directory:
            target=bundle(directory)
            with self.assertRaises(Failure): morning.approve_ready({},target,NOW)
            ready={"reviewed_by":"producer","reviewed_at":NOW.isoformat(),"approved_video_sha256":digest(target/"japan-news-80s-tiktok.mp4")}
            morning.approve_ready(ready,target,NOW)
            ready["approved_video_sha256"]="wrong"
            with self.assertRaises(Failure): morning.approve_ready(ready,target,NOW)
    def test_jst_edition_date(self):
        self.assertEqual(morning.edition_date(dt.datetime(2026,10,1,22,tzinfo=dt.timezone.utc)),"2026-10-02")
    def test_missing_todays_edition_never_uses_yesterdays(self):
        with tempfile.TemporaryDirectory() as directory:
            (Path(directory)/"2026-10-01").mkdir()
            with self.assertRaises(Failure): morning.select_bundle(Path(directory),NOW)
    def test_wrong_edition_id_in_inbox_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            today=Path(directory)/"2026-10-02"; today.mkdir()
            (today/"ready.json").write_text(json.dumps({"edition":"japan-news-20261001-en","bundle":"other"}))
            with self.assertRaises(Failure): morning.select_bundle(Path(directory),NOW)
    def test_inbox_path_cannot_escape_date_folder(self):
        with tempfile.TemporaryDirectory() as directory:
            today=Path(directory)/"2026-10-02"; today.mkdir()
            (today/"ready.json").write_text(json.dumps({"edition":"japan-news-20261002-en","bundle":".."}))
            with self.assertRaises(Failure): morning.select_bundle(Path(directory),NOW)

if __name__=="__main__": unittest.main()
