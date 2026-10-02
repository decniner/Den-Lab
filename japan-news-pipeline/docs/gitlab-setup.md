# Private YouTube upload and GitLab morning workflow

The real edition is `deliverables/japan-news-20261002/japan-news-80s-tiktok.mp4` (80 seconds, 1080x1920). No upload or GitLab schedule has been performed: channel ID, Google OAuth authorization, and GitLab project are missing.

## One-time local authorization

1. In Google Cloud create a project, enable YouTube Data API v3, configure its OAuth consent screen, and create a **Desktop app** OAuth client. Download its JSON to `client_secrets.json`; do not commit it.
2. In Windows PowerShell at this project root run:

```powershell
python -m pip install -r requirements-oauth.txt
python -m news_pipeline oauth-setup --client-secrets client_secrets.json --token token.json
```

Authorize the intended channel in the browser. Obtain its exact `UC...` channel ID from YouTube advanced account settings. Create `config.json` containing `{"channel_id":"UC_YOUR_CHANNEL_ID","oauth_token":"token.json"}`. The API checks the authenticated channel against that ID before inserting a video.

```powershell
python -m news_pipeline upload-rendered --edition japan-news-20261002-en --bundle deliverables/japan-news-20261002
```

This imports the checksum-bound edition, decodes the full video again, checks 48-hour source freshness, uploads **privately**, and confirms the returned video ID and privacy through the API. Retry this same command with its original state intact. Expired news fails; prepare a new edition rather than bypassing freshness. Public publishing remains a separate `publish-approved` command with the exact edition approval token; GitLab never calls it.

## GitLab runner and schedule

Push this workspace, including the rendered bundle, to your chosen private GitLab project. Install a dedicated [Windows shell runner](https://docs.gitlab.com/runner/install/windows/), Python and FFmpeg/ffprobe, and the OAuth requirements under its service account. Tag it `japan-news-windows`, lock it to this project, restrict it to protected branches, and protect the default branch. Use a trusted machine and service account; shell jobs have access to that account's files.

Under Settings > CI/CD > Variables add protected variables:

| Variable | Value/type |
|---|---|
| `YOUTUBE_CHANNEL_ID` | Exact intended `UC...` ID |
| `YOUTUBE_OAUTH_TOKEN` | **File** variable containing authorized token.json; conceal in logs |
| `NEWS_STATE_ROOT` | Durable absolute path, e.g. `C:\JapanNews\state` |
| `NEWS_INBOX` | Durable absolute path, e.g. `C:\JapanNews\inbox` |

Restrict ACLs for the state directory to the runner account and administrators. The refreshed OAuth token, resumable session, and edition states remain there across checkout cleanup. Back it up securely. Never cache or export this directory as a CI artifact. The file variable seeds the token only once; after reauthorization replace the durable token deliberately while no job is running. Google consent screens in Testing can issue short-lived refresh tokens; configure the appropriate production consent/verification before relying on unattended operation.

Build > Pipelines > New pipeline on the protected branch, set `UPLOAD_MODE=current`, then start the manual job to upload this edition. It checks existing state to prevent a second upload. Default mode is `dry-run`.

Create a [pipeline schedule](https://docs.gitlab.com/ci/pipelines/schedules/) under Build > Pipeline schedules: cron `0 7 * * *`, timezone `Asia/Tokyo`, protected default branch. It is initially disabled. After a successful manual run, add schedule variable `MORNING_UPLOAD_ENABLED=true` and activate the schedule. The 07:00 time is a proposed default; change it to your chosen morning time. `.gitlab-ci.yml` cannot create the schedule by itself. The schedule runs with its owner's permissions; do not supply a GitLab API token to the upload job.

## Fresh edition inbox

This workflow automates **uploads of prepared editions**, not independent daily reporting. Verified news, source review, narration and a validated 80-second render must be prepared each morning by a producer. It never presents yesterday's video as today's news. The generic reviewed-extract pipeline does not automatically generate the bespoke 80-second news format.

For Japan date `2026-10-03`, place the complete bundle in `C:\JapanNews\inbox\2026-10-03\bundle`. Add `ready.json` beside that folder:

```json
{"edition":"japan-news-20261003-en","bundle":"bundle","reviewed_by":"YOUR_NAME","reviewed_at":"2026-10-03T06:45:00+09:00","approved_video_sha256":"EXACT_VIDEO_SHA256_FROM_VALIDATION"}
```

The bundle must contain the fixed video filename `japan-news-80s-tiktok.mp4`, script.json, sources.json, captions.json, validation.json, and optionally narration-80s.wav. Validation binds the video/script/source checksums and live edition ID. Source references alone do not prove a claim: the producer must fact-check every paraphrase against the listed articles before placing the edition in this inbox. Missing today's edition, stale sources, invalid media or altered checksums fail the job. No paid service is started. The same resource group serializes jobs for this channel, while each edition has a filesystem lock and persistent upload state.

## Recovery and costs

Keep original edition state after any timeout. Rerun the same edition; the uploader probes its resumable session and reconciles ambiguous uploads before considering any new insertion. A missing ambiguous match blocks further insertions for operator investigation. Never delete state to force a retry. Remove a stale `.lock` only after confirming its PID is no longer running. Move state and its bundled artifacts together with a backup; paths currently bind artifacts to their original location.

Existing video production used local script preparation, Windows speech and FFmpeg: $0 in paid API jobs. Private upload has no direct YouTube API charge but consumes quota; storage is approximately 3 MB for the final MP4 plus source/audio/state files. Runner hosting, electricity and backups depend on your infrastructure. A GitLab-hosted Windows runner is not assumed or purchased. See README for the original pipeline's other cost estimates and YouTube disclosure rules.
