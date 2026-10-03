"""Daily Japan shopping digest. No credentials needed for a local live dry run."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit

from deals import eligible, rank
from delivery import deliver, format_digest, send_telegram
from network import HttpClient
from sources import SourceResult, scan_store
from state import FileState, GitHubState, RunLock, StateError

ROOT = Path(__file__).resolve().parent
JST = timezone(timedelta(hours=9), "Asia/Tokyo")


def load_config(path):
    try:
        config = json.loads(Path(path).read_text(encoding="utf-8"))
        bounds = {"max_deals": (1, 10), "dedup_days": (7, 30), "max_pages_per_store": (1, 20),
                  "max_products_verified_per_store": (1, 100), "request_attempts": (1, 3),
                  "request_timeout_seconds": (1, 30)}
        bounds.update(source_budget_seconds=(30, 300), scan_budget_seconds=(60, 1200))
        for key, (low, high) in bounds.items():
            value = config[key]
            if isinstance(value, bool) or not isinstance(value, int) or not low <= value <= high:
                raise ValueError()
        if not 1 <= config["request_interval_seconds"] <= 10:
            raise ValueError()
        if "allowed_brands" not in config:
            config["allowed_brands"] = []
        for key in ("categories", "excluded_keywords", "allowed_brands"):
            if not isinstance(config[key], list) or not all(isinstance(x, str) and x for x in config[key]):
                raise ValueError()
        for key in ("min_price_jpy", "meaningful_drop_jpy", "meaningful_drop_percent"):
            if isinstance(config[key], bool) or not isinstance(config[key], (int, float)) or config[key] < 0:
                raise ValueError()
        maximum = config.get("max_price_jpy")
        if maximum is not None and (isinstance(maximum, bool) or not isinstance(maximum, int) or maximum < config["min_price_jpy"]):
            raise ValueError()
        stores = [s for s in config["stores"] if s.get("enabled", True)]
        if not stores or len(stores) > 10 or len({s["id"] for s in stores}) != len(stores):
            raise ValueError()
        for store in stores:
            page_size = store.get("catalog_page_size", 250)
            if isinstance(page_size, bool) or not isinstance(page_size, int) or not 1 <= page_size <= 250:
                raise ValueError()
            aliases = store.get("vendor_brand_aliases", {})
            if not isinstance(aliases, dict) or not all(isinstance(k, str) and k.strip() and isinstance(v, str) and v.strip() for k, v in aliases.items()):
                raise ValueError()
            parts = urlsplit(store["base_url"])
            if parts.scheme != "https" or not parts.hostname or parts.username or parts.password or parts.path not in ("", "/"):
                raise ValueError()
            if not re.fullmatch(r"[a-z0-9-]+", store["id"]):
                raise ValueError()
            if not isinstance(store["name"], str) or not 1 <= len(store["name"]) <= 80:
                raise ValueError()
            if not store["policy_paths"] or not all(p.startswith("/") and not p.startswith("//") for p in store["policy_paths"]):
                raise ValueError()
            for key in ("reference_pattern", "tax_pattern", "japan_delivery_pattern"):
                re.compile(store[key])
        return config
    except (ValueError, TypeError, KeyError, AttributeError, OSError, re.error):
        raise ValueError("Invalid shopping config; check documented types, enabled stores, HTTPS URLs, and bounds") from None


def run(config, scanner, sender, state, now, report_path, *, dry_run=False, test=False, delivery_clock=None):
    history = {"version": 1, "sent": {}} if test else state.load()
    results = []
    for store in config["stores"]:
        if not store.get("enabled", True):
            continue
        try:
            result = scanner(store, config, now, history)
        except Exception as exc:
            result = SourceResult(store["name"], status="failed", errors=["source_exception:" + type(exc).__name__])
        results.append(result)
        print("SCAN " + json.dumps(result.record(), ensure_ascii=True))
    all_deals = rank(list({d.key: d for r in results for d in r.deals}.values()))
    new_deals = [d for d in all_deals if eligible(d, history, now, config)]
    selected = new_deals[:config.get("max_deals", 10)]
    suppressed = len(all_deals) - len(new_deals)
    coverage_key = hashlib.sha256(json.dumps([r.record() for r in results], sort_keys=True).encode()).hexdigest()
    chunks = format_digest(selected, results, now, test=test, suppressed=suppressed)
    report = {"run_at_jst": now.isoformat(timespec="seconds"), "dry_run": dry_run, "test_digest": test,
              "sources": [r.record() for r in results], "coverage_incomplete": any(r.status != "ok" for r in results),
              "qualifying_deals": len(all_deals), "suppressed": suppressed, "selected_deals": [d.record() for d in selected],
              "telegram_messages_acknowledged": 0, "delivery_status": "dry_run" if dry_run else "pending",
              "digest": [chunk.text for chunk in chunks]}
    path = Path(report_path)
    def save_report():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    save_report()
    if dry_run:
        for chunk in chunks:
            print(chunk.text)
        return 0  # Coverage failures stay visible in the report/digest; a dry run never sends.
    previous = history.get("last_digest", {})
    if not test and not selected and previous.get("date") == now.date().isoformat() and previous.get("coverage_key") == coverage_key:
        report["delivery_status"] = "already_delivered_today"
        save_report()
        print("Daily digest already acknowledged; same-day repeat suppressed.")
        return 2 if all(r.status == "failed" for r in results) else 0
    def acknowledged(text):
        sender(text)
        report["telegram_messages_acknowledged"] += 1
        save_report()
    try:
        deliver(chunks, history, state, acknowledged, now, test=test, coverage_key=coverage_key, clock=delivery_clock)
    except Exception as exc:
        report["delivery_status"] = "failed_or_unconfirmed"
        report["delivery_error_type"] = type(exc).__name__
        save_report()
        raise
    report["delivery_status"] = "test_digest_sent" if test else "sent_and_state_saved"
    save_report()
    print(f"Telegram acknowledged {report['telegram_messages_acknowledged']} message(s); " +
          ("test history unchanged." if test else "shopping history persisted."))
    return 2 if results and all(r.status == "failed" for r in results) else 0


def bounded_scanner(config, client, *, clock=time.monotonic):
    deadline = clock() + config["scan_budget_seconds"]
    def scanner(store, cfg, now, history):
        if clock() >= deadline:
            return SourceResult(store["name"], status="failed", errors=["overall_scan_time_budget_exhausted"])
        client.deadline = min(deadline, clock() + cfg["source_budget_seconds"])
        return scan_store(store, cfg, client, now, history=history, clock=lambda: datetime.now(JST))
    return scanner


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, default=ROOT / "config.json")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="Live scan/report without sending or saving history")
    mode.add_argument("--test-digest", action="store_true", help="Live, labeled Telegram test; sent history unchanged")
    parser.add_argument("--github-state", action="store_true", help="Use the dedicated state branch with existing Actions GITHUB_TOKEN")
    parser.add_argument("--state", type=Path, default=ROOT / "state.json")
    parser.add_argument("--report", type=Path, default=ROOT / "run-report.json")
    args = parser.parse_args()
    config = load_config(args.config)
    backup = FileState(args.state)
    state = GitHubState(os.environ.get("GITHUB_REPOSITORY", ""), backup) if args.github_state and not args.test_digest else backup
    client = HttpClient(timeout=config["request_timeout_seconds"], attempts=config["request_attempts"],
                        delay=config["request_interval_seconds"])
    scanner = bounded_scanner(config, client)
    with RunLock(args.state.parent / ".run.lock"):
        return run(config, scanner, send_telegram, state, datetime.now(JST), args.report,
                   dry_run=args.dry_run, test=args.test_digest, delivery_clock=lambda: datetime.now(JST))


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    try:
        raise SystemExit(main())
    except (StateError, RuntimeError, ValueError, OSError) as exc:
        # All raised messages here are controlled diagnostics, never raw HTTP bodies/URLs/tokens.
        message = str(exc) if isinstance(exc, (StateError, RuntimeError, ValueError)) else type(exc).__name__
        print("ERROR: " + message, file=sys.stderr)
        raise SystemExit(1)
