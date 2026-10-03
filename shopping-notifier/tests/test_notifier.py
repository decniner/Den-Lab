import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from notifier import bounded_scanner, load_config, run
from sources import SourceResult
from state import FileState
from helpers import temporary_directory
from test_deals import CONFIG, NOW, STORE, deal


class NotifierTests(unittest.TestCase):
    def test_overall_budget_marks_unscanned_sources_without_hiding_failure(self):
        from unittest.mock import patch
        from network import HttpClient
        current = [0.0]
        cfg = {"scan_budget_seconds": 180, "source_budget_seconds": 120}
        client = HttpClient(clock=lambda: current[0])
        scanner = bounded_scanner(cfg, client, clock=lambda: current[0])
        with patch("notifier.scan_store", return_value=SourceResult("Shop")) as checking:
            scanner(STORE, cfg, NOW, {})
            self.assertEqual(client.deadline, 120)
            current[0] = 180
            result = scanner(STORE, cfg, NOW, {})
            self.assertEqual(checking.call_count, 1)
            self.assertEqual(result.status, "failed")
            self.assertIn("overall_scan_time_budget_exhausted", result.errors)

    def test_one_source_failure_does_not_prevent_other_sources(self):
        with temporary_directory() as directory:
            report = Path(directory) / "report.json"
            history_path = Path(directory) / "state.json"
            cfg = {**CONFIG, "stores": [STORE, {**STORE, "id": "broken", "name": "Broken"}], "max_deals": 10}
            calls = []
            def scanner(store, config, now, history):
                if store["id"] == "broken": raise RuntimeError("private failure detail")
                return SourceResult("Shop", products_scanned=1, products_verified=1, deals=[deal()])
            code = run(cfg, scanner, calls.append, FileState(history_path), NOW, report, dry_run=True)
            data = json.loads(report.read_text())
            self.assertEqual(code, 0)
            self.assertEqual(data["sources"][1]["status"], "failed")
            self.assertEqual(data["qualifying_deals"], 1)
            self.assertFalse(calls)
            self.assertFalse(history_path.exists())
            self.assertNotIn("private failure detail", report.read_text())

    def test_all_sources_failed_sends_incomplete_digest_and_returns_failure(self):
        with temporary_directory() as directory:
            cfg = {**CONFIG, "stores": [STORE], "max_deals": 10}
            calls = []
            scanner = lambda *args: SourceResult("Shop", status="failed", errors=["HTTP 403"])
            code = run(cfg, scanner, calls.append, FileState(Path(directory) / "state.json"), NOW, Path(directory) / "report.json")
            self.assertEqual(code, 2)
            self.assertIn("Coverage incomplete", calls[0])

    def test_config_bounds_and_no_enabled_stores_fail_clearly(self):
        baseline = json.loads((Path(__file__).resolve().parents[1] / "config.json").read_text(encoding="utf-8"))
        with temporary_directory() as directory:
            path = Path(directory) / "config.json"
            for update in [{"max_deals": 11}, {"request_attempts": 99}, {"max_pages_per_store": 0}, {"stores": []}]:
                path.write_text(json.dumps({**baseline, **update}), encoding="utf-8")
                with self.assertRaises(ValueError): load_config(path)

    def test_real_run_suppresses_same_day_repeat_and_dry_run_never_changes_state(self):
        with temporary_directory() as directory:
            cfg = {**CONFIG, "stores": [STORE], "max_deals": 10}
            state = FileState(Path(directory) / "state.json")
            report = Path(directory) / "report.json"
            calls = []
            scanner = lambda *args: SourceResult("Shop", products_scanned=1, deals=[deal()])
            run(cfg, scanner, calls.append, state, NOW, report)
            before = state.path.read_bytes()
            run(cfg, scanner, calls.append, state, NOW, report)
            self.assertEqual(len(calls), 1)
            run(cfg, scanner, calls.append, state, NOW, report, dry_run=True)
            self.assertEqual(before, state.path.read_bytes())


if __name__ == "__main__": unittest.main()
