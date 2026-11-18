import json
import unittest
from pathlib import Path

from PIL import Image

SKILL = Path(__file__).parents[1]
FIXTURES = SKILL / "tests" / "fixtures" / "captions"
MANIFEST = json.loads((FIXTURES / "approved_frames.json").read_text(encoding="utf-8"))


def burgundy_pixels(image, box):
    x0, y0, x1, y1 = box
    region = image.crop((x0, y0, x1, y1)).convert("RGB")
    pixels = region.load()
    return sum(
        1 for y in range(region.height) for x in range(region.width)
        for r, g, b in [pixels[x, y]]
        if 85 <= r <= 165 and 20 <= g <= 90 and 30 <= b <= 115 and r > g * 1.35
    )


def ivory_glyph_bounds(image):
    left, top, right, bottom = image.size[0], image.size[1], -1, -1
    for y in range(image.size[1]):
        for x in range(image.size[0]):
            r, g, b = image.getpixel((x, y))
            if r > 205 and g > 195 and b > 180 and r - b < 40:
                left, top = min(left, x), min(top, y)
                right, bottom = max(right, x), max(bottom, y)
    return [left, top, right, bottom]


class ApprovedCaptionVisualRegressionTests(unittest.TestCase):
    def test_decoded_approved_frames_lock_active_word_and_fixed_phrase(self):
        frames = []
        for entry in MANIFEST["fixtures"]:
            image = Image.open(FIXTURES / entry["file"]).convert("RGB")
            self.assertEqual(image.size, (1000, 140))
            frames.append(image)

            active_count = burgundy_pixels(image, entry["word_box_crop_xyxy"])
            inactive_counts = [
                burgundy_pixels(image, other["word_box_crop_xyxy"])
                for other in MANIFEST["fixtures"]
                if other["active_word"] != entry["active_word"]
            ]
            self.assertGreaterEqual(active_count, 750, entry["active_word"])
            self.assertGreater(active_count, max(inactive_counts) + 400, entry["active_word"])

            probe = image.getpixel(tuple(MANIFEST["background_probe_crop_xy"]))
            self.assertLess(max(probe), 130, "caption backing plate detected")

        bounds = [ivory_glyph_bounds(image) for image in frames]
        self.assertEqual(bounds, [MANIFEST["expected_ivory_glyph_bounds_crop_xyxy"]] * len(frames))

    def test_approved_source_identity_and_style_configuration_are_locked(self):
        self.assertEqual(MANIFEST["approved_video_sha256"], "692ff3815eea7bbe23ba4254cd37546afe50d70b0b9d713d2cf6348a4600802d")
        self.assertEqual(MANIFEST["authoritative_commit"], "2b7f753")
        self.assertEqual([frame["active_word"] for frame in MANIFEST["fixtures"]],
                         ["Viktor", "Frankl’s", "Man’s", "Search", "for"])

        style = json.loads((SKILL / "caption_style.json").read_text(encoding="utf-8"))
        self.assertEqual(style["canvas"], [1080, 1920])
        self.assertEqual((style["font_weight"], style["font_size_px"]), (700, 56))
        self.assertEqual(style["font_family"], "BookSummaryCaption")
        self.assertEqual(style["font_asset_path"], "public/assets/Arial-Bold.ttf")
        self.assertEqual(style["font_asset_sha256"], "d72db21f9242aedd6b917d8549ad5921766b24d5f8d0becfda2ff4c620b3c2e0")
        self.assertEqual((style["left_x"], style["baseline_y"]), (78, 1368))
        self.assertEqual((style["outline_color"], style["outline_width_px"]), ("#f7f1e7", 4))
        self.assertEqual((style["text_color"], style["active_color"]), ("#1d1b19", "#7b2d3c"))
        self.assertNotIn("background", style)
        self.assertNotIn("plate", style)

        component = (SKILL / "components" / "Caption.tsx").read_text(encoding="utf-8")
        self.assertIn("import captionStyle from '../caption_style.json'", component)
        self.assertIn("w.active?captionStyle.active_color:captionStyle.text_color", component)
        self.assertNotIn("<rect", component)
        self.assertNotIn("animation", component.lower())
        self.assertNotIn("translate", component.lower())


if __name__ == "__main__":
    unittest.main()
