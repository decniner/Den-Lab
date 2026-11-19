import hashlib
import importlib.util
import json
import struct
import unittest
import wave
from pathlib import Path

SKILL = Path(__file__).parents[1]
BASELINE = SKILL / "baseline"
spec = importlib.util.spec_from_file_location("verify_baseline", SKILL / "scripts" / "verify_baseline.py")
verify_baseline = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verify_baseline)


class ApprovedBaselineTests(unittest.TestCase):
    def test_all_versioned_baseline_files_match_manifest(self):
        self.assertEqual(verify_baseline.verify(), [])

    def test_approved_master_is_byte_locked(self):
        path = BASELINE / "mans-search-for-meaning/approved/Mans_Search_for_Meaning.mp4"
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        self.assertEqual(digest, "50119c570eba6ff0099b56f7ec3aeb47e072a5d12e71d4b21b080a37c48efd14")

    def test_approved_deliverables_exist_and_cover_is_vertical_full_hd(self):
        approved = BASELINE / "mans-search-for-meaning/approved"
        for name in ("Mans_Search_for_Meaning.mp4", "Mans_Search_for_Meaning_Hook_Cover.png",
                     "Artwork_Contact_Sheet.png", "Rendered_Frame_Review_Sheet.png", "Acceptance_Report.md"):
            self.assertTrue((approved / name).is_file(), name)
        data = (approved / "Mans_Search_for_Meaning_Hook_Cover.png").read_bytes()
        self.assertEqual(struct.unpack(">II", data[16:24]), (1080, 1920))

    def test_approved_master_metadata_is_pinned(self):
        verification = json.loads((BASELINE / "mans-search-for-meaning/approved/verification.json").read_text(encoding="utf-8"))
        metadata = verification["metadata"]
        self.assertEqual(metadata["size"], [1080, 1920])
        self.assertEqual(metadata["fps"], 30.0)
        self.assertAlmostEqual(metadata["duration"], 143.104, places=3)
        self.assertEqual(verification["decoded_frames"], 4293)
        self.assertEqual(verification["full_decode"], "passed")

    def test_baseline_scene_art_has_supported_portrait_or_square_ratios(self):
        scenes = BASELINE / "mans-search-for-meaning/assets/scenes"
        files = sorted(scenes.glob("scene-*.png"))
        self.assertEqual(len(files), 32)
        for path in files:
            data = path.read_bytes()
            self.assertEqual(data[:8], b"\x89PNG\r\n\x1a\n", path.name)
            width, height = struct.unpack(">II", data[16:24])
            ratio = width / height
            self.assertTrue(0.54 <= ratio <= 1.02, (path.name, (width, height)))

    def test_narration_and_cue_inputs_pin_approved_voice_and_timeline(self):
        root = BASELINE / "mans-search-for-meaning/inputs"
        timing = json.loads((root / "timing.json").read_text(encoding="utf-8"))
        manifest = json.loads((root / "project-manifest.json").read_text(encoding="utf-8"))
        references = json.loads((root / "reference-manifest.json").read_text(encoding="utf-8"))
        self.assertEqual((timing["voice"], timing["lang_code"], timing["speed"]), ("af_heart", "a", 1.0))
        self.assertEqual(manifest["narration_voice"], "af_heart")
        self.assertEqual(manifest["narration_settings"], {"lang_code": "a", "speed": 1.0})
        self.assertEqual(manifest["timeline"]["narration_start_frame"], 0)
        self.assertEqual(references["reference_video_sha256"], "1c1744612f4d9aebbe37e2b450d843f825fc29ff1650684eba8fe30df3b32a9b")
        self.assertEqual(references["reference_cover_sha256"], "2f1f7801f6908c62ca75c8b30b454397499bbae465eee21de05e9e322f162100")
        self.assertEqual(references["cover_style_reference_sha256"], "5a3c4fc5d24ab85e28b909f6247a4116d22e9c53faab4163bbdbfd7fe7f944e0")
        with wave.open(str(root / "narration.wav"), "rb") as audio:
            self.assertAlmostEqual(audio.getnframes() / audio.getframerate(), 143.075, places=2)

    def test_every_approved_scene_has_emotional_context_review(self):
        manifest = json.loads((BASELINE / "mans-search-for-meaning/inputs/project-manifest.json").read_text(encoding="utf-8"))
        scenes = manifest["artwork"]["scenes"]
        self.assertEqual(len(scenes), 32)
        for scene in scenes:
            review = scene["emotional_review"]
            for field in ("narration_meaning", "intended_tone", "facial_expression", "body_language", "environmental_mood"):
                self.assertTrue(review[field].strip(), (scene["image"], field))
            self.assertEqual(review["human_review_status"], "approved")


if __name__ == "__main__":
    unittest.main()
