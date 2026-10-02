# Verification record — 2026-10-03 JST

## Verified outputs

- `python -m unittest discover -s tests -v`: **50 tests passed**, exit 0, on the local Windows Python interpreter at 2026-10-02 17:33 UTC. Tests ran outside the restricted temporary-directory context using an already authorized test command. Evidence/state preservation and conflicting animation tags were reproduced by failing regressions before fixes.
- `python -m japan_facts dry-run --edition local-fixture-20261003`: exit 0. Ten candidates ranked; fixture evidence and reviewed template passed. Actual narration, rendering, media validation, upload and public publishing were explicitly skipped/blocked. The report has null video ID/URL/visibility and is saved with the sample bundle.
- Live fact-pack review: JR East primary operator documents, USGS specialist explanation and JMA limitations were checked through the browsing tool. A separately attributed, dated excerpt snapshot records that provenance. The direct shell HTTPS fetch failed; no direct-fetch success is claimed. The successful live research command used the explicit snapshot provider, and the source manifest records that choice.
- Original nine-segment, 139-word English script and claim mapping saved. Spoken duration is **not measured** because no final speech exists.
- `python tools/preview.py`: exit 0. FFmpeg generated a 720×1280 original cover preview and five original scene previews. The cover, sensor and near-source-limit images were visually inspected for text readability and safe placement. All eight supported diagram scenes passed TrueType text-bound checks. The moving wave fronts no longer contain conflicting ASS position tags.
- Independent safety review confirmed the state-lock/corruption fix and found no remaining blocker in the reviewed private/public uploader gates, source-snapshot attribution or fact pack. This is code review, not a production upload test.

## Blocked or untested production output

Windows System.Speech reported no usable voice in the coding session's restricted security context. Requests to execute local speech outside that context returned `approval request failed`; no detailed rejection reason was supplied. The existing account's OAuth token is available privately, but there is no new narrated video to upload. No paid provider was invoked as a fallback.

The sample therefore has **no completed WAV, synchronized captions, measured 45–60-second video, audio listening check, full-video decode result or YouTube video ID**. Only research/script/diagram preview output is delivered. Private/public API behavior is covered by clearly separate fake-response tests; no Japan Explained upload or public publish is claimed.

## Resume the current local sample

In a normal PowerShell session, enter this task's `japan-explained-worktree\japan-facts-video`. Its ignored configuration already references the private authorized token and local FFmpeg tools; do not commit it. Verify installed voices, then use the outer workspace's OAuth-enabled interpreter:

```powershell
..\..\.venv\Scripts\python.exe -m japan_facts retry-render --edition japan-explained-20261003-shinkansen-v1
```

Retry checks the original reviewed pack, source manifest and exact script, and refuses any edition with upload state. It repeats generation and validation and stops on duration/caption/media failure. Inspect `preview-1.jpg` through `preview-5.jpg`, listen to `audio-sample.mp3` and watch `video.mp4`. Only then record the exact video inspection and invoke `upload-private` as documented in the README. Verify the API-confirmed ID and private visibility. Public publishing remains a separate exact-edition command.

The live source snapshot expires after 24 hours; additional editions require renewed live retrieval/review. The source manifest's upload freshness limit is 30 days. The existing failed edition and reserved fact history remain intact in ignored persistent state; never delete them to bypass duplicate prevention. No end-to-end proof exists yet, so daily scheduling must remain disabled.
