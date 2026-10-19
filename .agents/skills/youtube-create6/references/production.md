# Free local production and export review

## Existing setup

Inspect available tools rather than assuming a specific workstation. On Den's existing machine, reusable projects are under `C:/Users/DenDev/Documents/Codex/2026-10-07/hi-there/`:

- `brutal-truth-money-george-v5`: native George generation, measured retiming and caption helpers. Read its README and voice-settings.json before adapting narration. Its sibling `brutal-truth-money-kokoro-v4` contains the portable native Torch/Kokoro environment and cached model/voice weights. Reuse existing model and license manifests. Native Torch worked in this setup; earlier ONNX attempts did not.
- `earth-series-part-08-fullscreen-v3`: a concrete full-canvas rendering example. Read render.py, cinematic_visuals.py, README.md and quality-review.md before adapting it. It contains scientific episode-specific anchors and assets, not a universal topic template.
- Pillow, NumPy and imageio-ffmpeg renderer dependencies were available at `C:/Users/DenDev/Documents/Codex/2026-10-01/check-my-computers-bios-firmware-using-powershell-and-sh/.render-deps`. Use project-scoped PYTHONPATH after checking availability, not global Python changes.

These are local reuse hints, not dependencies shipped inside the skill. If absent, build a legitimate free local pipeline. Keep unrelated projects and credentials intact; never print secrets. FFmpeg plus Pillow or other installed rendering tools is sufficient for a finished video. Blender CPU rendering is an option for original reconstructions, not a required detour. No paid generation is required.

## Narration and alignment

Use `KPipeline(lang_code='b')` with `bm_george`. Aim initially for about 165–185 words for an 80-second new script, then measure actual output. Voice speed is a native synthesis setting, not post-generation acceleration. Select delivery and strategic pauses for the topic. Rewrite/regenerate overlong narration; never silently truncate words or add filler silence. A brief closing visual hold after complete speech is acceptable.

Retain raw takes, final narration, synthesis settings and measured duration. If trimming outer silence, preserve consonants and internal pauses; record exact removed samples and shift timestamps by the corresponding offset. Check script/token coverage including contractions. Rebuild scene anchors and caption groups for the actual script. Do not carry episode-specific keywords or fixed scene times into another topic.

Kokoro word events are model-derived, not independent phonetic validation. Use reliable local forced alignment when available, then inspect/listen. If listening or independent alignment is unavailable, say so rather than claiming spoken-word timing has been independently verified.

## Full-canvas composition

Design an image-led sequence of distinct relevant shots. Use footage only within its actual decoded duration; reject frozen tails and loops used as filler. Omit unneeded source audio. Preserve original aspect and subject proportions. A portrait crop must keep the important subject visible; camera motion must not drift it behind captions or outside the safe region.

Use short cross-dissolves or other restrained transitions between imagery. Keep caption changes independent of those transitions. For photographs, record editorial pan/zoom as photographic camera motion. For reconstructions, distinguish artistic illustration from observation; do not claim a still plate depicts physically simulated motion.

Blend peripheral extensions smoothly. Sample background-only areas; extending a row that contains the organism or another subject produces false stretched anatomy. Review the entire shot, not just the first frame. If scientific figures or financial diagrams require text, give them a distinct composition with readable assumptions rather than forcing everything over a busy image. Attribution belongs in source notes and the sharing description, with visible credits when the actual license/creator requirements call for them.

## Stable captions

Hold each whole phrase until the next starts. Select the active word by `start <= time < end`; all words remain white during speech gaps. One phrase layer only: no overlapping phrase crossfade, per-word animation, font changes or movement when highlighting.

The working example uses 72 px bold captions at y=1380 and 1472. Conservative authored-text bounds are x=64..910 and y=70..1600, leaving room for platform controls. These are starting bounds, not proof of every platform's current UI. Keep the main subject above the caption area and essential titles/numbers separate. Prefer shortening caption groups over shrinking text. A soft dark gradient provides contrast without a hard panel; test it against bright, dark and gold-toned imagery. Do not redistribute installed Windows font binaries.

## Export checks

For the default duration, export exactly 2,400 frames at 30 fps. Include transition overlaps in timeline arithmetic. An audio target of roughly -16 LUFS and -1.5 dB true peak is suitable; measure actual output for clipping and intelligibility. Use explicit UTF-8 reads/writes and inspect rendered punctuation and glyphs.

Before delivery:

1. Probe the actual MP4 for duration within one frame, resolution, frame rate and audio properties. Fully decode audio and video to catch blank/broken assets and stream errors.
2. Register actual glyph bounds and check safe zones and text intersections on every frame. This checks authored text, not every subject or text embedded in source assets; inspect those separately.
3. Check exported caption visibility and gold highlighting against the word schedule throughout. Use glyph masks or isolated text regions if imagery can confound pixel-color checks. Never relax thresholds to conceal a real failure.
4. Compare identically processed source/export audio for drift; loudness normalization can change the raw envelope without a timing shift. Keep raw and normalized diagnostics. Check clipping, complete speech and unexpected silence.
5. Inspect chronological phone-sized samples across the complete export, every scene and caption change, opening five seconds and ending. Check subject framing, seams, tiny text, collisions, poor transitions and repeating/frozen imagery. Capture boundary frames during the full decode where practical instead of repeatedly seeking the entire file.
6. Recalculate displayed quantities independently and validate rounding and scientific chronology where relevant.
7. Watch and listen to the complete export if playback is available. Record real-device testing only if actually performed. Decode integrity, timestamps and sampled contact sheets do not substitute for subjective playback or independent phonetic review.

Fix observed defects and render again. Run fresh checks against the corrected file; do not reuse a prior export's passing report. Bind review evidence and the delivery manifest to the final MP4's hash. Explicitly leave any unavailable mandatory quality gate incomplete.

Package the finished MP4 and reproducible files, preserving prior exports. Exclude redundant decoded frames and large tool installations when source assets and reconstruction instructions reproduce them. Check archive integrity and the embedded MP4 hash. Disclose genuine footage, photographic motion, reconstructions, voice substitutions and unperformed checks accurately. Provide exact saved paths. Public publishing is a separate authorization.
