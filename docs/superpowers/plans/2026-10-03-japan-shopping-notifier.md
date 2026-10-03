# Japan Shopping Notifier Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement inline. Follow test-first cycles and obtain one independent final code review.

**Goal:** Deploy a verified Japan shopping digest using existing Telegram secrets at 07:00 JST daily.

**Architecture:** Independent standard-library Python subsystem. Catalog discovery feeds fresh product-page verification, Decimal calculations, seven-day history, and safe Telegram delivery. State lives on a dedicated branch.

**Tech Stack:** Python 3.12+, unittest, urllib, HTMLParser, GitHub Actions and Contents API.

**Spec:** `docs/superpowers/specs/2026-10-03-japan-shopping-notifier-design.md`

## Global Constraints

- Do not expose credentials or modify existing notifier code/workflows/state.
- At least 50% BEFORE rounding; all prices tax-inclusive JPY; exact in-stock physical variants.
- At most ten entries; seven-day suppression; meaningful drop at least 5% AND JPY 100.
- Schedule `0 22 * * *`; all source failures must remain visible.
- Dry-run and test digest never update sent history; history follows successful Telegram acknowledgement.

## Review Focus

- JPY Shopify `.js` prices use hundredths even though JPY has no decimal checkout unit; test conversion against HTML offers.
- Disagreement between fresh JSON and HTML or invalid dates must exclude the deal.
- Unknown robots/policy/feed format must fail visibly, not become an empty successful scan.
- A later Telegram chunk failing must preserve earlier acknowledged deliveries only.
- Corrupt state and concurrent runs must fail without duplicate uncontrolled sends.

## Tasks

### 1. Deal model and filters
Files: `shopping-notifier/deals.py`, `config.json`, `tests/test_deals.py`.
Interfaces: `Deal`, `validate_variant(product, variant, store, config, now)`, `eligible(deal, history, now, config)`, `rank(deals)`.
- [x] Write/run failing tests for exact Decimal math, threshold boundaries, invalid references, availability, variant/quantity restrictions, price/category/keyword filters, ranking, and seven-day dedup/drop boundaries.
- [x] Implement those interfaces and run the suite.

### 2. Public sources and network
Files: `network.py`, `sources.py`, `tests/test_sources.py`, small representative fixtures.
Interfaces: `HttpClient.get(url)`, `scan_store(store, config, client, now) -> SourceResult`, `verify_product(...) -> Deal | rejection`.
- [x] Write/run failing tests for robots wildcards, bounded retries/rates, malformed feeds, partial-source failure, exact matching offers, tax/Japan policies, expired/unavailable variants, and price-unit conversions.
- [x] Implement five curated storefront adapters with live policy/HTML checks and bounded discovery; run suite and live dry-run.

### 3. Delivery, state, and orchestration
Files: `delivery.py`, `state.py`, `notifier.py`, tests for delivery/state/CLI.
Interfaces: `format_digest`, `send_message`, local/remote state store, `run(config, source scanner, sender, state, modes)`.
- [x] Write/run failing tests for mobile splitting, source-failure text, empty/suppressed outcomes, successful-only state, partial-send failure, corrupt history, exclusive lock, dry-run/test invariance, and safe secret handling.
- [x] Implement atomic history, dedicated state branch, and CLI; run entire new suite and existing notifier regressions.

### 4. Deployment and acceptance
Files: `.github/workflows/shopping-notifier.yml`, `shopping-notifier/README.md`, `docs/validation.md`.
- [x] Add schedule/manual/test/dry-run workflow with independent concurrency and existing secret names.
- [x] Document actual source coverage and limits, configuration, state recovery, manual execution, scheduling delays, and troubleshooting.
- [x] Inspect live dry-run; independently review implementation; fix significant findings with tests.
- [x] Commit/push to default branch; dispatch one labeled live test digest; inspect Actions result; confirm schedule enabled.
- [x] Record changed files, tests, working/blocked sources, test-delivery evidence, commit, and schedule status.
