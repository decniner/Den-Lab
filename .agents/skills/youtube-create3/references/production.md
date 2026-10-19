# Proven local production setup

The working example is `vr-boxing-motion-premium-v2` beside this skill folder in the current workspace. Inspect these files when adapting the pipeline:

- `render_motion.py`: streaming FFmpeg footage decoding, editorial overlays, timed gold word highlights, continuous phrases, chapter fades, and cross-dissolves.
- `caption_helpers.py`: timing normalization, speech anchors, and timestamp formatting. Its older renderer is not the premium entrypoint; use only the required helpers.
- `verify_video.py`: MP4 movie-header duration, metadata/frame-count assertions, complete decoding, peak audio level, original narration hash, caption coverage, and per-shot motion checks.
- `download_footage.py` and `assets/downloads.json`: example free licensed Pexels downloads and provenance. Choose new topic-relevant clips rather than assuming the example's VR shots apply.
- `andrew_en-US.mp3` and `word_timings.json`: preserved Andrew narration and original Edge speech boundaries for the VR revision. Do not reuse that narration for a different topic.

Installed dependencies were reused from these local directories:

```text
C:/Users/DenDev/Documents/Codex/2026-10-01/check-my-computers-bios-firmware-using-powershell-and-sh/.edge-tts-temp
C:/Users/DenDev/Documents/Codex/2026-10-01/check-my-computers-bios-firmware-using-powershell-and-sh/.render-deps
```

These paths are environment hints, not portable requirements. Inspect availability first. `imageio_ffmpeg.get_ffmpeg_exe()` locates the installed bundled FFmpeg. Pillow renders typography; `edge_tts.Communicate(..., boundary='WordBoundary')` produces audio and speech boundaries. Free dependencies may be installed into the project environment when necessary. Prefer 48 kHz AAC output for broad compatibility.

## The caption invariant

The previous blinking came from displaying a caption only over `[word.start, word.end)`. Silence between adjacent words therefore became blank caption frames.

For each phrase, keep its full text present from its phrase start until the next phrase begins. During that interval, determine the active word using `word.start <= time < word.end`. If none is active, keep all words white. Fade between phrases briefly without a blank interval. Keep words at the same coordinates regardless of active color. Restore punctuation from the authored script after validating token alignment.

Check sampled frames during actual speech gaps, not just word midpoints. A test of planned phrase coverage alone does not establish exported readability or accurate visual highlighting; inspect rendered frames too.

## Transition accounting

At 30 fps, a 0.4-second cross-dissolve uses 12 frames. Overlaps reduce the total duration: the final frame count equals the sum of clip frame counts minus all overlapping frames.

The example uses twenty 4-second shots, extending each internal shot by 6 frames at both ends and the first/last by 6 frames on their one transition edge. Counts are 126 for first/last and 132 for internal shots; subtract nineteen 12-frame overlaps to get exactly 2400 frames. Adapt this arithmetic to the requested timeline instead of padding a miscalculated edit.

Do not extend source shots beyond their available footage and create frozen tails unintentionally. Confirm sufficient source duration, actual source resolution, framing, and frame-rate conversion. Do not claim native resolution when footage has been upscaled or cropped. Preserve licenses and distinguish staged illustrative footage from captured gameplay or documented results.
