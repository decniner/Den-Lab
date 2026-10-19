---
name: youtube-upload
description: Upload an existing local video to Den's configured YouTube channel when asked to upload a file, with private visibility and verified results. Does not generate videos or publish publicly.
---

# YouTube private upload

Use this skill for requests such as `$youtube-upload "C:\path\video.mp4"`. The request authorizes that private upload; do not ask again for routine confirmation. Creating or installing the skill does not authorize additional uploads.

This skill reuses the existing Japan Explained uploader in:
`C:\Users\DenDev\Documents\Codex\2026-10-02\check-current-youtube-requirements-for-synthetic-content`.
Set the workspace as the current directory first, then use its `.venv\Scripts\python.exe`:

```powershell
Set-Location 'C:\Users\DenDev\Documents\Codex\2026-10-02\check-current-youtube-requirements-for-synthetic-content'
.\.venv\Scripts\python.exe .tools/upload-requested-video.py 'C:\path\video.mp4' --title 'Accurate title' --synthetic-media yes
```

Optional arguments: `--description-file 'C:\path\description.txt'` (UTF-8) and `--check-only` (validate and verify channel without uploading; OAuth can refresh).

If the preflight reports an expired, revoked, or invalid OAuth token, invoke the `token-refresh` skill as part of the user's already-authorized upload request. Follow that skill to renew the existing token for the configured account; pause only when the user must complete password, MFA, CAPTCHA, or consent steps. Do not start an upload while authentication is unresolved. After refresh, rerun this helper with `--check-only` and confirm the configured channel. If that passes, resume the same requested upload once. If refresh or preflight still fails, stop and report the sanitized blocker. Never switch accounts or OAuth clients. The helper suppresses raw exception details in its terminal output.

Determine `--synthetic-media yes|no` from the video's provenance. Check current YouTube disclosure requirements when uncertain. Do not assume every incoming video is synthetic. Inspect supplied source notes for accurate metadata without inventing claims or asserting independent research verification.

The helper validates complete video decoding, verifies the configured OAuth destination channel, uploads privately with bounded resumable retries, and persists recovery state under `japan-neural-worktree/japan-facts-video/state`. It identifies matching existing editions by file SHA-256 to prevent renamed files from creating duplicates. Keep the state and locks; ambiguous uploads must be resumed/reconciled, never discarded to force a fresh upload. Do not run concurrent uploads of the same file.

Credentials remain in existing local config/OAuth files. Never display the full configuration, tokens, upload session URLs, or raw exception traces. Stop on failures; report the sanitized error category and precise blocker when known. Missing authentication requires the existing OAuth setup; never silently change accounts. Existing speech configuration is loaded by this adapter; report an incompatible configuration rather than changing it.

Visibility must remain private. The existing adapter restores unexpected visibility only after verifying channel ownership. This skill has no public publishing command. Do not rerun a previously public edition through this skill unless the user explicitly authorizes making it private.

Report the actual API-confirmed video ID, URL, privacy, and duration. Distinguish an uploaded video still processing from a processed video. Do not claim audio listening, subjective quality review, or verified facts based only on upload checks.

This skill depends on the original workspace and its uploader rather than embedding credentials or copying the pipeline. If that workspace moves, locate it and update this reference before running.
