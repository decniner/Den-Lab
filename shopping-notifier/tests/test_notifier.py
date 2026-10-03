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
    def test_large_source_config_requires_distinct_origins_and_bounded_workers(self):
        baseline = json.loads((Path(__file__).resolve().parents[1] / "config.json").read_text(encoding="utf-8"))
        template = next(s for s in baseline["stores"] if s.get("enabled", True))
        stores = [dict(template, id=f"shop-{i}", base_url=f"https://shop-{i}.example") for i in range(90)]
        with temporary_directory() as directory:
            path = Path(directory) / "config.json"
            cfg = dict(baseline, stores=stores, max_parallel_sources=4)
            path.write_text(json.dumps(cfg), encoding="utf-8")
            self.assertEqual(len(load_config(path)["stores"]), 90)
            for bad in [dict(cfg, max_parallel_sources=5), dict(cfg, stores=stores + [dict(stores[0], id="duplicate")])]:
                path.write_text(json.dumps(bad), encoding="utf-8")
                with self.assertRaises(ValueError): load_config(path)

    def test_parallel_scans_overlap_but_preserve_source_order_and_history(self):
        from threading import Barrier, Lock
        barrier, guard = Barrier(2, timeout=3), Lock()
        active, peak = [0], [0]
        stores = [dict(STORE, id=f"shop-{i}", name=f"Shop {i}") for i in range(4)]
        def scanner(store, config, now, history):
            with guard:
                active[0] += 1
                peak[0] = max(peak[0], active[0])
            barrier.wait()
            with guard: active[0] -= 1
            return SourceResult(store["name"], products_scanned=1)
        with temporary_directory() as directory:
            report = Path(directory) / "report.json"
            state = FileState(Path(directory) / "state.json")
            run(dict(CONFIG, stores=stores, max_parallel_sources=2), scanner, lambda _: None, state, NOW, report, dry_run=True)
            records = json.loads(report.read_text())["sources"]
            self.assertEqual([r["store"] for r in records], [s["name"] for s in stores])
            self.assertEqual(peak[0], 2)
            self.assertFalse(state.path.exists())

    def test_independent_scanner_gives_each_source_its_own_client_and_deadline(self):
        from notifier import independent_scanner
        from unittest.mock import patch
        clients, current = [], [0.0]
        class Client:
            def __init__(self, **kwargs): clients.append(self); self.deadline = None
        scanner = independent_scanner({"scan_budget_seconds": 180, "source_budget_seconds": 120,
                                       "request_timeout_seconds": 15, "request_attempts": 1,
                                       "request_interval_seconds": 1}, client_factory=Client, clock=lambda: current[0])
        with patch("notifier.scan_store", return_value=SourceResult("Shop")) as checking:
            scanner(STORE, {}, NOW, {})
            current[0] = 100
            scanner(STORE, {}, NOW, {})
            self.assertEqual([c.deadline for c in clients], [120, 180])
            self.assertIsNot(clients[0], clients[1])
            current[0] = 181
            self.assertEqual(scanner(STORE, {}, NOW, {}).status, "failed")
            self.assertEqual(checking.call_count, 2)

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
