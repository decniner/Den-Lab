# Production mechanics and reusable local setup

## Working reference

The example beside this skill is `../../brutal-truth-money-premium-v2/`, relative to this reference file. It demonstrates the pipeline, not a required script, fixed layout or topic. Reuse/adapt when available; this skill does not require that example to exist elsewhere.

Useful files:

- `generate_voice.py`: free Edge Andrew speech, word-boundary events and exact token validation.
- `render.py`: calculated original graphics, inset moving footage, independent footage fades, persistent karaoke phrases and per-frame text-box assertions.
- `verify.py`: MP4 header duration, complete decoding, geometry audit, actual caption-pixel checks, independent financial calculation, chronological and transition previews.
- `extra_qc.py`: original/export audio-envelope comparison, source-motion checks and silence detection.
- `calculate.py`: Decimal recurrence, closed-form check and independent power sum for illustrative finance mathematics.
- `assets/downloads.json` and `sources-and-licenses.md`: source pages, creators, resolved public download URLs, license and access dates.
- `quality-review.md`: separates evidence from unavailable subjective checks.

Adapt the final `render.py`, not `revise_renderer.py`; the latter records an initial adaptation and can overwrite later fixes. Save new work in a new project folder.

## Available environment hints

On the original Windows machine, existing dependencies are under:

```text
C:/Users/DenDev/Documents/Codex/2026-10-01/check-my-computers-bios-firmware-using-powershell-and-sh/.render-deps
C:/Users/DenDev/Documents/Codex/2026-10-01/check-my-computers-bios-firmware-using-powershell-and-sh/.edge-tts-temp
```

Inspect availability rather than assuming these paths exist. `imageio_ffmpeg.get_ffmpeg_exe()` finds the installed bundled FFmpeg. Pillow draws text and graphics. Installed Windows Bahnschrift and Segoe UI Bold were rasterized; do not redistribute their binaries. Do not turn environment paths into portable requirements. Free dependencies may be installed within the project when authorized.

## Caption invariant

For each phrase, display its complete text from phrase start until the next phrase starts, including pauses. Determine the active word using `start <= t < end`; if none is active, all words remain white. Keep the same font and word coordinates when changing color.

Blank caption frames arose when phrase visibility was limited to each word's speech interval. Overlapping text arose when old and new phrases were crossfaded. Prevent both with continuous coverage and exactly one phrase layer. A direct single-layer phrase replacement is acceptable; smoothness comes from stable placement and continuous visibility, not fading every spoken word.

The example uses 72 px bold captions at y=1380 and y=1472, text restricted to x=64..910 and y=70..1600, graphics around y=430..1220, and educational notes at y=1250/1296. Treat these as conservative example coordinates, not universal platform guarantees. Essential assumption/advice text was increased to 40 px after phone-preview review. Shorten text when needed; do not solve collisions by shrinking essential information into footnotes.

Register every authored text item's actual glyph bounding box and reject intersecting boxes or unsafe bounds on all rendered frames. Inspect actual exports too; geometry alone misses missing glyphs, excessive small print or embedded footage text.

## Footage and timing

Choose distinct shots for distinct purposes, keep subject motion, and avoid repeated loops. In the reference, three hands-only clips illustrate budgeting, expense tracking and earning capacity; financial explanations use original motion graphics. Their count is not a quota for future topics. Check source licenses and avoid implied endorsements or identifying people with irresponsible conduct.

Reframe carefully. Preserve full horizontal action in landscape footage when a crop would remove the subject. Use an inset or composed layout when appropriate. Record any enlargement of low-resolution media. Exclude source audio unless deliberately needed and licensed.

A fixed 2,400-frame 30-fps canvas produces 80 seconds. Footage can fade inside that canvas without changing duration. When assembling clips using overlapping cross-dissolves, subtract transition overlap frames; do not hide arithmetic mistakes with frozen tails or long silence. Never sample beyond source duration.

Example final audio chain: resample to 48 kHz, normalize around -16 LUFS with a -1.5 dB true-peak target, encode AAC. Padding/trim may accommodate the very brief closing hold after complete naturally paced speech; never truncate narration or use it to fill an underwritten script. Inspect the encoded audio peak and silence intervals rather than assuming the filter established quality.

## Windows reliability

Use explicit UTF-8 reads/writes. PowerShell UTF-8 may include a BOM, so use `utf-8-sig` when reading those files. Windows default encoding can corrupt typography or Python source. Avoid passing non-ASCII code through an unconfigured PowerShell pipe; use UTF-8 files or Python Unicode escapes. Check rendered glyphs: the example font lacked some mathematical symbols, so the not-equal sign was drawn with lines.

Public Pexels downloads worked with Python urllib using the public download endpoint and ordinary redirects. Record the final media URL and license. A failed request is a reason to choose another legitimate free source or use original motion graphics, not to bypass authentication or usage limits.

## Evidence limits

Pixel checks establish visible captions and expected highlight colors, not whether the model's word timing matches each phoneme. Audio-envelope comparison detects editing shifts and drift, not naturalness or intelligibility. Chronological screenshots are a visual sampling review, not continuous audiovisual playback. Keep these distinctions in the quality report and final delivery.
