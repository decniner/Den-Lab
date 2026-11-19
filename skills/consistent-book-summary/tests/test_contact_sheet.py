import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).parents[1] / "scripts" / "build_contact_sheet.py"
spec = importlib.util.spec_from_file_location("build_contact_sheet", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ContactSheetTests(unittest.TestCase):
    def test_reports_missing_pillow_clearly(self):
        real_import = __import__
        def without_pillow(name, *args, **kwargs):
            if name == "PIL":
                raise ImportError("not installed")
            return real_import(name, *args, **kwargs)
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "art.png"
            source.write_bytes(b"placeholder")
            with patch("builtins.__import__", side_effect=without_pillow):
                with self.assertRaisesRegex(RuntimeError, "requires Pillow"):
                    module.create_contact_sheet([source], Path(tmp) / "sheet.png")

    def test_reports_missing_artwork_before_sheet_generation(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(RuntimeError, "Artwork files missing"):
                module.create_contact_sheet([Path(tmp) / "missing.png"], Path(tmp) / "sheet.png")


if __name__ == "__main__":
    unittest.main()
