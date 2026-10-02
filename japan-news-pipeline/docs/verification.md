# Local verification — October 2, 2026

Environment: Windows PowerShell, Python 3.14.8. Workspace initially empty.

- `python -m unittest discover -s tests -v`: 32 tests passed.
- `python -m compileall -q news_pipeline tools`: passed.
- `python -m news_pipeline --help`: all six requested commands plus inspect and OAuth setup listed.
- `python -m news_pipeline dry-run --edition local-final-fixture`: passed offline
  evidence, exact script and caption-plan validation. Report persisted under
  `state/local-final-fixture/dry-run-report.json`; logs under `events.jsonl`.
- Independent review identified retry-budget reset, incomplete private recovery
  and invalid-transition issues. Regression tests reproduced them; fixes passed
  the complete suite and the reviewer rechecked those changes.

The test suite uses local fictional fixtures and substitutes external boundaries.
It does not establish compatibility with live YouTube credentials. A test-suite
run required permission to access Python's temporary test directories on this
machine; tests themselves made no paid provider calls. Two early source-validation
tests were tightened to assert rejection before network access, and then reproduced
the missing guards without relying on a remote failure.

No narration was generated, no real video was rendered, and no video was uploaded
or published. FFmpeg/FFprobe are absent and OAuth is not configured. The dry-run
report says those steps were skipped and records null video ID, URL and visibility.
The optional Windows speech helper is provided but has not been exercised here.
Follow README.md for installation, editorial input and OAuth steps before live use.

Current YouTube policy and API restrictions were checked against official
disclosure, videos.insert, videos.update and resumable-upload documentation; source
links and implementation choices are documented in README.md.

## Subsequent rendered demo

After the user requested an actual video, a free portable FFmpeg 9.0.2 build was
downloaded from the publisher linked by ffmpeg.org and its archive SHA-256 matched
the publisher's checksum. Windows System.Speech generated real local narration.
The two WAV segments were joined and captions timed from their actual frame counts.

`deliverables/news-pipeline-demo.mp4` is a 9.84-second, 1280×720 fictional preview,
with a permanent “FICTIONAL DEMO - NOT REAL NEWS” label, real speech and burned
captions. Rendering, FFprobe stream/duration checks and full FFmpeg decode passed;
the exported preview frame was visually inspected. The actual media checksum and
validation report are in `deliverables/demo-validation.json`.

This is a rendered fixture preview, not verified live news. The earlier dry-run
reports remain unchanged. No paid jobs, YouTube upload or public publishing ran;
no real YouTube ID or URL exists. Portable binaries are workspace-local under
`.tools/` and do not change the computer's global PATH.
