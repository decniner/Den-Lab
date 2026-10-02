# Reviewed news video pipeline

For this Den-Lab repository use [GitHub Actions setup](docs/github-setup.md).
The private upload workflow is at the repository root in
`.github/workflows/japan-news.yml`. Google authorization and runner setup are
required; the daily schedule starts disabled.

The real 80-second Japan video is in `deliverables/japan-news-20261002/japan-news-80s-tiktok.mp4`.
For uploading this exact render and configuring the private GitLab morning workflow,
see [GitLab and OAuth setup](docs/gitlab-setup.md). Neither an upload nor a live
schedule has been confirmed; both require your account configuration.

Python CLI for making source-backed editions, rendering a captioned video, and
uploading privately. Public publishing is a separate explicit command bound to
the rendered files, metadata, channel and confirmed video ID. No paid services
are invoked. The initial GitHub workflow runs offline tests and a fixture dry run.

This is a conservative extractive implementation: you select and fact-check the
news, the command fetches source pages and checks that every spoken claim is an
exact source extract, and a free local generator builds the script. It does not
discover breaking news autonomously, independently establish truth, or paraphrase
with an LLM. Source excerpts still need editorial review for context, attribution,
publication dates and rights to reuse. Provider secrets are not needed for the
offline commands. Source page JavaScript, paywalls and incompatible HTML can cause
verification to fail; supply a readable canonical source rather than bypassing it.

## Windows PowerShell setup

Use Python 3.12 or later. The core pipeline and its tests use the standard library.

```powershell
py -m venv .venv
# Activation is optional; these commands use the interpreter directly.
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
Copy-Item -LiteralPath config.example.json -Destination config.json
.\.venv\Scripts\python.exe -m news_pipeline dry-run --edition first-fixture
```

For live rendering install FFmpeg with FFprobe and the `subtitles` filter (libass),
using a Windows build linked from the [official FFmpeg download page](https://ffmpeg.org/download.html).
Add its `bin` directory to PATH, reopen PowerShell, and check:

```powershell
ffmpeg -version
ffprobe -version
ffmpeg -filters | Select-String subtitles
```

In `config.json`, set `channel_id` to the exact `UC...` ID from your channel's
advanced settings, set `source_hosts` to the approved publishers' exact hostnames,
and set `oauth_token` to your local token path. Configuration has no paid providers.
The example source is illustrative, not a recommendation of a particular topic.

## Commands

Global options `--config` and `--state-root` go **before** the subcommand.
Run these stages explicitly; there is no full live command that can publish.

```powershell
# 1. Fetch readable source pages and validate fresh, reviewed extracts.
python -m news_pipeline fetch-news --edition news-20261002-a --input my-news.json

# 2. Generate a supported extractive script locally, at zero API cost.
python -m news_pipeline generate-script --edition news-20261002-a

# 3. Render supplied narration and validate video/audio/captions.
python -m news_pipeline render-video --edition news-20261002-a --audio narration.wav --captions timing.json --title "Reviewed news — October 2"

# 4. Upload privately. Repeating this resumes/reconciles or reads the existing ID.
python -m news_pipeline upload-private --edition news-20261002-a

# Inspect the local manifest, review the full MP4 and its private YouTube playback.
python -m news_pipeline inspect --edition news-20261002-a

# 5. ONLY after approving that exact edition, copy its approval token here.
python -m news_pipeline publish-approved --edition news-20261002-a --approve-render EXACT_TOKEN_FROM_INSPECT

# 6. Full offline orchestration; no speech/render/upload side effects.
python -m news_pipeline dry-run --edition offline-check-001
```

`inspect` reports local state, not current remote visibility. Upload and publish
commands emit `video_confirmed` only after checking the API result and reading the
video back: real `video_id`, watch `url`, `returned_visibility` and `upload_status`.
Upload completion can precede YouTube processing; publishing waits for `processed`.
There is no default public setting, scheduled `publishAt`, or automatic approval.
The token is an explicit operator confirmation, not a multi-user authorization
system: someone with both OAuth credentials and local access can approve editions.
Never automate token retrieval followed by public publishing.

### Preparing real news

Copy `examples/news-input.json` to `my-news.json` and replace every placeholder.
Each story requires a stable ID, reviewed title, timezone-aware source publication
time, HTTPS source URLs, and claims of 10–500 characters copied exactly from those
sources. `source: 0` refers to the first source in that story. A named human reviewer
must record `reviewed_by` and `reviewed_at` after confirming the content and date.
Reviews and stories must be no older than 48 hours; future timestamps over five
minutes ahead are rejected. Changing a date to make stale news appear fresh is not
verification. Sources are fetched again from the allowlist; supplied live `text`
fields are ignored. Snapshots, fetch timestamps and SHA-256 values are persisted.

The pipeline rejects duplicate story IDs, normalized titles, source URLs across
stories, and repeated claim text within an edition. Similarity across differently
worded articles and repeats across separate editions require editorial review;
there is no global semantic deduplication service. Keep edition IDs stable so the
same edition can never be intentionally recreated under a different name.

The optional `generate-script --model-output output.json` validates an external
model response against the complete verified extractive schema. Changed or added
claims, omitted segments, unexpected fields and malformed JSON fail the edition.
It does not call an LLM or authorize anyone to incur provider costs.

### Free local narration and measured captions

You may record narration yourself and provide a caption JSON array with one entry
per script segment, for example:

```json
[{"start": 0.0, "end": 5.0, "text": "The exact verified sentence from the script."}]
```

Or use the installed Windows `System.Speech` voice. This optional helper generates
one real WAV per sentence; Python joins them and measures the frame boundaries.
Run it in **Windows PowerShell 5.1** (`powershell.exe`), where System.Speech is supported:

```powershell
powershell.exe -NoProfile -File tools\narrate.ps1 -ScriptPath state\news-20261002-a\script.json -OutputDirectory state\news-20261002-a\speech
if ($LASTEXITCODE -ne 0) { throw 'Local speech generation failed.' }
python tools\join_narration.py --script state\news-20261002-a\script.json --segments state\news-20261002-a\speech --audio narration.wav --captions timing.json
if ($LASTEXITCODE -ne 0) { throw 'Narration assembly failed.' }
```

This provides sentence boundaries, not word-level forced alignment. Listen to the
audio and inspect the full rendered video. Default captions must be nonempty,
ordered, non-overlapping, inside the narration duration and at most 25 characters
per second; they must match every script segment exactly. Rendered media is 720p,
25 fps H.264/AAC with burned captions over a plain background. FFprobe checks both
streams, dimensions and duration, followed by a complete decode with FFmpeg.
These checks do not replace listening for speech quality or visually checking
caption wrapping and attribution. Arbitrary supplied audio is not transcribed;
the operator is responsible for ensuring its words match the approved script.

## YouTube OAuth setup

1. Create a Google Cloud project and enable **YouTube Data API v3**.
2. Configure its OAuth consent screen. Add your Google account as a test user
   while in testing mode; choose the YouTube channel/Brand Account deliberately.
3. Create an OAuth client of type **Desktop app**. Download its JSON to
   `client_secrets.json` in this project. Do not commit it.
4. Install the optional authentication dependencies and run the browser flow:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-oauth.txt
.\.venv\Scripts\python.exe -m news_pipeline oauth-setup --client-secrets client_secrets.json --token token.json
```

The browser flow has a 180-second timeout. The scope is
`https://www.googleapis.com/auth/youtube.force-ssl`, needed for owned-channel
readback/reconciliation plus upload and updating visibility. Upload-only scope
is insufficient for this complete workflow. OAuth consent verification and the
YouTube API compliance audit are separate processes. External testing tokens may
expire; reauthorize when refresh fails. Protect `token.json`: it contains a refresh
token. Do not include tokens or session URLs in logs, issues, reports or artifacts.

Every live mutation rechecks `channels.list(mine=true)` and requires exactly the
configured channel. A mismatch, missing token, unavailable video or unexpected
API response blocks success. Changing configuration cannot repoint an edition
created for another channel.

## Policy checked October 2, 2026

YouTube requires disclosure for realistic AI-generated or meaningfully altered
content, including a real person shown doing something they did not do, altered
real events/places, and realistic scenes that did not occur. Its current help page
also discusses AI audio and music and distinguishes production assistance and
minor/non-realistic edits. Review your edition against the full
[YouTube disclosure guidance](https://support.google.com/youtube/answer/14328491?hl=en).
This pipeline conservatively sets `status.containsSyntheticMedia=true`; that is
a pipeline choice, not a claim that every use of scripting or local speech legally
requires a label. It does not impersonate a real person or generate event footage.

The [videos.insert documentation](https://developers.google.com/youtube/v3/docs/videos/insert)
allows that disclosure field and says uploads from unverified API projects created
after July 28, 2020 are restricted to private viewing until an audit is completed.
An approval token cannot override that restriction. Public publishing may therefore
fail, leaving the private edition intact. The adapter follows the
[resumable upload protocol](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol)
and uses [videos.update](https://developers.google.com/youtube/v3/docs/videos/update)
for a separately approved visibility change. Check the official pages before
deployment because policies, quotas and restrictions can change.

## Costs

No paid provider is configured, and no paid job was started. For a five-minute
edition, the implementation's direct service charges are:

| Stage | Default | Estimated direct charge/video |
|---|---|---:|
| LLM | Local extractive Python generator | $0 |
| Speech | Installed Windows voice or your supplied recording | $0 API charge |
| Rendering | Local FFmpeg | $0 API charge |
| Storage | Existing local disk, about 50–150 MB plus source/audio files | $0 incremental hosting charge |

Electricity, hardware, internet, editorial time, third-party content rights and any
GitHub runner usage are additional. As an illustrative electricity calculation,
100 W for ten minutes at $0.30/kWh costs about $0.005. Actual render time and file
size vary. Speech quality will be lower than many paid voices.

For future paid providers, first approve the provider, job and spending cap.
Calculate LLM cost as `(input_tokens × input_price + output_tokens × output_price)
/ 1,000,000`; speech as `characters / 1,000 × price_per_1k_chars` (or minutes ×
price_per_minute); rendering as billed minutes × rate; monthly storage as retained
GB × rate plus egress. Example sizing is 8,000 input tokens, 1,000 output tokens,
4,000 spoken characters and 0.1 GB per edition. No paid-rate quote or paid provider
integration is included. The CLI cannot silently switch to one.

## State, retries and recovery

`state/EDITION/edition.json` is atomically replaced and flushed to disk. Each edition
has an exclusive `.lock` and a persistent `events.jsonl` log. A fetch creates its
state before touching the network. A factual/script/render validation failure marks
the edition `failed` and downstream operations refuse it; create a corrected new
edition rather than modifying failed artifacts. Render manifests bind the video,
script, source snapshot, audio and timings to SHA-256 hashes. Metadata changes also
invalidate the recorded manifest. Keep those files in place through publishing.

Source and read-only API requests have 20/30-second timeouts and at most three
attempts, with bounded exponential delays. FFprobe gets 30 seconds; rendering and
decode each get 600 seconds. Media failures are not automatically retried. Uploads
use 1 MiB chunks, 30-second request timeouts and a budget of three consecutive
transient failures; resumable-session state is saved before transferring media.

| Failure | Recovery |
|---|---|
| Source missing, stale, unsupported or malformed script | Fix editorial input and create a new edition ID. |
| Speech unavailable | Record narration or install an appropriate Windows voice; do not substitute dummy audio. |
| Render/decode/caption validation fails | Inspect inputs/FFmpeg; correct them and rebuild a new edition. |
| OAuth expired or wrong channel | Reauthorize for the intended channel; leave edition/upload state intact. |
| Chunk timeout or interrupted upload | Rerun `upload-private` for the same edition. It probes the saved session before resending bytes. |
| Final response lost | Probe the session; if completed, store the returned video ID and read it back. |
| Initiation response lost, session expired or HTTP 404/410 | Reconcile up to 500 recent owned-channel uploads by the exact edition marker. A unique match is read back; no match or multiple matches blocks a fresh upload. |
| Confirmed ID saved but readback failed | Rerun the same command to read that ID. No second insert is made. |
| Publishing response lost | Read back the same approved ID before any repeat update; already-public state is reconciled. |
| Crashed process left `.lock` | Verify the recorded PID is no longer running, then remove only that edition's `.lock`. |
| Corrupt or lost upload state | Restore a backup and manually inspect YouTube. Do not recreate state and guess that no upload exists. |

There is intentionally no “force reupload” switch. Unresolved initiation ambiguity
needs operator investigation; absence in a bounded playlist scan cannot prove
absence remotely. The edition marker is a description line of the form
`edition-sha256:HASH`. Do not remove it while resolving an uncertain upload.
Back up the whole state directory before moving work between machines. Concurrent
processes must use the same state root; separate copies cannot provide a shared
duplicate guard. Publishing requires the same unmodified rendered edition, the
same channel/video ID and the exact `inspect` approval token.

## Tests and GitHub Actions

```powershell
python -m unittest discover -s tests -v
python -m news_pipeline dry-run --edition another-offline-check
```

Tests are fixture-based and mock external API boundaries. They exercise stale and
future news, duplicate stories, missing sources, unsupported claims, malformed
scripts/reviews, provider failures, caption timing, render timeout, wrong channels,
ambiguous uploads, rejected processing, duplicate inserts, persisted IDs and the
exact-edition publishing gate. They never assert a live upload succeeded. Dry-run
reports distinguish caption-plan validation from actual media validation and leave
video ID, URL and returned visibility null.

`.github/workflows/pipeline.yml` exposes a manual workflow, `contents: read`, an
edition concurrency group and a ten-minute job timeout. Its daily schedule is
commented out initially. It only runs tests and fixture dry runs, so it consumes no
OAuth secrets. Do not enable a daily public-publishing job. If later adding a live
private-upload workflow, use repository secrets such as `YOUTUBE_OAUTH_TOKEN_JSON`
and `YOUTUBE_CLIENT_SECRETS_JSON`, materialize them only on the runner, never echo
them, and keep upload state in a durable protected store across runs. Current Actions
artifacts contain only dry-run reports, not upload sessions or tokens. GitHub's
concurrency group alone does not make ephemeral runner state a safe live uploader.
