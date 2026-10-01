# LLM Prompt Radar

A daily Telegram digest that discovers up to five public LLM prompts, ranks them with visible evidence, and sends fewer when candidates do not meet the quality threshold. The scheduled GitHub Actions workflow runs at 10:00 UTC (19:00 Japan time) and reuses this repository's `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` secrets.

## Sources and access

| Source | Interface used | Status and limits |
| --- | --- | --- |
| GitHub | Official REST API repository search and README endpoint | Always enabled. Public repository metadata is structured. Uses the workflow's `GITHUB_TOKEN`; requests are low volume and honor API failures/rate limits. Code Search is not used because GitHub requires authentication for it. |
| Reddit prompt communities | Official OAuth Data API search/listings | Optional. Enable by adding `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` as Actions secrets. Uses app-only OAuth and a small set of prompt-related communities. If unavailable or credentials are absent, the digest says so. Reddit's API terms/access conditions may change; this adapter must be disabled if the registered app no longer has authorized access. |
| PromptBase | No documented public API or RSS interface verified for this project | Not crawled. The project will not scrape product pages or bypass controls. |
| FlowGPT | No documented public API or RSS interface verified for this project | Not crawled. The project will not scrape product pages or bypass controls. |

The `SourceAdapter` interface in `radar.py` keeps sources independent. Add sources only when a documented API/feed or clearly permitted public structured interface is available. A failed source is reported in the digest; it is not interpreted as evidence that no prompts exist.

## Ranking

Each metric is normalized **within its source** so raw Reddit votes are never compared directly with GitHub stars. For engagement and trend, the candidate's percentile rank among that source's candidates is used (ties receive their average rank; a one-item source receives 0.5). The raw count is transformed with `ln(1 + x)` before ranking to reduce the effect of outliers.

Default score (weights can be overridden with the Actions variable `RADAR_WEIGHTS`, a JSON object):

```text
score = 0.30 × engagement_percentile
      + 0.25 × trend_percentile
      + 0.20 × confidence_adjusted_positive_feedback
      + 0.15 × recency_score
      + 0.10 × usefulness_heuristic
```

- **Engagement:** GitHub repository stars; Reddit post score plus twice its comment count. Reddit and GitHub scores are ranked separately.
- **Trend:** GitHub stars divided by repository age in days, or Reddit score divided by post age in days. This is a lifetime-rate proxy, not measured day-over-day growth; it is labeled as such in the message.
- **Positive feedback:** When a source exposes a positive ratio and a vote sample count, use the 95% Wilson lower confidence bound: `(p + z²/(2n) − z√((p(1−p)+z²/(4n))/n)) / (1+z²/n)`, with `z=1.96`. This shrinks small samples toward a conservative value. When no valid sample is available, use neutral 0.5 and label no rating evidence; no rating is invented.
- **Recency:** `exp(−age_days / 45)`, a 45-day decay constant (the score is 0.368 at 45 days; its half-life is about 31 days).
- **Usefulness:** A transparent 0–1 heuristic rewards structured instructions, examples, constraints/checklists, practical domain cues, and a usable prompt length. It is not an LLM judgment or a substitute for reader review.
- **Confidence:** A descriptive evidence-volume label based on engagement count (High ≥500, Medium ≥80, otherwise Low). It is not a statistical probability.

The default quality floor is `0.48` (`RADAR_MIN_SCORE`). The selector returns no more than five and caps any one source at three. It never lowers the floor to fill the digest. Adjust the floor using the Actions variable `RADAR_MIN_SCORE`. The score is a triage aid, not an objective measure of prompt quality.

## Prompt text, attribution, and output

The digest includes title, extracted prompt text when found, original source link, creator when available, target model when stated, inferred category, publication/discovery date, available engagement/review metrics, selection rationale, score, and confidence. GitHub prompt extraction looks for substantial Markdown blocks under prompt-related headings, then falls back to substantial fenced blocks. Reddit uses the public post body. Extraction can miss prompts in unusual formats. No generated model claim is made when target model information is absent.

The sender splits long Telegram messages into safe-sized chunks. The digest explicitly says when fewer than five prompts pass the threshold and lists per-source candidate counts or access failures.

## Setup and operation

1. Ensure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are configured in repository Actions secrets (the Netflix notifier already uses these names).
2. Optionally register an authorized Reddit API app and add `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET`. Without these, Reddit is skipped; there is no unauthenticated `.json` fallback.
3. Open **Actions → LLM Prompt Radar** to run it manually. Scheduled runs happen daily at 10:00 UTC.
4. Optional repository Actions variables: `RADAR_MIN_SCORE` (default `0.48`) and `RADAR_WEIGHTS` (JSON, for example `{"engagement":0.3,"trending":0.25,"positive":0.2,"recency":0.15,"usefulness":0.1}`). Weights are normalized to sum to 1.

The workflow is separate from the Netflix notifier, reads but does not write repository contents, and uses GitHub-hosted Actions with the existing Telegram secrets. Never commit API credentials.
