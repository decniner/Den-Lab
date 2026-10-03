# Japan Explained

**Neural narration update:** Azure Speech (verified F0 only) and optional
experimental edge-tts adapters now support live voice discovery, three local
auditions, exact preview selection, cached audio and native word events. See
[neural narration setup and current previews](docs/neural-narration.md). The
original uploaded edition remains intact. No new video is generated or uploaded
during voice selection. Azure credentials and verified publication rights are
required for the official full-edition path; a free allowance is not assumed to
grant publication rights.

English educational Shorts about one verified Japan fact, with original diagrams, normal-speed narration and captions derived from the final speech. Each completed edition must be 45–60 seconds, 1080×1920 H.264/AAC. Private is the only upload default. Public publishing is a separate command bound to the exact edition, rendered artifacts, channel and confirmed video ID.

**Current verification:** local fixture dry run succeeded. The resumed live Shinkansen edition has normal-speed narration, a **57.67-second 1080×1920 video**, 30 synchronized caption groups and an original thumbnail in [deliverables/japan-explained-20261003-shinkansen-v1](deliverables/japan-explained-20261003-shinkansen-v1). Full decoding and media checks passed; five representative frames were inspected. The official API confirmed video **`I1RIgNF444k`** on the intended channel with **private** visibility: [YouTube URL](https://www.youtube.com/watch?v=I1RIgNF444k). The user explicitly authorized private uploading without the pending listening check; the inspection truthfully records `audio_listened=false` and a private-only waiver. Public publishing still requires listening and its separate exact-edition approval. No paid jobs ran, and daily scheduling is disabled. The earlier research preview is retained as a historical artifact.

This first version is an editorially reviewed pipeline. The catalog contains 10 discovered topics across eight categories, but **only the first topic has a complete reviewed fact pack**. Subsequent selections fail clearly until another pack is researched and reviewed. It does not invent new facts or claim that quotation matching proves semantic truth. A named reviewer checks each claim and its interpretation; automated checks enforce evidence presence, independent publishers, review freshness, checksums and spoken claim coverage. Topic identities and aliases must describe the underlying fact, not just its title. Rewritten claims with deliberately changed identities still require editorial duplicate review.

Rendered video and narration remain in local deliverables and are excluded from Git so private editions are not published through the repository. The committed sample bundle contains the script, sources, captions, thumbnail and technical validation record.

## Windows PowerShell setup

Run in `Den-Lab\japan-facts-video` using a normal Windows desktop session. Python 3.12+ and Windows PowerShell 5.1 are required. Install FFmpeg/FFprobe from a trusted distribution and an English Windows speech voice. The offline tests need only Python; OAuth dependencies are separate.

```powershell
Set-Location C:\path\to\Den-Lab\japan-facts-video
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (-not (Test-Path -LiteralPath config.json)) {
    Copy-Item -LiteralPath config.example.json -Destination config.json
}
Add-Type -AssemblyName System.Speech
$voices = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }
$voices.Dispose()
ffmpeg -version
ffprobe -version
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m japan_facts dry-run --edition setup-fixture
```

Edit ignored `config.json`: set the exact `UC…` destination channel ID, token path, installed voice name, FFmpeg and FFprobe absolute paths if absent from PATH, and a font with required glyphs. The current account's previously verified destination is `UCcxnWEDK-VAuLEJCozxRHRA`; do not copy it if using another channel. Arial is the Windows default; DejaVu Sans supports offline Linux checks. Keep state/config outside a CI checkout. Use Windows paths with forward slashes in JSON or escaped backslashes.

Research and script providers are `reviewed-catalog` (live HTTPS) and `reviewed-template` (original, approved script). Speech supports official `azure-speech` with a verified F0 resource, optional experimental `edge-tts`, and explicitly selected legacy `windows-sapi`. Neural failures never fall back to desktop speech. Follow the [neural narration setup and rights checks](docs/neural-narration.md) before synthesis. The optional `reviewed-snapshot` research provider requires `source_snapshot`: a dated, attributed live source record captured within 24 hours with matching URLs and content checksums. The supplied snapshot records browser-reviewed excerpts and original notes, not a successful shell download. It expires; never silently substitute fixtures when a live fetch fails. Unsupported providers and paid Azure tiers fail before synthesis; there is no implicit spending authorization.

Use an installed voice whose output rights cover your intended distribution. The local adapter uses the operator's Windows installation and redistributes no voice binaries. A license description in configuration is an operator record, not a grant of rights. Listen to the result before accepting the chosen voice; revise narration text or select another appropriately licensed installed voice if quality or pronunciation is unsuitable.

## OAuth and secrets

An API key cannot upload. Enable YouTube Data API v3 in the Google Cloud project, configure the consent screen, add the authorized Google account as a test user if appropriate, and create an OAuth **Desktop app** client. Download the client JSON outside Git. Use the existing authorized token if its channel and scopes are correct; otherwise:

```powershell
.\.venv\Scripts\python.exe -m japan_facts oauth-setup --client-secrets C:\private\client_secret.json --token C:\private\youtube-token.json
```

Authenticate the intended channel. Configure `oauth_token` with that private path. The adapter requests `youtube.force-ssl`, supporting owned-channel inspection, recovery and publishing as well as upload. Tokens may expire or consent may be revoked; reauthorize rather than resetting edition upload state. Restrict local token/config access. Never commit client secrets, tokens, state or provider keys. Structured logs exclude token values and resumable session URLs; state contains those URLs and must be protected.

For Actions, use repository secret **`YOUTUBE_OAUTH_TOKEN`** containing the authorized token JSON, not the client JSON or API key. Add it through GitHub Settings → Secrets and variables → Actions, or `gh secret set YOUTUBE_OAUTH_TOKEN --repo decniner/Den-Lab < C:\private\youtube-token.json` from a shell supporting file redirection. PowerShell alternative: `Get-Content -LiteralPath C:\private\youtube-token.json -Raw | gh secret set YOUTUBE_OAUTH_TOKEN --repo decniner/Den-Lab`. Do not paste it into a command argument. Refreshing a temporary CI token does not update the repository secret; replace the secret after reauthorization when needed.

## Separate edition commands

The examples below use the venv interpreter. Every production command accepts global `--config` and `--state-root` **before** the command. Edition IDs are immutable; do not reuse a completed ID for different content.

```powershell
$edition = 'japan-explained-20261003-shinkansen'
.\.venv\Scripts\python.exe -m japan_facts research --edition $edition
.\.venv\Scripts\python.exe -m japan_facts script --edition $edition
.\.venv\Scripts\python.exe -m japan_facts render --edition $edition
.\.venv\Scripts\python.exe -m japan_facts validate --edition $edition
.\.venv\Scripts\python.exe -m japan_facts inspect --edition $edition
```

Research ranks surprise (30%), explanatory value (30%), source quality (25%) and visual potential (15%), then selects an uncovered fact in the next available category. Evidence requires at least two independent publisher groups, including an authoritative source. JR East archives describe an established system; they are not represented as new announcements. Each spoken segment names supporting claim IDs. Measurements, dates and translations require explicit evidence; the sample deliberately avoids fixed warning seconds or a guarantee of stopping before shaking. Sources, limited quotations, publication dates, verification time, review hash and claim mappings are saved in `claims-to-sources.json`.

`render` generates per-segment WAV and native word-event timings, concatenates unchanged speech, creates captions on that exact audio clock, and draws original vector scenes. It stops if narration is outside 45–60 seconds; revise and review the script instead of increasing speech rate. Validation checks codecs, geometry, duration, complete decoding, audio levels, caption overlap/reading speed and font bounds. It saves five representative frames and a 12-second audio sample. Review them and watch the video for clipping, pronunciation and factual visual accuracy before recording inspection:

```powershell
$videoSha = (Get-FileHash -LiteralPath "state\$edition\video.mp4" -Algorithm SHA256).Hash.ToLower()
.\.venv\Scripts\python.exe -m japan_facts inspect-media --edition $edition --reviewer 'Den' --approve-video $videoSha --audio-listened
.\.venv\Scripts\python.exe -m japan_facts upload-private --edition $edition
```

Private upload refuses an uninspected/changed render, stale verification or wrong channel. Its success log reports the **actual API-confirmed** ID, watch URL, visibility and upload status. Confirmed private uploading can precede completion of YouTube processing; processing failure is never success, and public publishing requires processed status. The thumbnail is an original vertical cover artifact; this version does not call `thumbnails.set`.

An owner can explicitly waive listening **for private upload only** by using `inspect-media --private-audio-waiver "Owner's explicit reason"` instead of `--audio-listened`, with the same exact video hash and named reviewer. This records listening as false and preserves the authorization reason. Do not infer a waiver without an explicit owner instruction. Public publishing rejects a waiver; actual listening must be recorded first.

For public publishing, inspect the already confirmed private edition to obtain `public_approval_token`. Approve that exact token and invoke the separate local command; it verifies the result through the API:

```powershell
.\.venv\Scripts\python.exe -m japan_facts inspect --edition $edition
.\.venv\Scripts\python.exe -m japan_facts publish-approved --edition $edition --approve-render EXACT_PUBLIC_APPROVAL_TOKEN
```

`prepare` combines live research, scripting, rendering and validation, then stops for inspection. `dry-run` exercises the fixture research/selection/script path and reports narration/render/upload as skipped. It never calls speech, FFmpeg, live news or YouTube and never produces a pretend video. `fixtures/` is deliberately separate from browser-verified live research and cannot be uploaded.

## Daily scheduling

The root `.github/workflows/japan-explained.yml` provides a manual offline workflow and production `prepare`/`upload-private` commands. Production requires a trusted Windows self-hosted runner labeled `japan-explained-windows`, a protected `youtube-upload` environment, installed Python/OAuth dependencies/FFmpeg/voice, and persistent storage. Run under an account whose installed SAPI voice works. Set repository variables `JAPAN_EXPLAINED_CONFIG` and `JAPAN_EXPLAINED_STATE_ROOT` to absolute persistent paths and the OAuth secret above. Config catalog paths should be absolute or point into the current checkout.

The daily cron is commented out. Only after a **real** researched, narrated, rendered, inspected, API-confirmed private edition succeeds may you enable `schedule_enabled` in configuration, set repository variable `JAPAN_EXPLAINED_DAILY_ENABLED=true`, and uncomment `0 22 * * *` (07:00 JST). The persistent `end-to-end.json` proof is written only after an API-confirmed private upload. Review additional fact packs before enabling. Daily runs prepare editions and stop for media inspection; private upload is then a separate manual workflow for that exact edition. Thus this version does **not** provide unattended daily uploads without review. No public-publishing workflow exists.

Permissions are `contents: read`; checkout does not persist Git credentials. Concurrency is edition-level, with persistent edition locks and a shared topic-selection/history lock protecting independent runner invocations. Keep persistent state backed up; Actions artifacts/caches are not the duplicate-prevention database. Do not allow untrusted PR code on the credentialed runner.

## Costs and recovery

Variable API cost per video: research/LLM **$0** (reviewed sources/template), speech **$0** within Azure F0 availability and quota (or incremental local SAPI for legacy editions), rendering **$0** incremental local FFmpeg, storage **$0** incremental on existing disk. F0 availability and service output rights must be verified separately; exceeding its quota stops synthesis rather than upgrading. Human editorial work, electricity, Windows licensing, hardware and CI runner hosting are excluded. Planning estimate: 5–30 MB MP4 plus roughly 2 MB WAV and several previews per 60-second edition; actual size is reported by the filesystem after rendering. YouTube quotas are limits, not a per-upload price estimate; inspect your project's current quota buckets. Any future paid LLM/TTS/render/storage adapter needs an explicit budget and authorization before implementation/execution.

- **Voice execution blocked:** test installed voices in a normal PowerShell session. For the current ignored local sample, run `python -m japan_facts retry-render --edition japan-explained-20261003-shinkansen-v1` from this worktree after fixing execution access. Retry accepts only a failed, never-uploaded edition with the exact reviewed script and intact research hashes. It regenerates speech/media and repeats all validation; it grants no upload success. Do not manually mark the edition validated.
- **Duration/readability failure:** edit the source fact pack's script, have every segment reviewed, update its review checksum, and create a corrected edition. A new underlying fact must get a new canonical identity; a retry of the same reviewed fact should retain its identity/history.
- **Missing future pack:** research the selected candidate, record independently sourced evidence and original script/scene choices, then approve its canonical content hash. This initial renderer has railway/earthquake diagram scenes; a different subject needs an appropriate reviewed visual adapter before rendering.
- **Stale research:** refresh accessible source records and editorial review, not just timestamps. Never use an expired snapshot or fixture as live verification.
- **Provider failure:** inspect `events.jsonl`; no paid fallback runs. Failed content stops the edition. State remains protected under the edition lock.
- **Resumable/ambiguous upload:** rerun `upload-private` for the same edition. It probes persisted sessions, persists returned IDs before readback and reconciles uncertain initiation against an edition marker. It never retries upload creation blindly. If no match or several matches exist, inspect the owned channel and retain state; do not delete its upload marker or reuse another state root. Recovery searches up to 500 owned uploads; an older unresolved match needs manual investigation.
- **Crash lock:** verify the PID in `.lock` is no longer active before removing that specific lock. Back up state first. Corrupt state must be restored from backup; it is never replaced with a guessed empty upload state.
- **Wrong channel/public restriction:** correct OAuth/config after checking the intended account. Unverified API projects may be restricted to private uploads regardless of requested visibility; public success requires actual public readback.

## Platform requirements checked 2026-10-03 JST

YouTube requires disclosure of meaningfully altered/synthetic content that appears realistic; illustrative diagrams and some production assistance do not require disclosure. This pipeline nevertheless explicitly labels synthetic narration/original illustrations and sets `status.containsSyntheticMedia=true` conservatively. Do not use generated scenes as documentary evidence or impersonate a real voice. See [YouTube disclosure guidance](https://support.google.com/youtube/answer/14328491).

Official OAuth is required. API projects created after 28 July 2020 that are unverified have private-only upload restrictions until audit. The current insert reference reports a Video Uploads quota bucket of 100 calls/day with one unit per call; verify the actual Cloud project allocation rather than relying on older quota examples. See [videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert) and [official resumable upload protocol](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol). Platform policies and allocations can change.

Tests cover unsupported claims, missing/duplicated publishers, stale review, malformed timing/provider data, repeated topics, provider timeouts, duration/caption/clipping failures, corrupt/locked state, wrong-channel protection, duplicate/ambiguous uploads, bounded resumable retries, and the exact-render public gate. Offline API fakes are separate from actual live research and uploads. See [verification record](docs/verification.md).
