import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import discover_footage
import download_approved
import render_documentary
from validate_manifest import validate_manifest


class DiscoveryTests(unittest.TestCase):
    def test_pexels_result_is_candidate_not_approved_license(self):
        result = discover_footage.parse_pexels({"videos": [{
            "id": 42, "url": "https://www.pexels.com/video/42/", "duration": 12,
            "user": {"name": "Creator", "url": "https://www.pexels.com/@creator"},
            "video_files": [{"link": "https://videos.pexels.com/a.mp4", "width": 1920, "height": 1080}]
        }]}, "Tokyo")
        self.assertEqual(result[0]["creator"], "Creator")
        self.assertEqual(result[0]["license_review"]["status"], "pending")

    def test_pixabay_parses_available_video_variant(self):
        result = discover_footage.parse_pixabay({"hits": [{
            "id": 9, "pageURL": "https://pixabay.com/videos/example-9/", "user": "maker", "user_id": 8,
            "duration": 8, "videos": {"medium": {"url": "https://cdn.pixabay.com/video.mp4", "width": 1920, "height": 1080}}
        }]}, "train")
        self.assertEqual(result[0]["provider"], "pixabay")
        self.assertEqual(result[0]["asset_id"], "9")

    def test_one_provider_failure_does_not_stop_other_provider(self):
        brief = {"topic": "test", "scenes": [{"scene_id": "a", "queries": ["one"]}]}
        with patch.object(discover_footage, "search_pexels", side_effect=RuntimeError("secret=hidden")), \
             patch.object(discover_footage, "search_pixabay", return_value=[{"provider": "pixabay", "asset_id": "1"}]):
            result = discover_footage.discover(brief, "pexels-secret", "pixabay-secret")
        self.assertEqual(len(result["candidates"]), 1)
        self.assertEqual(result["failures"][0]["error"], "RuntimeError")
        self.assertNotIn("secret", str(result))

    def test_no_keys_fail_closed_without_network(self):
        result = discover_footage.discover({"scenes": [{"scene_id": "a", "query": "Tokyo"}]})
        self.assertEqual(result["candidates"], [])
        self.assertEqual(result["failures"][0]["provider"], "configuration")

    def test_downloader_rejects_non_provider_host(self):
        self.assertFalse(download_approved.allowed_url("pexels", "https://example.com/clip.mp4"))
        self.assertTrue(download_approved.allowed_url("pixabay", "https://cdn.pixabay.com/video/clip.mp4"))

    def test_downloader_requires_completed_rights_review(self):
        candidate = {"provider": "pexels", "download_url": "https://videos.pexels.com/video.mp4",
                     "license_review": {"status": "pending"}}
        self.assertFalse(download_approved.approved(candidate))


class LicenseReviewTests(unittest.TestCase):
    def manifest(self):
        return {
            "title": "Test documentary", "format": "shorts", "narration_path": "narration.wav",
            "captions_path": "captions.srt", "scenes": [{
                "scene_id": "one", "clip_path": "clip.mp4", "provider": "pexels", "asset_id": "42",
                "creator": "Creator", "source_url": "https://www.pexels.com/video/42/",
                "download_url": "https://videos.pexels.com/a.mp4", "license_url": "https://www.pexels.com/license/",
                "download_date": "2026-10-19", "source_in_seconds": 0, "duration_seconds": 10,
                "review": {"license_status": "approved", "license_evidence_url": "https://www.pexels.com/license/",
                           "commercial_use_confirmed": True, "third_party_rights": "clear",
                           "release_review": "not applicable", "restrictions_checked": True,
                           "reviewer": "Den", "reviewed_at": "2026-10-19"}
            }]
        }

    def test_pending_license_is_rejected(self):
        data = self.manifest()
        data["scenes"][0]["review"]["license_status"] = "pending"
        errors = validate_manifest(data, check_files=False)
        self.assertTrue(any("license review is not approved" in error for error in errors))

    def test_approved_fully_documented_asset_is_accepted(self):
        self.assertEqual(validate_manifest(self.manifest(), check_files=False), [])

    def test_manual_provider_download_does_not_require_api_download_url(self):
        data = self.manifest()
        scene = data["scenes"][0]
        scene["acquisition_method"] = "manual-provider-download"
        scene["download_url"] = ""
        scene["downloaded_via_provider_ui"] = True
        self.assertEqual(validate_manifest(data, check_files=False), [])

    def test_manual_download_requires_provider_ui_confirmation(self):
        data = self.manifest()
        scene = data["scenes"][0]
        scene["acquisition_method"] = "manual-provider-download"
        scene["download_url"] = ""
        scene["downloaded_via_provider_ui"] = False
        self.assertTrue(any("downloaded_via_provider_ui" in error for error in validate_manifest(data, check_files=False)))

    def test_api_download_requires_direct_https_download_url(self):
        data = self.manifest()
        data["scenes"][0]["download_url"] = ""
        self.assertTrue(any("download_url must be an HTTPS URL" in error for error in validate_manifest(data, check_files=False)))

    def test_unknown_provider_is_rejected(self):
        data = self.manifest()
        data["scenes"][0]["provider"] = "unknown"
        self.assertTrue(any("provider must be pexels, pixabay, or mixkit" in error for error in validate_manifest(data, check_files=False)))

    def test_mixkit_requires_manual_acquisition_and_asset_license(self):
        data = self.manifest()
        scene = data["scenes"][0]
        scene.update({"provider": "mixkit", "acquisition_method": "manual-provider-download",
                      "download_url": "", "downloaded_via_provider_ui": True,
                      "license_url": "https://mixkit.co/license/modal/videoFree/"})
        self.assertEqual(validate_manifest(data, check_files=False), [])


class RenderingPlanTests(unittest.TestCase):
    def test_dissolve_overlap_is_accounted_for(self):
        scenes = [{"duration_seconds": 6.25}, {"duration_seconds": 6.25}]
        self.assertAlmostEqual(render_documentary.timeline_duration(scenes, 0.25), 12.25)

    def test_scene_must_be_longer_than_transition(self):
        with self.assertRaises(ValueError):
            render_documentary.timeline_duration([{"duration_seconds": 0.2}, {"duration_seconds": 3}], 0.25)

    def test_portrait_filter_has_center_crop_and_caption_safe_margin(self):
        filt = render_documentary.build_filter([{"duration_seconds": 10}], 1080, 1920, 30, 0, Path("captions.srt"))
        self.assertIn("crop=1080:1920", filt)
        self.assertIn("MarginV=430", filt)
        self.assertIn("[vout]", filt)


if __name__ == "__main__":
    unittest.main()
