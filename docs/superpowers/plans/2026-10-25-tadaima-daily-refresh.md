# Tadaima Daily Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Daily source-backed updates and discovery for Tadaima's 23 editions.
**Architecture:** Conservative portal parsing, refresh orchestration, deterministic rebuild, then explicit shared deployment.
**Tech Stack:** Python 3.12, Beautiful Soup, unittest, GitHub Actions.
**Spec:** docs/superpowers/specs/2026-10-25-tadaima-daily-refresh-design.md

## Global Constraints
- No new paid services or secrets. ¥5,000万 and 15-minute admission limits.
- Keep source facts on blocked/ambiguous responses; never fabricate research dates.
- Preserve existing scoring, editorial content, IDs, and flagged exceptions.

## Review Focus
- Anti-bot/error/related-listing content mistaken for facts.
- Multiple units, missing details, duplicate portal IDs, and out-of-city discoveries.
- Partial scans advancing dates or dropping listings.
- Data/index/count divergence or dropped scoring.
- Token commits not deploying; concurrent pushes and untrusted remote strings.

### Task 1: Portal facts and safe access
- [x] Write parser/admission tests; confirm missing implementation fails.
- [x] Implement source.py: fetch with robots/rate limits/redirect validation; parse detail facts and discovery URLs.
- [x] Test realistic HTML and blocked/ambiguous/incomplete cases.

### Task 2: Refresh and generated outputs
- [x] Write merge/build integration tests; confirm missing implementation fails.
- [x] Implement refresh.py and build.py; preserve unknowns and confirm withdrawals across days.
- [x] Test all existing collections and a bounded live dry run.

### Task 3: Schedule and publish
- [x] Add daily/manual/test workflow and make existing Pages deploy reusable.
- [x] Update README, verify YAML and Python, inspect final diff.
- [ ] Commit and open an attached pull request for review/activation.
