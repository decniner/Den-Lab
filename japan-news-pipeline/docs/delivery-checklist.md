# Verified delivery and Windows setup

Verified October 3, 2026 JST. Working code is in `news_pipeline/`; a credential-free
configuration template is `config.example.json`. No paid provider is required:
scripts use reviewed source extracts, sample speech uses Microsoft Zira Desktop,
and rendering uses FFmpeg/libass. Paraphrased sample editions are manually checked
against primary sources; source references alone do not automatically verify truth.

## Sample edition

`deliverables/ai-news-20261003/` contains `script.json`, `sources.json`,
`source-notes.md`, `captions.json`, `thumbnail.png`, `narration-80s.wav`,
`ai-news-80s-tiktok.mp4`, and `validation.json`. The thumbnail is an original
720x1280 PNG cover extracted from the rendered opening, with captions removed.
It has been visually inspected. It has not been uploaded as a YouTube thumbnail.

The video was fully decoded again during this verification: 80 seconds, 1080x1920,
H.264/AAC, valid caption intervals and matching video/script/source checksums.
Primary sources were checked during production; the acceptance check validates
the preserved source records and freshness, not a new independent live investigation.

YouTube ID `Bo7NSIMN3sM`, https://www.youtube.com/watch?v=Bo7NSIMN3sM.
The original API upload/readback at 2026-10-02T15:57:17 UTC confirmed `private`.
A read-only API check during this acceptance verification returned `public` and
`processed`, with the expected channel `UCcxnWEDK-VAuLEJCozxRHRA`.
No publishing or visibility mutation was performed during this verification.

## Windows PowerShell

Open PowerShell in this project folder (for the repository checkout, first
`Set-Location .\japan-news-pipeline`). Install Python 3.12 or later. Then:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-oauth.txt
if (-not (Test-Path -LiteralPath config.json)) {
    Copy-Item -LiteralPath config.example.json -Destination config.json
}
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
$edition = 'offline-' + [guid]::NewGuid().ToString('N')
.\.venv\Scripts\python.exe -m news_pipeline dry-run --edition $edition
```

No activation-policy changes are needed. Install FFmpeg and FFprobe with libass
from https://ffmpeg.org/download.html and add their `bin` directory to PATH.
Check `ffmpeg -version`, `ffprobe -version`, and
`ffmpeg -filters | Select-String 'ass|subtitles'`. The current local workspace
also has a portable build under `.tools/ffmpeg`; that ignored directory is not
included in Git. To rerender the bespoke sample, its render.py currently uses
that portable build path; edit its FFMPEG/FFPROBE constants for your installed
build before running it on another machine. Run only before upload, or use a new
edition ID for a changed rendered edition.

The generic `render-video` command accepts separately supplied WAV narration
and timing JSON, and uses tools on PATH. For local Windows narration use the
sample `narrate.ps1`, which requires the Microsoft Zira Desktop voice:

```powershell
& .\deliverables\ai-news-20261003\narrate.ps1 -EditionDirectory .\deliverables\ai-news-20261003
.\.venv\Scripts\python.exe .\deliverables\ai-news-20261003\render.py
```

These are production commands, unlike dry-run. Do not rerun them against an
edition already bound to an upload; copy inputs into a new edition first and
update the edition IDs/title/filenames in the script and renderer.

## Configuration and credentials

Edit `config.json`: `channel_id` is the exact intended UC... ID; `source_hosts`
lists exact approved publisher hostnames; `oauth_token` points to the private
local authorized token. Never commit config.json, token.json, client JSON or state.

If local OAuth is missing:

1. In Google Cloud create/select a project and enable YouTube Data API v3.
2. Configure the OAuth consent screen and add your account as a test user if
   using Testing mode. Create a Desktop app OAuth client and download its JSON
   as `client_secrets.json` in this folder.
3. Run `.\.venv\Scripts\python.exe -m news_pipeline oauth-setup --client-secrets client_secrets.json --token token.json`.
4. Authorize the intended YouTube channel in the browser. Set its exact channel
   ID in config.json. Upload checks the authenticated channel before inserting.

An API key or unapproved OAuth client JSON cannot authorize an upload. Local
OAuth worked for the sample. GitHub secrets and runner configuration have not
been verified as configured; no scheduled production run is claimed.

For Den-Lab, create Actions repository secret `YOUTUBE_OAUTH_TOKEN` containing
the complete authorized token.json text. Add repository variables
`YOUTUBE_CHANNEL_ID`, `NEWS_STATE_ROOT`, `NEWS_INBOX`, and
`MORNING_UPLOAD_ENABLED=false`. Register a dedicated Windows self-hosted runner
labelled `japan-news-windows`, install Python/FFmpeg and OAuth requirements under
its service account, and create the `youtube-upload` environment restricted to
main. Exact details and inbox JSON are in [GitHub setup](github-setup.md) and
[GitLab alternative](gitlab-setup.md).

Preserve the original absolute state and artifact paths for uploaded editions.
Do not invoke `current` for this uploaded sample on a fresh runner state root:
separate empty states cannot guard against a prior upload. Use the original
durable state or a fresh, reviewed edition. Morning mode requires today's dated
ready.json with reviewer, timestamp, and the exact approved video checksum.
It uploads prepared editions; it does not independently research or produce them.
The daily schedule remains disabled. Public publishing is always separate.

## Verification evidence and limits

All 50 fixture-based tests passed at 2026-10-02T16:09 UTC. Relevant tests:

| Requirement | Test |
|---|---|
| Unsupported claims | test_missing_source_and_unsupported_claim; test_model_output_cannot_add_claims |
| Repeated stories/topics | test_duplicate_id_title_and_claim |
| Provider failures | test_provider_failure_has_bounded_retries |
| Render failures | test_render_failure; test_actual_render_timeout_fails |
| Wrong channel | test_wrong_channel_protection; test_wrong_channel_change_is_rejected |
| Duplicate uploads | test_duplicate_upload_returns_existing_checked_video; test_private_upload_duplicate_protection_survives_import |
| Ambiguous upload | test_ambiguous_initiation_never_creates_second_session; test_lost_final_chunk_response_recovers_video |
| Public approval | test_public_gate_binds_exact_manifest; test_publish_approved_exact_edition |

Repeated-topic checks compare normalized IDs, titles, exact claims and reused
source URLs within an edition. They do not detect every semantic paraphrase or
maintain a historical cross-edition topic classifier. Provider tests mock failures;
they do not claim a live external LLM or paid speech request succeeded.

The end-to-end fixture dry run `acceptance-offline-20261003-1608` passed news,
script and caption-plan validation. Its report explicitly records narration,
rendering, video validation and uploading as skipped, public publishing blocked,
and video ID/URL/visibility null. A copy is under `examples/acceptance-dry-run.json`.
The actual sample render and API check above are separate production evidence.

Costs: paid LLM $0, local speech $0, local rendering $0 API fees, local storage
$0 service charges. Final MP4 is about 2.8 MB; audio, previews and source artifacts
use additional local disk. Electricity, runner hosting, backups and GitHub plan
charges depend on your infrastructure. No paid generation job was started.

Keep state after failures, resume the same edition, and reconcile ambiguous
uploads before any new insert. Never delete state to force reupload. Recovery
procedures are in README.md and gitlab-setup.md. Source freshness expires after
48 hours; an expired sample remains an archive and is blocked from new upload.
