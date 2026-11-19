import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SKILL = Path(__file__).parents[1]
spec = importlib.util.spec_from_file_location("validate_opening", SKILL / "scripts" / "validate_opening.py")
opening = importlib.util.module_from_spec(spec)
spec.loader.exec_module(opening)


class OpeningContractTests(unittest.TestCase):
    def test_exact_future_opening_and_immediate_summary(self):
        self.assertEqual(opening.expected_opening("Meditations", "Marcus Aurelius"),
                         "Meditations by Marcus Aurelius. A book summary in under 3 minutes.")
        self.assertEqual(opening.validate_script(
            "Meditations", "Marcus Aurelius",
            "Meditations by Marcus Aurelius. A book summary in under 3 minutes. Begin with calm attention."), [])

    def test_rejects_missing_period_wrong_author_or_delay_before_summary(self):
        for script in (
            "Meditations by Marcus Aurelius. A book summary in under 3 minutes: Begin.",
            "Meditations by Seneca. A book summary in under 3 minutes. Begin.",
            "Meditations by Marcus Aurelius. A book summary in under 3 minutes. Here is the story. Begin.",
        ):
            self.assertTrue(opening.validate_script("Meditations", "Marcus Aurelius", script))

    def test_caption_sequence_matches_opening_words_and_punctuation(self):
        cues = [["Meditations", "by", "Marcus", "Aurelius."], ["A", "book", "summary"],
                ["in", "under", "3", "minutes."], ["Begin."]]
        self.assertEqual(opening.validate_caption_opening(cues, "Meditations by Marcus Aurelius. A book summary in under 3 minutes."), [])
        cues[2][-1] = "minute."
        self.assertTrue(opening.validate_caption_opening(cues, "Meditations by Marcus Aurelius. A book summary in under 3 minutes."))

    def test_project_manifest_requires_opening_and_caption_sequence(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "narration.txt").write_text("Meditations by Marcus Aurelius. A book summary in under 3 minutes. Begin.", encoding="utf-8")
            (root / "captions.json").write_text(json.dumps([
                {"words": [{"text": w} for w in chunk.split()]}
                for chunk in ("Meditations by Marcus Aurelius.", "A book summary", "in under 3 minutes.", "Begin.")]), encoding="utf-8")
            data = {"book_title": "Meditations", "author": "Marcus Aurelius",
                    "narration_script": "narration.txt", "captions": "captions.json"}
            self.assertEqual(opening.validate_project(data, root), [])


if __name__ == "__main__":
    unittest.main()
