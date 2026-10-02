# News edition pipeline implementation plan

Goal: build an operable, private-first news-video pipeline without paid jobs.
Architecture: standard-library Python CLI; locked, atomic per-edition JSON state;
separate evidence, script, render, and YouTube modules. Offline fixtures have an
explicit marker and can never reach a live upload. OAuth is an optional dependency.

1. Write failure tests for evidence freshness, duplicates, unsupported extracts,
   malformed scripts, captions, channel guards, upload reconciliation and approval.
2. Implement evidence fetching with HTTPS, source snapshots and exact extracted
   claims. Require human review of live evidence; matching text is provenance,
   not a guarantee of truth. Generate an attributed extractive script for free.
3. Render supplied narration with FFmpeg, validate streams, duration and captions,
   bind output SHA-256 and metadata to an immutable edition manifest.
4. Implement private resumable upload with session persistence before media transfer,
   bounded status reconciliation, wrong-channel guard and no automatic new session
   following uncertain initiation or expired sessions. Bind public approval to the
   exact manifest, video ID, channel and returned private upload.
5. Add CLI commands, manual-only Actions workflow, PowerShell/OAuth/recovery and
   cost documentation. Run unittest discovery and offline end-to-end dry run.

Constraints: no public upload during setup; no paid provider execution; fixtures
are separate from live inputs; reject failed editions at all downstream stages.
Review focus: crash between remote side effects and local save; expired sessions;
modified artifacts; credential/channel changes; source freshness after rendering.
