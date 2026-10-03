# Daily private Japan Explained uploads

Requested time: **05:00 Asia/Tokyo**. GitHub workflow uses cron `0 5 * * *`
and `timezone: Asia/Tokyo`. GitHub may dispatch scheduled jobs late; this is
a run-start schedule, not a guaranteed upload-completion deadline.

## Actual setup state

Configured via authenticated GitHub API on 2026-10-03:

- Encrypted repository secret `YOUTUBE_OAUTH_TOKEN` (API keys cannot upload).
- Variables `JAPAN_EXPLAINED_DAILY_ENABLED=true`, `JAPAN_EXPLAINED_CONFIG`,
  `JAPAN_EXPLAINED_STATE_ROOT`, `JAPAN_EXPLAINED_PYTHON`.
- `youtube-upload` environment restricted to the `main` branch.
- Official Windows runner `Den-Japan-Explained`, label
  `japan-explained-windows`, installed after checking the release SHA-256.

**Runner startup was blocked:** the execution approval system returned
`approval request failed` for launching the runner and installing startup.
Registration and configuration succeeded, but online status and a live manual
workflow run are not verified. The schedule cannot execute with an offline runner.
Do not report daily automation as operational until the runner is online and
a manual `daily-private` workflow succeeds.

## Finish runner startup locally

From your own Windows PowerShell session, start the existing registered runner:

```powershell
& 'C:\Users\DenDev\Documents\Codex\2026-10-02\check-current-youtube-requirements-for-synthetic-content\.tools\start-japan-runner.ps1'
```

To install current-user sign-in startup (no password stored), run:

```powershell
$project = 'C:\Users\DenDev\Documents\Codex\2026-10-02\check-current-youtube-requirements-for-synthetic-content\Den-Lab\japan-facts-video'
$runner = 'C:\Users\DenDev\Documents\Codex\2026-10-02\check-current-youtube-requirements-for-synthetic-content\.tools\actions-runner-japan'
& (Join-Path $project 'tools\install-runner-startup.ps1') -RunnerDirectory $runner
```

Verify `Den-Japan-Explained` is online under repository Settings → Actions →
Runners. Run **Japan Explained → Run workflow → daily-private** on `main`.
For today's already uploaded edition, this verifies the existing video rather
than creating another upload. Leave this PC on, signed in, awake and connected
at 05:00. The sign-in task is not an unattended system service.

## Daily behavior and controls

One edition ID per Japan date: `japan-explained-YYYYMMDD-daily`. A global daily
lock plus edition locks serialize manual/scheduled retries. Persistent state and
topic history are outside checkout. The command resumes researched, scripted,
rendered, validated and uploaded stages; ambiguous uploads use the original
session reconciliation and never authorize a second initiation automatically.
Failed content stops and requires explicit recovery of the same edition.

Live HTTPS sources are fetched again; reviewed claims, independent publishers,
source quotations and script approval checks must pass. Only candidates with
reviewed packs are eligible. No scraped page is treated as instructions.
Andrew's exact selected preview, restrained delivery and immutable audio cache
remain required. Audio is measured; captions and scene times use native events.
Validation failure prevents upload. No synthesis fallback, paid tier, paid job,
public publish or unsupported content is enabled.

Daily private uploads use the owner's standing instruction. Automated inspection
records **audio_listened=false**, **human_frames_reviewed=false**, and
**automated_checks_only=true**, rather than inventing a human check. The speech
provenance is bound to the manifest and prevents public publishing of a private
review edition.

## Reviewed topic queue

This is a finite, reviewed source/template pipeline. Today's new fact is Japan's
50/60 Hz electricity split; the next reviewed pack covers koji enzymes and rice
starch. Other discovery candidates need reviewed packs and supported diagrams
before they can be used. Add fresh verified facts to sustain daily output; when
the queue is exhausted or reviews expire (30 days), the job fails visibly instead
of recycling facts or fabricating research. A paid research model was not enabled.

Credential refresh/expiry and provider/network failures remain possible; inspect
the failed Actions run and persistent edition `events.jsonl`. Renew OAuth through
the existing setup procedure and update the encrypted secret when necessary.
Never delete topic/upload state to retry. Set `JAPAN_EXPLAINED_DAILY_ENABLED=false`
to pause scheduling.

## Today's verified new edition

[`qYRzG6XMjUY`](https://www.youtube.com/watch?v=qYRzG6XMjUY): Andrew narration,
53.666667 seconds, 1080×1920, 26 caption groups, full decoding and timing checks
passed. Five representative frames were inspected; final listening remains
pending under owner-authorized private review. API readback confirmed the exact
destination channel and **private** visibility. Paid jobs: **0**.

Tests: 76 passed before the final koji-scene/queue-filter additions. Pure date
and reviewed-candidate regressions passed afterward. Koji diagram text bounds,
fact-pack review checksum and next-unused-topic selection also passed. Final full-suite rerun was
blocked by execution approval failure; sandbox execution hit temporary-directory
ACL failures. Run `python -m unittest discover -s tests -v` locally or the manual
`dry-run` Actions workflow before relying on unattended operation.
