# Local George production mechanics

## Reusable setup

The working project is `../../brutal-truth-money-george-v5/`, relative to this file. Its `generate_george.py`, `retime_edit.py`, `render.py`, `caption_helpers.py`, `verify.py` and `extra_qc.py` provide concrete reusable implementations. Adapt the final files into a new project; do not overwrite previous exports or blindly reuse finance-specific scene anchors for other subjects.

Read that project's README and voice-settings.json before execution. The generator uses the sibling `brutal-truth-money-kokoro-v4` portable Python 3.12.10 environment, Kokoro 0.9.4, Torch 2.6.0 CPU, Misaki 0.9.4 and Transformers 4.48.3 with local Kokoro model and bm_george voice weights. Inspect availability; these are environment hints, not portable requirements. Reuse its model/license manifests rather than redownloading or copying gigabytes. Existing ONNX attempts failed locally; native Torch worked. Do not disable security controls to fix runtime failures.

Renderer dependencies on the original machine are in `C:/Users/DenDev/Documents/Codex/2026-10-01/check-my-computers-bios-firmware-using-powershell-and-sh/.render-deps`. Pillow renders graphics; imageio_ffmpeg locates bundled FFmpeg. Inspect before setting project-scoped PYTHONPATH. Never modify global Python configuration unnecessarily.

## Narration and timing

Use British language code `b` with `bm_george`. Native synthesis speed differs from stretching already generated audio. Retain raw takes. Conservative outer-silence trimming in the example uses 10 ms RMS windows, threshold 0.0005 and 60 ms leading/120 ms trailing margins; listen to validate boundaries when possible. Preserve internal pauses and consonants. Log sample offsets and shift every timestamp by the exact removed samples. The example adds 250 ms argument breaks; tune for the new delivery rather than treating these as mandatory values.

Validate that timing tokens cover the complete authored script, restoring contractions and punctuation without inventing events. Cap model tail events at acoustic section boundaries where supported by evidence. This remains model-derived alignment, not independent forced alignment. If the take is too long, rewrite and regenerate. Reject overlength narration before rendering; never silently trim words. A brief closing hold after complete speech is acceptable.

Retiming is script-specific: regenerate scene anchors and caption groups for the new words. Old hardcoded scene times or keyword anchors can fail after rewriting. Use measured events to animate charts, highlights and transitions.

## Stable captions and composition

Display a complete phrase until the next phrase starts. The active word is selected by `start <= t < end`; during gaps all words remain white. Do not fade individual words or crossfade two caption phrases. Keep font metrics and positions fixed when recoloring. Shorten groups before shrinking essential text.

Working layout: 72 px bold captions at y=1380/1472, text safe bounds x=64..910 and y=70..1600; graphics around y=430..1220; readable explanatory notes above captions. These are conservative examples, not guaranteed platform interface bounds. Register actual glyph bounding boxes for every text element and reject unsafe bounds and intersections on every frame. Check exported pixels and phone previews too.

Moving shots must decode for their actual scene duration and remain within source duration. Fixed short decode windows caused frozen tails in earlier revisions. Keep footage transitions independent of text; preserve subject framing with insets when cropping would lose information. Use distinct relevant shots, not repeated loops. Record source/license/creator/access date, omit unneeded source audio and avoid implied endorsement. Do not redistribute installed Windows font binaries.

## Export and evidence

80 seconds at 30 fps is 2,400 frames. Cross-dissolve overlap must be included in timeline arithmetic. An example audio chain targets -16 LUFS and -1.5 dB true peak, encodes 48 kHz AAC and uses only a brief end hold. Verify actual output rather than trusting filters.

Compare identically processed source audio with decoded export audio; loudness processing can reduce a raw-envelope correlation without indicating timing drift. Retain raw and normalized diagnostics. Full decode checks integrity; per-frame geometry checks authored collisions; pixel checks verify scheduled highlights; chronological/transition screenshots provide sampled visual review. None establishes subjective voice quality or continuous playback. Report checks separately and never mark unavailable mandatory checks passed.

Use explicit UTF-8 file access (utf-8-sig for BOM-bearing inputs). Check font glyph support and final screenshots. The George project README contains reproduction commands; adapt dependency paths and script-specific inputs before running.
