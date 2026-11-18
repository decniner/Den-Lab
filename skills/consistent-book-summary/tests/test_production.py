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
            "artwork": {"cover": "cover.png", "contact_sheet": "sheet.png", "scenes": ["scene.png"],
                        "review": {"status": "approved", "reviewer": "tester", "premium_illustration": True,
                                   "consistent_character": True, "palette_tones": 3, "no_primitive_vectors": True}},
            "narration": "narration.wav",
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
