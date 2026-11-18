import importlib.util
import json
import struct
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).parents[1] / "scripts" / "production.py"
spec = importlib.util.spec_from_file_location("production", SCRIPT)
production = importlib.util.module_from_spec(spec)
spec.loader.exec_module(production)


class ProductionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        for name, content in (("Dracula_YouTube_Short_Painterly.mp4", b"video"), ("Dracula_Hook_Cover.png", b"cover"),
                              ("A Room of One’s Own Legacy.png", b"cover-style"),
                              ("cover.png", b"art"), ("sheet.png", b"sheet"),
                              ("narration.wav", b"audio"), ("scene.png", b"scene")):
            (self.root / name).write_bytes(content)
        png = b"\x89PNG\r\n\x1a\n" + b"\x00\x00\x00\x0dIHDR" + struct.pack(">II", 1080, 1920) + b"\x08\x06\x00\x00\x00"
        (self.root / "cover.png").write_bytes(png)
        self.manifest = {
            "references": {"video": "Dracula_YouTube_Short_Painterly.mp4", "cover": "Dracula_Hook_Cover.png",
                           "cover_style": "A Room of One’s Own Legacy.png"},
            "approved_duration_seconds": 10,
            "hook_duration_seconds": 2.5,
            "artwork": {"cover": "cover.png", "contact_sheet": "sheet.png", "scenes": [{"image": "scene.png", "start_ms": 0, "end_ms": 10000}],
                        "review": {"status": "approved", "reviewer": "tester", "premium_illustration": True,
                                   "consistent_character": True, "palette_tones": 3, "no_primitive_vectors": True}},
            "narration": "narration.wav",
            "narration_provider": "kokoro",
            "visuals": {"mode": "still_images", "character_animation": False},
            "timeline": {"narration_start_frame": 0, "total_frames": 300, "hook_frames": 75,
                         "caption_component": "components/Caption.tsx", "caption_baseline_px": 1320},
            "image_generation": {"executable": "generator"},
            "render": {"entry_point": "src/index.ts", "hook_composition": "Hook", "full_composition": "Summary",
                       "props": "props.json", "output": "out.mp4", "hook_output": "hook.mp4"},
        }

    def tearDown(self):
        self.tmp.cleanup()

    def test_relative_paths_are_resolved_from_manifest_directory(self):
        self.assertEqual(production.resolve_path(self.root, "ref.mp4"), self.root / "ref.mp4")

    def test_rejects_missing_exact_references(self):
        self.manifest["references"]["video"] = "absent.mp4"
        errors = production.validate_manifest(self.manifest, self.root, check_imagegen=False)
        self.assertTrue(any("reference video" in e.lower() and "missing" in e.lower() for e in errors))

    def test_rejects_primitive_art_and_unreviewed_contact_sheet(self):
        self.manifest["artwork"]["cover"] = "cover.svg"
        self.manifest["artwork"]["review"]["status"] = "pending"
        errors = production.validate_manifest(self.manifest, self.root, check_imagegen=False)
        self.assertTrue(any("raster" in e.lower() for e in errors))
        self.assertTrue(any("approved" in e.lower() for e in errors))

    def test_rejects_hook_that_extends_duration(self):
        self.manifest["hook_duration_seconds"] = 12
        errors = production.validate_manifest(self.manifest, self.root, check_imagegen=False)
        self.assertTrue(any("hook" in e.lower() and "duration" in e.lower() for e in errors))

    def test_still_image_compositor_keeps_audio_captions_and_static_art(self):
        component = (Path(__file__).parents[1] / "components" / "StillImageSequence.tsx").read_text(encoding="utf-8")
        self.assertIn("<Audio", component)
        self.assertIn("startFrom={0}", component)
        self.assertIn("<Caption", component)
        self.assertIn("currentScene.src", component)
        self.assertIn("publicAsset", component)
        self.assertNotIn("Skeleton", component)
        self.assertNotIn("boneRig", component)

    def test_caption_component_matches_stationary_instant_highlight_contract(self):
        skill = Path(__file__).parents[1]
        component = (skill / "components" / "Caption.tsx").read_text(encoding="utf-8")
        compositor = (skill / "components" / "StillImageSequence.tsx").read_text(encoding="utf-8")
        style = json.loads((skill / "caption_style.json").read_text(encoding="utf-8"))
        self.assertEqual(style["font_weight"], 700)
        self.assertEqual(style["word_gap_px"], 10)
        self.assertEqual(style["outline_width_px"], 4)
        self.assertIn("captionStyle.word_gap_px", component)
        self.assertIn("captionStyle.outline_width_px", component)
        self.assertIn("captionStyle.shadow_blur_px", component)
        self.assertNotIn("caption={", compositor)
        self.assertIn("<Caption words={words}/>", compositor)
        self.assertIn("w.active?captionStyle.active_color:captionStyle.text_color", component)
        self.assertNotIn("scale(", component)
        self.assertNotIn("translate", component)

    def test_rejects_scene_timing_gap(self):
        self.manifest["artwork"]["scenes"][0]["end_ms"] = 9000
        errors = production.validate_manifest(self.manifest, self.root, check_imagegen=False)
        self.assertTrue(any("cover the approved runtime" in e.lower() for e in errors))

    def test_rejects_character_animation_architecture(self):
        self.manifest["visuals"]["character_animation"] = True
        errors = production.validate_manifest(self.manifest, self.root, check_imagegen=False)
        self.assertTrue(any("character animation" in e.lower() for e in errors))

    def test_subprocess_uses_argument_list_without_shell(self):
        seen = {}
        def fake_run(args, **kwargs):
            seen["args"] = args
            seen["kwargs"] = kwargs
            return __import__("subprocess").CompletedProcess(args, 0)
        production.run_step(["tool path", "arg with space"], self.root, run=fake_run)
        self.assertEqual(seen["args"], ["tool path", "arg with space"])
        self.assertFalse(seen["kwargs"]["shell"])

    def test_missing_image_generator_fails_clearly(self):
        errors = production.validate_manifest(self.manifest, self.root, check_imagegen=True,
                                              which=lambda _: None)
        self.assertTrue(any("image-generation" in e.lower() for e in errors))


if __name__ == "__main__":
    unittest.main()
