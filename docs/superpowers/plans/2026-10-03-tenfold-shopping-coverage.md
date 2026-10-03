# Tenfold shopping coverage implementation plan

Goal: expand the existing nine-source Japan notifier toward 90 genuinely working public stores, or the user's clarified tenfold coverage measure. Keep the established-brand filter, >=50% exact threshold, Japan delivery, tax/variant/reference checks, and existing Telegram secrets/state isolated.

Source counts must distinguish discovered domains, permitted catalogs, validated configured sources, and successful live scans. Multiple collections or market aliases of one store never count as different sources. Blocked/unsupported sources remain documented research results, not enabled coverage.

1. Discover independent electronics, footwear/outdoor, and household/lifestyle domains through public primary pages. Probe robots, bounded catalog access, product variants, and Japan policies. Save research provenance and candidate records without credentials. Agents only write research artifacts outside repository files.
2. Add failing tests for 90-source config capacity, distinct-origin enforcement, bounded concurrent execution, independent request clients/deadlines, and safe mobile formatting with 90 sources/failures.
3. Extend config to at most 100 distinct sources and four concurrent source workers. Each source gets an independent HTTP client with the existing per-origin pacing and request guards. A shared overall deadline still marks unstarted sources as failed rather than claiming no deals. Keep history read-only during scanning and aggregate deterministically before acknowledged-only delivery.
4. Add tested adapters only when observed page evidence requires them. Never infer shipping, prices, reference bases, availability, or brand identity from search snippets. Register only verified source definitions with exact policy and vendor evidence; include supported brand aliases explicitly and scope aliases to an official source.
5. Summarize large coverage sets in Telegram, with complete per-source evidence retained in run artifacts. Keep failed scans visible and every message below the safe UTF-16 limit. Preserve exact product URLs and chunk-level acknowledged history.
6. Run offline shopping/regression checks and a full live dry run. Inspect actual products scanned, each source status, deals, caps, and exclusions. Record achieved expansion against the nine-source/4,506-product baseline without treating the target as achieved prematurely.
7. Commit/push, confirm CI, execute one authorized digest using existing bot/secrets, inspect Telegram acknowledgment and remote sent state, confirm active 07:00 JST cron, and document actual coverage plus external blockers.

User authorization: routine implementation and deployment decisions, commit/push, daily schedule, and existing Telegram delivery are already authorized. No purchases, shopping accounts, paid services, access-restriction bypasses, or credential exposure.
