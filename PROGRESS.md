# Tadaima daily refresh

- Baseline: 23 editions, 661 properties; existing deployment only.
- Missing scripts in README confirmed; rebuild will preserve committed scoring.
- Plan: docs/superpowers/plans/2026-10-25-tadaima-daily-refresh.md.
- Decisions: 07:20 JST; conservative source facts; daily scan + discovery; repeated explicit withdrawal before removal; explicit reusable Pages deployment.
- Validation: SUUMO and goo detail HTML accessible; HOME'S test returned 403.
- Next: parser and refresh tests, implementation, live dry run, pull request.
- Implemented conservative parser, merge, rebuild and daily workflow; 17 offline tests pass.
- All 23 existing JSON collections validate; generated city JS preserves every original payload and scoring block.
- First bounded live run found all three Kawagoe search categories (62 links); no existing facts verified in first 8-source sample. Investigating parser/source identity evidence; no published data changed.
- Node syntax check passed using bundled runtime.
- Confirmed and fixed main-listing scoping and unquoted station parsing using saved real source responses.
- Corrected live dry run: 3 existing facts verified, 1 eligible new property found; zero published changes.
- Independent review fixes: deploy exact refreshed SHA, clear false reduction badges on price rise, reject multiple-area units, isolate listing dates and withdrawal evidence.
- Final offline suite: 23 tests pass. All 23 city datasets validate; cached real-source checks verify 3 matching records.
- Next: publish PR and inspect GitHub validation before activating the schedule.
