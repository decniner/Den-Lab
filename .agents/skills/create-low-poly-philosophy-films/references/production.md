# Production reference

## Project and defaults

Keep installed skill files read-only during ordinary productions. Initialize a fresh directory, then change the authored example for the new brief. Run every action through `make_film.py` to use its OS project lock. The `.film.lock` file may remain after exit; the OS lock, not file existence, determines ownership.

`dialogue.json` is an array of objects:

```json
[
  {"who":"HUMAN","text":"If a memory changes, what exactly did I keep?","scene":"human","pause":0.8},
  {"who":"AI","text":"Perhaps a trace, rather than a recording.","scene":"ripple","pause":0.7}
]
```

Use exactly `HUMAN` or `AI`; pauses are 0–15 seconds. An optional `chapter` supplies a short upper label when enabled. Narration length determines the runtime. Expand an under-length script rather than slowing existing audio or padding the film.

| Scene | Image |
| --- | --- |
| `two` | Wide white world with human, robot and table |
| `human`, `ai` | Faceted speaker close-ups |
| `glass` | Close view of the shared physical prop |
| `clock` | Animated hands and time perception |
| `atom` | Abstract probability cloud and a nucleus motif |
| `wave`, `ripple` | Moving lines and consequences |
| `galaxy` | Rotating spiral field of light |
| `horizon` | Observer-centred field and observational boundary |
| `timeline` | Present, stars, early universe and an unknown limit |
| `eye` | Iris motif for perception and the ending |

Graphics are artistic impressions, not exact scientific diagrams. Relabel or adapt topic-specific cutaways in a project-local renderer when moving beyond the included cosmic story. Do not present the Big Bang as an explosion into external space, infinity as established, or quantum effects as an explanation of consciousness.

`film.json` controls `title_lines`, `closing_lines`, `output_stem`, `width` (1080), `fps` (30), `lead_in_seconds` (3.5), `tail_seconds` (4), `min_duration_seconds` (120), `workers` (6, maximum 8), `show_chapter_labels`, `inspiration_credit`, `human_voice`, `ai_voice`, `human_rate` and `ai_rate` for the optional Edge backend. New projects use `audio_engine: "chatterbox"`, `caption_font_size: 44`, and `caption_y: 920`. Caption coordinates are on the internal 720×1280 canvas. Optional `sans_font` and `serif_font` are explicit existing paths. The provided Linux paths must be changed to available fonts on another OS.

Use short titles and closing lines; verify them visually. Keep `output_stem` to letters, digits, underscores or hyphens. A draft may use width 360, fps 12 and a shorter minimum; restore 1080/30 and the requested duration for delivery. The vector/mesh scene canvas renders internally at 720 × 1280 before final output scaling.

## Operational workflow

Run actions in order: `init`, `validate`, `setup-voice`, `audio`, `samples`, `render`. `verify` rechecks an existing completed output without rendering. Supply `--project <absolute-directory>` for each.

Dependencies: use the pinned CPU Chatterbox environment in [chatterbox.md](chatterbox.md), FFmpeg/FFprobe and the configured fonts. Initial model/reference downloads need network access; generation then runs locally. The optional Edge backend needs its own service connection. Honour `SSL_CERT_FILE` and `REQUESTS_CA_BUNDLE` without disabling certificate checks. The workflow does not require a paid generation service.

The Chatterbox audio cache hashes the exact text, speaker, pinned model manifest, reference contents and per-turn seed. Edge retains its voice/rate cache. Acoustic forced alignment produces word boundaries for Chatterbox; keep the authored words and punctuation. Authored punctuation is retained while matching actual service word boundaries, including split hyphenated words. If normalized speech tokens do not match the script, stop for review rather than silently estimating timings.

Each render divides frames among bounded workers, encodes pieces and assembles them. `<stem>.rendering.mp4` is renamed only after encoding succeeds. A completed encode still requires verification and exported-frame review before delivery. Keep partial files and cached audio project-local so interrupted work can be investigated.

`verification.json` records decoding, actual output dimensions/rate/duration, stereo audio, speech in every turn and exact caption text. It does not judge philosophical depth, voice performance, musical licensing or artistic quality. Listen when an audio-inspection surface is available; never claim an unavailable listening review.

For revisions, retain the existing file identity and version guard. Publication is an independent user-directed action. Do not store OAuth tokens or credentials in project assets or skill files.
