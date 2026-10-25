# Tadaima daily refresh

Refresh the existing 23 city editions every morning at 07:20 Asia/Tokyo.
Recheck listed properties and discover new houses and land within each edition's
¥5,000万 / 15-minute brief. Preserve the flagged Kawagoe extension.

Use an ordinary Python job on a standard GitHub-hosted Ubuntu runner. Reuse the
public portal links and current JSON/JavaScript schema. No paid API or new secret.
A scheduled Codex research task would need a different runtime; a date-only rebuild
would not actually refresh content, so neither meets the requested GitHub workflow.

Only parsed, unambiguous detail-page facts may update existing records. Index-only
and shared-source records retain their facts. Failed/blocked requests never mean sold.
Removal requires an explicit withdrawal message on two consecutive calendar days.
New records require complete single-property facts, source date, matching city,
station, price, walk, area, construction date (houses), and legal restriction fields.
Ambiguous results remain candidates in the run report. Escape all external text.

Regenerate city JS, hub counts/prices, property search, aggregate JSON, metadata,
and sitemap together. Preserve scoring and editorial metadata. Record per-property
check dates without advancing research dates for unverified properties.

Commit validated data changes, then explicitly call the shared Pages deployment;
GitHub's workflow token commits alone do not trigger another push workflow.
Use least job-level permissions, serialized runs, timeouts, bounded crawling,
robots rules, manual dry-run mode, and retained reports on failures.

Acceptance: offline tests cover parsing, refusals, failed/partial sources, withdrawal
confirmation, duplicate candidates, strict admission and generated data consistency.
A live dry run must show actual source checks before activation; reports disclose
sources which could not be verified. No claim of activation before workflow merge.
