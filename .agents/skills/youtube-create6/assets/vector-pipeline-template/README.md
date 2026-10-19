Copy this template into a new project folder before running it. The supplied George WAV and word timings allow rendering without synthesis. No runtime binaries, model weights or fonts are bundled.

# Free local vector animation pipeline

Six-scene, approximately 46-second demonstration, not the inferred full documentary from the incomplete brief. Final runtime follows the complete 45.68-second George take plus a brief closing hold: 46.4 seconds, 1080 x 1920, 30 fps. No time stretching. Update scene/cue definitions for a different story; an exact target requires fitting the script and resynthesizing naturally, never truncating speech.

## Reproduce on this workstation

From this folder, run sequentially:

```powershell
..\brutal-truth-money-kokoro-v4\python312\python.exe generate_george.py 0.98
python calculations.py
python -m unittest discover -s tests -v
python scenes.py
python render.py
python verify.py
```

The supplied WAV/timings permit rerendering without running synthesis. `bootstrap.py` detects existing sibling Pillow/NumPy/imageio-ffmpeg installations without changing global Python settings. Else use a project-local virtual environment and `pip install pillow numpy imageio-ffmpeg`. On another Windows workstation, point `SETUP` in generate_george.py to a legitimately installed local Kokoro runtime/model/George voice. Kokoro native Torch, its existing G2P environment and licenses are reused from the established youtube-create5 setup. No ONNX, paid API or credential is required. No global installation has occurred.

## Components

- `core.py`: deterministic ease, arc-length polyline reveal, original marker alphabet, strict cue lookup and vector scene graph. `Canvas.svg()` exports editable SVG; the same primitive geometry is rendered using Pillow. This is an equivalent backend for the defined primitives, not a general-purpose SVG/CSS parser. No CairoSVG or MoviePy dependency needed.
- `characters.py`: original shared-proportion cast, articulated arms, facial expressions, blinking and restrained cutout movement. `assets/cast/` contains editable SVG references.
- `scenes.py`: reusable handwriting, progressive arrow drawing, eased money transfers, growing/crashing charts and counters. Character coordinates and certificate size/position provide pan/zoom; object transitions use shared identities and short transitions through paper. `assets/svg/` contains editable scene/marker-progress snapshots, including all requested handwritten concepts. It is not a single SVG with a built-in browser movie timeline.
- `captions.py`: existing youtube-create5 fixed-word-position white/gold style, 72px, max two lines, stable phrase holds. Model-derived timings are not independently forced-aligned.
- `audio.py`: original synthesized drawing/transfer/reveal sounds, intentionally quiet beneath narration; no licensed music or source soundtrack.
- `render.py`: every-frame safe shape/text audits, stable caption composition, narration-derived timeline and local FFmpeg MP4 encoding. Update numeric data in calculations.py and scene rendering together.
- `verify.py`: actual export decode, glyph-core colour checks, audio comparison, scene motion and phone-sized contact sheets. Render success is not full quality validation.

Finance demonstration: USD, hypothetical 5% simple annual interest, $10M principal, one year without fees/payments/compounding. $500,000 interest; $10M principal plus accrued interest is $10.5M total, not $10M total debt. Chart labels principal separately and prices are illustrative with no specified horizon. An SBLOC maintenance call is not silently renamed a margin-account call. `MARGIN CALL!` is included only in the effect catalogue for a suitable margin-account story. Inherited basis may step up or down; the film uses “INHERITED BASIS” and US qualifications. Estate obligations do not imply heirs universally owe debt personally.

Read sources-and-licenses.md and verification/quality-review files. Subjective full watch/listen, independent phonetic alignment and real-device trials cannot be represented as passed unless actually performed. No public upload. Prior projects and credentials preserved.
