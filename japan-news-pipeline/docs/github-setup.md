# GitHub Actions setup for Den-Lab

This project is under `japan-news-pipeline`; its repository workflow is
`.github/workflows/japan-news.yml`. All uploads are private. No public-publishing
command is run in CI. The daily schedule is initially commented out.

## Credentials

Follow the one-time local Google OAuth authorization in `gitlab-setup.md` to
produce `token.json`. In Den-Lab, Settings > Secrets and variables > Actions,
create repository secret **YOUTUBE_OAUTH_TOKEN** containing the complete token.json
text. An API key or downloaded client JSON is insufficient. Never commit the
token or paste it into an issue. Add repository variables:

| Name | Value |
|---|---|
| YOUTUBE_CHANNEL_ID | Exact intended UC... channel ID |
| NEWS_STATE_ROOT | Dedicated durable path, e.g. C:\JapanNews\state |
| NEWS_INBOX | Prepared-edition inbox, e.g. C:\JapanNews\inbox |
| MORNING_UPLOAD_ENABLED | false initially; true only after setup |

## Runner

Register a dedicated Windows self-hosted runner with the extra label
`japan-news-windows`. Install Python, FFmpeg/ffprobe on PATH and
`python -m pip install -r requirements-oauth.txt` under its service account.
Restrict durable directory ACLs to that account and administrators. Configure
the `youtube-upload` GitHub environment to allow deployments only from main.
For a public repository, do not run untrusted pull-request code on this runner;
this workflow has no push or pull_request trigger. Repository administrators
can change workflows and access runner credentials, so keep access restricted.

The durable token is seeded from the secret once and refreshed in place. The
same state survives runner checkout cleanup and prevents duplicate uploads.
Securely back it up; never export state as an artifact/cache. When deliberately
reauthorizing, replace the durable token while no job is active. A hosted runner
with disposable state is not used for uploads.

## Run and schedule

In Actions > Japan news private upload > Run workflow choose:

- `dry-run`: hosted offline tests and fixture validation; no YouTube credentials used.
- `current`: privately upload the checked October 2 edition. Its source freshness
  is limited to 48 hours, so this will fail after expiration rather than post old news.
- `morning`: upload today's producer-reviewed bundle from the durable inbox.

Use the inbox format and exact-video factual review fields in `gitlab-setup.md`.
Morning automation uploads prepared editions; it does not autonomously research,
narrate or render fresh daily videos. Missing or invalid editions fail.

After a successful manual upload, uncomment the schedule in the workflow and set
MORNING_UPLOAD_ENABLED=true. Cron `0 22 * * *` means approximately 07:00 Japan
time; GitHub schedules can be delayed. Keep the main branch protected. The
channel concurrency group and edition filesystem lock serialize uploads.

No paid generation service is invoked. Hosted test-run billing depends on your
GitHub plan; upload execution uses your own runner. Actual video IDs, URLs and
returned privacy are logged only after the API confirms them.
