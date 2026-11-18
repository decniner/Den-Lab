import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

BASE = Path(__file__).parents[1]
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

production = load("production", BASE / "scripts" / "production.py")
manifest_validator = load("validate_manifest", BASE / "scripts" / "validate_manifest.py")
caption_validator = load("validate_captions", BASE / "scripts" / "validate_captions.py")


class ValidatorTests(unittest.TestCase):
    def test_reference_manifest_checks_exact_names_and_hashes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            video = root / "Dracula_YouTube_Short_Painterly.mp4"
            cover = root / "Dracula_Hook_Cover.png"
            style = root / "A Room of One’s Own Legacy.png"
            video.write_bytes(b"video")
            cover.write_bytes(b"cover")
            style.write_bytes(b"style")
            import hashlib
            data = {"status": "LOCKED", "reference_video": video.name,
                    "reference_video_sha256": hashlib.sha256(b"video").hexdigest(),
                    "reference_cover": cover.name,
                    "reference_cover_sha256": hashlib.sha256(b"cover").hexdigest(),
                    "cover_style_reference": style.name,
                    "cover_style_reference_sha256": hashlib.sha256(b"style").hexdigest(),
                    "frame_samples_seconds": [1, 8, 20, 40, 65],
                    "approved_by": "reviewer", "approved_at": "2026-11-18"}
            self.assertEqual(manifest_validator.validate(data, root), [])
            data["reference_cover_sha256"] = "0" * 64
            self.assertTrue(any("sha256 mismatch" in e.lower() for e in manifest_validator.validate(data, root)))

    def test_probe_requires_video_geometry_rate_and_audio(self):
        payload = {"streams": [
            {"codec_type": "video", "width": 1080, "height": 1920, "r_frame_rate": "30/1"},
            {"codec_type": "audio", "codec_name": "aac"}],
            "format": {"duration": "10.0"}}
        def run(*args, **kwargs):
            return subprocess.CompletedProcess(args[0], 0, stdout=json.dumps(payload), stderr="")
        result = production.probe_video(Path("render.mp4"), run=run)
        self.assertEqual(result["duration_seconds"], 10.0)
        self.assertTrue(result["audio"])
        payload["streams"].pop()
        with self.assertRaisesRegex(RuntimeError, "no narration/audio"):
            production.probe_video(Path("render.mp4"), run=run)

    def test_caption_cues_must_share_one_baseline(self):
        self.assertTrue(any("no caption" in e.lower() for e in caption_validator.validate([])))
        cues = [
            {"start_ms": 0, "end_ms": 1000, "baseline_px": 1320,
             "words": [{"text": "Meaning", "start_ms": 0, "end_ms": 900}]},
            {"start_ms": 1000, "end_ms": 2000, "baseline_px": 1325,
             "words": [{"text": "gyp", "start_ms": 1100, "end_ms": 1900}]},
        ]
        self.assertTrue(any("shared baseline" in e.lower() for e in caption_validator.validate(cues)))
        cues[1]["baseline_px"] = 1320
        self.assertEqual(caption_validator.validate(cues), [])

    def test_failed_command_surfaces_clear_executable_error(self):
        with self.assertRaisesRegex(RuntimeError, "Required executable unavailable"):
            production.run_step(["not-installed"], Path.cwd(), run=lambda *a, **k: (_ for _ in ()).throw(FileNotFoundError()))


if __name__ == "__main__":
    unittest.main()
