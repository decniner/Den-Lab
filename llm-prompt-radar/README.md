# LLM Prompt Radar

A daily Telegram digest that discovers up to five public LLM prompts, ranks them with visible source evidence, and sends fewer when candidates do not meet the quality threshold. The scheduled GitHub Actions workflow runs at 01:00 UTC (10:00 Japan time) and reuses this repository's `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` secrets. Run **Actions → LLM Prompt Radar → Run workflow** and select **Send a Telegram test message** to test Telegram without querying sources or changing history.

## Sources and access

| Source | Interface used | Status and limits |
| --- | --- | --- |
| GitHub | Official REST API repository search and README endpoint | Always enabled. Public repository metadata is structured. Uses the workflow's `GITHUB_TOKEN`; requests are low volume and honor API failures/rate limits. Code Search is not used because GitHub requires authentication for it. |
| Reddit prompt communities | Official OAuth Data API search/listings | Optional. Enable by adding `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` as Actions secrets. Uses app-only OAuth and a small set of prompt-related communities. If unavailable or credentials are absent, the digest says so. Reddit's API terms/access conditions may change; this adapter must be disabled if the registered app no longer has authorized access. |
| PromptBase | No documented public API or RSS interface verified for this project | Not crawled. The project will not scrape product pages or bypass controls. |
| FlowGPT | No documented public API or RSS interface verified for this project | Not crawled. The project will not scrape product pages or bypass controls. |

The `SourceAdapter` interface in `radar.py` keeps sources independent. Add sources only when a documented API/feed or clearly permitted public structured interface is available. A failed source is reported in the digest; it is not interpreted as evidence that no prompts exist.

## Ranking

Each metric is normalized **within its source** so raw Reddit votes are never compared directly with GitHub stars. For engagement and trend, the candidate's percentile rank among that source's candidates is used (ties receive their average rank; a one-item source receives 0.5). The rank is multiplied by a log-volume factor, `min(1, ln(1+x)/ln(101))` for engagement and `min(1, ln(1+velocity)/ln(11))` for trend. This avoids granting a neutral half-score to an isolated low-activity candidate. The raw metric is transformed with `ln(1 + x)` before ranking to reduce the effect of outliers.

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

The default quality floor is `0.48` (`RADAR_MIN_SCORE`). The selector returns no more than five, caps any one source at three, and prefers no more than two prompts in a category. A third or later prompt in a category must score at least `0.85`, so a strong category is not mechanically excluded. It never lowers the floor to fill the digest. Adjust the floor using the Actions variable `RADAR_MIN_SCORE`. The score is a triage aid, not an objective measure of prompt quality. Duplicate sightings are shown as source links but never treated as independent validation: the available adapters do not reliably distinguish independent discussion from copied reposts. Reddit posts with an extreme score and almost no comments, or very high score in under an hour, receive a 75% multiplier reduction to both engagement and trend metrics and Low confidence. This simple anomaly check can miss coordinated activity or penalize legitimate viral posts.

## Safety, quality filters, and duplicate detection

All source text is treated as untrusted data: the workflow never executes prompts or follows instructions inside them. Before ranking, deterministic filters reject recognized API-token/private-key/password patterns, likely email/phone/national-ID strings, explicit jailbreak/safety-bypass language, common affiliate and engagement-bait phrases, generic role-only prompts with no technique, and weak prompt-list SEO signals. Rejected text is not written to history or printed to logs. These are pattern checks, not a guarantee that every secret, personal detail, malicious instruction, controversial topic, or disguised promotion will be recognized; review the original source before using a prompt. The available public metrics do not establish whether activity is coordinated or whether feedback is genuinely positive, so the notifier does not claim to verify either.

Prompts are normalized to lowercase alphanumeric tokens with common filler and generic role words removed. Exact normalized text has a stable SHA-256 identity. Near copies are clustered when the maximum of token-sequence similarity and an adjusted shared-token containment score reaches `0.78`. This catches reorderings and lightly rewritten text without an embedding service or extra dependency. The threshold is heuristic: semantic paraphrases using different vocabulary can escape detection, and unrelated short prompts may occasionally cluster. Cross-source duplicates share a cluster ID and cannot occupy multiple daily slots.

## Prompt text, attribution, and output

The digest includes title, extracted prompt text when found (up to 10,000 characters), original source link, creator when available, target model when stated, inferred category, publication/discovery date, available engagement/review metrics, duplicate sightings, selection rationale, score, and confidence. Identical prompt sightings from different sites are not counted as independent validation because the adapters do not establish whether they are copied. GitHub prompt extraction looks for substantial Markdown blocks under prompt-related headings, then falls back to substantial fenced blocks. Reddit uses the public post body. Extraction can miss prompts in unusual formats. No generated model claim is made when target model information is absent. A target-model name is inferred from the title/prompt text with a conservative pattern matcher; it may miss or misread mentions.

The sender splits long Telegram messages into safe-sized chunks. The digest explicitly says when fewer prompts are selected by the score, repeat-suppression, and diversity rules, and lists per-source candidate counts or access failures. Trending themes are reported only from that day's selected prompts and appear at the end of the digest.

## Setup and operation

1. Ensure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are configured in repository Actions secrets (the Netflix notifier already uses these names).
2. Optionally register an authorized Reddit API app and add `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET`. Without these, Reddit is reported as skipped; there is no unauthenticated `.json` fallback.
3. Open **Actions → LLM Prompt Radar** to run it manually, or select the test-message input to check Telegram without discovery/history changes. Scheduled runs happen daily at 10:00 Japan time (01:00 UTC).
4. Optional repository Actions variables: `RADAR_MIN_SCORE` (default `0.48`), `RADAR_MAX_PROMPTS` (default `5`), `RADAR_SOURCES` (comma-separated source names), and `RADAR_WEIGHTS` (JSON, for example `{"engagement":0.3,"trending":0.25,"positive":0.2,"recency":0.15,"usefulness":0.1}`). Weights are normalized to sum to 1.

## Historical tracking

`history.json` stores accepted candidates by source plus normalized-prompt hash, including normalized text, cluster ID, source URL, author, discovery and publication dates, category, model, latest metrics, rating/count, calculated/trending/quality scores, notification date, and timestamped engagement observations. Observations are retained for 90 days; unnotified discovery records are retained for 365 days. Notification cluster IDs and their normalized text are retained indefinitely to prevent routine repeats. A prompt can resurface only after at least seven days and only if one source shows at least `max(100, 50% of notified engagement)` additional interactions, its recent rate is at least 3× its prior measured rate, and its current score is at least 0.85. This explicit rule is labeled in the message; the notification baseline resets after resurfacing. Sensitive or quality-rejected content is deliberately not persisted. The workflow records selections and baselines in memory before sending, writes history after Telegram accepts the digest, then commits only this project's history file. This gives at-least-once behavior if Telegram succeeds but the subsequent Git push fails.

## Configuration

- Notification time: edit the workflow's `schedule.cron` (currently `0 1 * * *`, 10:00 JST). GitHub Actions cron syntax is UTC and must be configured in the workflow file.
- Prompt count: Actions variable `RADAR_MAX_PROMPTS` (default `5`, range 1–10).
- Minimum composite score: `RADAR_MIN_SCORE` (default `0.48`).
- Ranking weights: `RADAR_WEIGHTS`, JSON such as `{"engagement":0.3,"trending":0.25,"positive":0.2,"recency":0.15,"usefulness":0.1}`.
- Enabled sources: `RADAR_SOURCES`, comma-separated `github,reddit` (default both; Reddit still needs OAuth secrets).
- Telegram destination: existing `TELEGRAM_CHAT_ID`, optionally overridden with secret `RADAR_TELEGRAM_CHAT_ID`; token remains `TELEGRAM_BOT_TOKEN`.
- LLM provider/model: none. Discovery, analysis, quality explanations, and themes use deterministic code; no LLM is called, so no provider key is needed and popularity facts cannot be model-generated.

Telegram uses plain text without Markdown/HTML parsing, strips control and bidirectional formatting characters, neutralizes embedded prompt URLs, and caps messages into safe UTF-16 sized chunks. Source text is never used as a shell command or configuration value. The workflow is separate from the Netflix notifier, uses GitHub-hosted Actions and the existing Telegram secrets, and writes only `llm-prompt-radar/history.json`. Never commit API credentials.
