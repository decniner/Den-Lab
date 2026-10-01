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
- **Trend / velocity:** When history has a prior observation, use `max(0, current_interactions − previous_interactions) / elapsed_hours`. GitHub interactions are stars; Reddit interactions are post score plus twice the comment count. This gives each source an interactions-per-hour signal, then candidates are percentile-ranked only against the same source. On the first observation, use total interactions divided by item age in hours and label this fallback in the digest. It is a source-aware rate proxy; it cannot detect hourly bursts until at least two snapshots exist. Reddit votes can fluctuate, so falling counts produce a zero positive-velocity delta.
- **Positive feedback:** When a source exposes a positive ratio and a vote sample count, use the 95% Wilson lower confidence bound: `(p + z²/(2n) − z√((p(1−p)+z²/(4n))/n)) / (1+z²/n)`, with `z=1.96`. This shrinks small samples toward a conservative value. When no valid sample is available, use neutral 0.5 and label no rating evidence; no rating is invented.
- **Recency:** `exp(−age_days / 45)`, a 45-day decay constant (the score is 0.368 at 45 days; its half-life is about 31 days).
- **Usefulness:** A transparent 0–1 heuristic rewards structured instructions, examples, constraints/checklists, practical domain cues, and a usable prompt length. It is not an LLM judgment or a substitute for reader review.
- **Confidence:** A descriptive evidence-volume label based on engagement count (High ≥500, Medium ≥80, otherwise Low). It is not a statistical probability.
- **Independent corroboration:** Exact/near copies are clustered first. Two or more distinct source adapters referencing one cluster add up to 0.02 per extra source, capped at 0.04. Reposts within one source never count as separate sources. This small bonus is added after the weighted score.

The default quality floor is `0.48` (`RADAR_MIN_SCORE`). The selector returns no more than five, caps any one source at three, and prefers no more than two prompts in a category. A third or later prompt in a category must score at least `0.85`, so a strong category is not mechanically excluded. It never lowers the floor to fill the digest. Adjust the floor using the Actions variable `RADAR_MIN_SCORE`. The score is a triage aid, not an objective measure of prompt quality. Reddit posts with an extreme score and almost no comments, or very high score in under an hour, receive a 75% multiplier reduction to both engagement and trend metrics and Low confidence. This simple anomaly check can miss coordinated activity or penalize legitimate viral posts.

## Safety, quality filters, and duplicate detection

All source text is treated as untrusted data: the workflow never executes prompts or follows instructions inside them. Before ranking, deterministic filters reject recognized API-token/private-key/password patterns, likely email/phone/national-ID strings, explicit jailbreak/safety-bypass language, common affiliate and engagement-bait phrases, generic role-only prompts with no technique, and weak prompt-list SEO signals. Rejected text is not written to history or printed to logs. These are pattern checks, not a guarantee that every secret, personal detail, malicious instruction, controversial topic, or disguised promotion will be recognized; review the original source before using a prompt. The available public metrics do not establish whether activity is coordinated or whether feedback is genuinely positive, so the notifier does not claim to verify either.

Prompts are normalized to lowercase alphanumeric tokens with common filler and generic role words removed. Exact normalized text has a stable SHA-256 identity. Near copies are clustered when the maximum of token-sequence similarity and an adjusted shared-token containment score reaches `0.78`. This catches reorderings and lightly rewritten text without an embedding service or extra dependency. The threshold is heuristic: semantic paraphrases using different vocabulary can escape detection, and unrelated short prompts may occasionally cluster. Cross-source duplicates share a cluster ID and cannot occupy multiple daily slots.

## Prompt text, attribution, and output

The digest includes title, extracted prompt text when found, original source link, creator when available, target model when stated, inferred category, publication/discovery date, available engagement/review metrics, independent source links, selection rationale, score, and confidence. GitHub prompt extraction looks for substantial Markdown blocks under prompt-related headings, then falls back to substantial fenced blocks. Reddit uses the public post body. Extraction can miss prompts in unusual formats. No generated model claim is made when target model information is absent. A target-model name is inferred from text with a conservative pattern matcher; it may miss or misread mentions.

The sender splits long Telegram messages into safe-sized chunks. The digest explicitly says when fewer than five prompts pass the threshold and lists per-source candidate counts or access failures.

## Setup and operation

1. Ensure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are configured in repository Actions secrets (the Netflix notifier already uses these names).
2. Optionally register an authorized Reddit API app and add `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET`. Without these, Reddit is skipped; there is no unauthenticated `.json` fallback.
3. Open **Actions → LLM Prompt Radar** to run it manually. Scheduled runs happen daily at 10:00 UTC.
4. Optional repository Actions variables: `RADAR_MIN_SCORE` (default `0.48`) and `RADAR_WEIGHTS` (JSON, for example `{"engagement":0.3,"trending":0.25,"positive":0.2,"recency":0.15,"usefulness":0.1}`). Weights are normalized to sum to 1.

## Historical tracking

`history.json` stores accepted candidates by source plus normalized-prompt hash, including normalized text, cluster ID, source URL, author, discovery and publication dates, category, model, latest metrics, rating/count, calculated/trending/quality scores, notification date, and timestamped engagement observations. Observations are retained for 90 days; records and notification suppression are retained for up to 365 days after last seen. Sensitive or quality-rejected content is deliberately not persisted. The workflow writes history only after Telegram accepts the digest, then commits only this project's history file. This gives at-least-once behavior if Telegram succeeds but the subsequent Git push fails.

The workflow is separate from the Netflix notifier, uses GitHub-hosted Actions and the existing Telegram secrets, and writes only `llm-prompt-radar/history.json`. Never commit API credentials.
