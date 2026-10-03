# Airfare Notifier Implementation Plan

Goal: implement the authorized design.md with Python standard library and reuse existing Telegram transport.

1. Add behavioral tests for itinerary validation, calendar dates, message classification and operational failures; run them red before implementation.
2. Implement small core.py with bounded date sampling, strict full-round-trip/nonstop validation and source-scoped message formatting. Run tests green.
3. Add delivery/state tests, then implement isolated file/GitHub state claims, refresh-before-alert orchestration, live OctoTrip adapter and dry-run CLI. Run tests green and inspect the live response against the adapter.
4. Add independent scheduled workflow and configuration/setup/coverage/recovery documentation. Run regression suites, compile checks, and a live dry run.

Review focus: intermediate stops in a single segment; changed refresh prices; malformed payloads versus successful empty searches; crash after durable claim; API failures exposing credentials. Paid use and publishing unverified fares are outside scope. Any deployment requires accessible repository write credentials; report missing access rather than claiming enabled scheduling.
