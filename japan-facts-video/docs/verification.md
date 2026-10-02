# Verification record — 2026-10-03 JST

## Verified outputs

- `python -m unittest discover -s tests -v`: **50 tests passed**, exit 0, on the local Windows Python interpreter at 2026-10-02 17:33 UTC. Tests ran outside the restricted temporary-directory context using an already authorized test command. Evidence/state preservation and conflicting animation tags were reproduced by failing regressions before fixes.
- `python -m japan_facts dry-run --edition local-fixture-20261003`: exit 0. Ten candidates ranked; fixture evidence and reviewed template passed. Actual narration, rendering, media validation, upload and public publishing were explicitly skipped/blocked. The report has null video ID/URL/visibility and is saved with the sample bundle.
- Live fact-pack review: JR East primary operator documents, USGS specialist explanation and JMA limitations were checked through the browsing tool. A separately attributed, dated excerpt snapshot records that provenance. The direct shell HTTPS fetch failed; no direct-fetch success is claimed. The successful live research command used the explicit snapshot provider, and the source manifest records that choice.
- Original nine-segment, 139-word English script and claim mapping saved. On resume, the measured normal-speed narration was **57.665 seconds**.
- `python tools/preview.py`: exit 0. FFmpeg generated a 720×1280 original cover preview and five original scene previews. The cover, sensor and near-source-limit images were visually inspected for text readability and safe placement. All eight supported diagram scenes passed TrueType text-bound checks. The moving wave fronts no longer contain conflicting ASS position tags.
- Independent safety review confirmed the state-lock/corruption fix and found no remaining blocker in the reviewed private/public uploader gates, source-snapshot attribution or fact pack. This is code review, not a production upload test.

## Resumed production verification

The initial Windows System.Speech execution was blocked and escalation requests failed. On the user's resume request, authorized execution outside the restricted context succeeded. The local voice generated all nine WAV segments and word timings without changing speech rate. No paid provider was invoked.

- `retry-render --edition japan-explained-20261003-shinkansen-v1`: exit 0 at 2026-10-02 21:15 UTC. Final MP4 duration **57.666667 seconds**, 1080×1920 H.264/AAC, complete decode passed, mean audio **−16.6 dB**, 30 caption groups, tempo factor **1.0**.
- Exact video SHA256: `2c8bacc72367a270fc18a57fb72556c54ffd08c06b12874c5928012bd62bcb37`.
- All five representative frames at 2.88, 13.26, 27.10, 41.52 and 53.63 seconds were visually inspected. Phone-safe captions, mechanism diagrams and factual limitations were present and readable.
- The configured OAuth destination `UCcxnWEDK-VAuLEJCozxRHRA` was verified through the official API at 21:17 UTC. This was read-only; it is not an upload result.
- A WAV, MP4, caption JSON/SRT, source manifest, script, thumbnail and validation report are copied into the completed render bundle. Upload session URLs, credentials and mutable edition state are excluded.

The assistant interface reported that it does not support audio input. The owner subsequently instructed "Go ahead and upload", explicitly authorizing private uploading without the pending listening check. Inspection records `audio_listened=false` and a separate private-only waiver bound to the unchanged exact render. At 2026-10-02 21:47 UTC, the official API confirmed **`I1RIgNF444k`**, the intended channel, **private** visibility and `uploadStatus=uploaded`: https://www.youtube.com/watch?v=I1RIgNF444k. This confirms transfer/readback; it does not assert completed processing. Public publishing and schedule activation have not run. MP4/WAV/MP3 media remain local and excluded from Git.

The three waiver regressions were observed failing before implementation and passing afterward. The full suite passed **53 tests** at 21:36 UTC. Independent review found no blocker: private waiver is not a listening attestation and cannot satisfy the public-publishing gate. At 21:49 UTC, a repeated upload-private invocation read back the same saved ID with private visibility and **processed** status, confirming recovery without another upload. The persistent `end-to-end.json` records the API-confirmed private upload, while configuration and the daily cron remain disabled.

## Inspect or recover the current local sample

The current edition is already uploaded privately; do not rerender it or create a different upload state. In a normal PowerShell session, enter this task's `japan-explained-worktree\japan-facts-video`. Its ignored configuration references the private authorized token and local FFmpeg tools. After actually listening, the optional inspection update below can replace the private-only waiver with a listening attestation. Repeating `upload-private` reads back the saved video ID; it does not create another upload:

```powershell
..\..\.venv\Scripts\python.exe -m japan_facts inspect-media --edition japan-explained-20261003-shinkansen-v1 --reviewer 'Den' --approve-video 2c8bacc72367a270fc18a57fb72556c54ffd08c06b12874c5928012bd62bcb37 --audio-listened
..\..\.venv\Scripts\python.exe -m japan_facts upload-private --edition japan-explained-20261003-shinkansen-v1
```

Do not use `--audio-listened` without actually listening. Verify the API-confirmed ID and private visibility. Public publishing remains a separate exact-edition command. For a future failed render, `retry-render` checks the original reviewed pack, source manifest and exact script, refuses any edition with upload state and repeats all validation.

The live source snapshot expires after 24 hours; additional editions require renewed live retrieval/review. The source manifest's upload freshness limit is 30 days. The existing failed edition and reserved fact history remain intact in ignored persistent state; never delete them to bypass duplicate prevention. A private upload proof now exists, but daily scheduling remains disabled pending additional reviewed fact packs and explicit enablement.
