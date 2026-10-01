"""Offline unit and fixture tests for LLM Prompt Radar."""
import contextlib
import io
import json
import os
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import radar


def candidate(source="Reddit", title="Structured research workflow", prompt=None, **kwargs):
    prompt = prompt or ("Review the supplied material in stages. List the claim, the evidence, the assumptions, "
                        "and the limitations. Use a table, cite only provided sources, flag uncertainty, "
                        "verify every conclusion against the acceptance criteria, and end with a checklist.")
    values = dict(source=source, title=title, url="https://www.reddit.com/r/example/post/",
                  author="fixture", published=radar.NOW - timedelta(hours=6), prompt=prompt,
                  engagement=200, velocity=4.0, positive_ratio=.9, rating_count=100,
                  usefulness=.8, category="Research", signals={"age_hours": 6})
    values.update(kwargs)
    return radar.Candidate(**values)


class RadarTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixtures = json.loads((ROOT / "tests" / "fixtures" / "candidates.json").read_text(encoding="utf-8"))

    def test_fixture_candidates_cover_multiple_sources_and_security(self):
        self.assertEqual({item["source"] for item in self.fixtures}, {"Reddit", "GitHub"})
        unsafe = next(item for item in self.fixtures if item["author"] == "fixture-only")
        self.assertFalse(radar.quality_gate(candidate(**unsafe))[0])

    def test_ranking_and_source_normalization_are_bounded(self):
        items = [candidate(engagement=10, velocity=1), candidate(engagement=1000, velocity=100),
                 candidate(source="GitHub", engagement=500, velocity=20)]
        ranked = radar.rank(items)
        self.assertEqual(ranked[0].engagement, 1000)
        for item in ranked:
            self.assertTrue(all(0 <= value <= 1 for value in item.scores.values()))

    def test_rating_confidence_adjusts_for_sample_size(self):
        small = candidate(positive_ratio=1.0, rating_count=2)
        large = candidate(positive_ratio=.96, rating_count=2000)
        radar.rank([small, large])
        self.assertLess(small.scores["positive"], large.scores["positive"])

    def test_trending_and_recency_scores(self):
        slow = candidate(velocity=1, published=radar.NOW - timedelta(days=40))
        fast = candidate(velocity=50, published=radar.NOW - timedelta(hours=1))
        radar.rank([slow, fast])
        self.assertGreater(fast.scores["trending"], slow.scores["trending"])
        self.assertGreater(fast.scores["recency"], slow.scores["recency"])

    def test_near_duplicate_similarity_and_threshold(self):
        first = candidate(prompt="Analyze this document as a senior consultant. Build a checklist and verify each claim.")
        rewritten = candidate(source="GitHub", prompt="Review this document as an experienced senior consultant. Build a checklist and verify every claim, including the evidence.")
        normalized_a, normalized_b = radar.normalized_prompt(first.prompt), radar.normalized_prompt(rewritten.prompt)
        self.assertGreater(radar.prompt_similarity(normalized_a, normalized_b), .55)
        leaders = radar.deduplicate([first, rewritten], radar.empty_history(), threshold=.55)
        self.assertEqual(len(leaders), 1)
        self.assertEqual(len(leaders[0].sighting_sources), 2)

    def test_exact_duplicate_and_notification_history_are_suppressed(self):
        first = candidate()
        first.quality_score = .8
        duplicate = candidate(source="GitHub")
        duplicate.quality_score = .8
        history = radar.empty_history()
        leaders = radar.deduplicate([first, duplicate], history)
        self.assertEqual(len(leaders), 1)
        history["notified_clusters"][leaders[0].cluster_id] = {"notified_at": radar.NOW.isoformat()}
        self.assertEqual(radar.choose(leaders, history["notified_clusters"]), [])

    def test_diversity_selection_and_insufficient_results(self):
        items = [candidate(title=f"Prompt {i}", category="Coding" if i < 4 else "Research",
                           engagement=300-i, prompt=(candidate().prompt + f" Criterion number {i}.")) for i in range(5)]
        for item in items:
            item.quality_score = .8
        selected = radar.choose(items, limit=5)
        self.assertLessEqual(sum(item.category == "Coding" for item in selected), 2)
        self.assertTrue(any(item.category == "Research" for item in selected))
        self.assertEqual(radar.choose([], limit=5), [])
        self.assertIn("No prompts met", radar.render([], []))

    def test_malformed_source_candidate_is_not_trusted(self):
        malformed = candidate()
        malformed.url = "javascript:alert(1)"
        self.assertEqual(radar.safe_source_url(malformed.url), "")
        self.assertFalse(radar.quality_gate(candidate(prompt="Act as an expert and analyze this document."))[0])
        with patch.object(radar.GitHubAdapter, "fetch", return_value=[None, {"unexpected": "shape"}]), \
             patch.object(radar, "load_history", return_value=radar.empty_history()), \
             patch.object(radar, "send_telegram", side_effect=AssertionError("dry-run must not send")), \
             patch.object(radar, "DRY_RUN", True), \
             patch.dict(os.environ, {"RADAR_SOURCES": "github", "DRY_RUN": "true"}, clear=False), \
             patch.object(sys, "argv", ["radar.py"]), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(radar.main(), 0)

    def test_transient_source_failure_retries_then_recovers(self):
        failure = radar.SourceHTTPError(503)
        with patch.object(radar, "_request_json_once", side_effect=[failure, {"items": []}]), \
             patch.object(radar.time, "sleep") as sleep:
            self.assertEqual(radar.request_json("https://api.github.com/test"), {"items": []})
        sleep.assert_called_once_with(1)

    def test_telegram_formatting_neutralizes_external_text(self):
        item = candidate(title="Injected\u202eTitle", prompt="Analyze https://evil.example/path with a checklist and verify all claims.")
        output = radar.render([item], [])
        self.assertNotIn("\u202e", output)
        self.assertIn("https[:]//evil.example", output)
        self.assertNotIn("<b>", output)

    def test_missing_telegram_secret_error_never_contains_token(self):
        with patch.dict(os.environ, {"TELEGRAM_BOT_TOKEN": "", "TELEGRAM_CHAT_ID": ""}, clear=False):
            with self.assertRaises(RuntimeError) as caught:
                radar.send_telegram("test")
        self.assertNotIn("fixture-secret", str(caught.exception))

    def test_source_failure_is_logged_and_dry_run_continues_without_history_or_send(self):
        with patch.object(radar.GitHubAdapter, "fetch", side_effect=ValueError("malformed external response")), \
             patch.object(radar, "load_history", return_value=radar.empty_history()), \
             patch.object(radar, "send_telegram", side_effect=AssertionError("dry-run must not send")), \
             patch.object(radar, "DRY_RUN", True), \
             patch.dict(os.environ, {"RADAR_SOURCES": "github", "DRY_RUN": "true"}, clear=False), \
             patch.object(sys, "argv", ["radar.py"]), contextlib.redirect_stdout(io.StringIO()) as output:
            self.assertEqual(radar.main(), 0)
        self.assertIn("No prompts met", output.getvalue())


if __name__ == "__main__":
    unittest.main()
