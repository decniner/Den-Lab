# Local production and starter

## Runtime

- Narration: `/Users/decniner/.local/share/kokoro/venv/bin/python`.
- Rendering: `/Users/decniner/Documents/Codex/2026-10-10-FirstProject/.youtube-venv/bin/python`, with Pillow, NumPy and imageio_ffmpeg. Get the bundled executable from `imageio_ffmpeg.get_ffmpeg_exe()`; do not assume ffmpeg is on PATH.
- System fonts default to macOS Arial/Athelas. Verify paths; project.json may override them. Do not distribute system font files.
- Kokoro model: `hexgrad/Kokoro-82M`, default voice `am_adam`, language `a`. Check local model/config/voice cache first. A Python environment alone does not imply cached weights. Missing weights/voice may be downloaded free from the official repository; no paid inference API is needed. Do not silently change voices. Avoid forcing offline mode when the cache is incomplete.

## Initialize and adapt

```sh
python /Users/decniner/.codex/skills/paper-diorama-explainer/scripts/init_project.py /absolute/new-project
```

Initialization refuses an existing destination and copies only the small starter, without generated audio/video, credentials, fonts, old symlinks or scene caches. Inputs and authoring code go in `work/`; outputs go in that project's `outputs/`. Honor an explicitly designated chat deliverables path when present.

Before narration or rendering:

1. Edit `work/project.json`: editorial series/subject line, years, output basename, voice/speed, optional font paths.
2. Replace `work/scenes.json`. Each scene has sequential `id` starting at1, a `kind` handled by `art.make`, `title`, `kicker`, and plain-prose `narration`. Titles/dates displayed in artwork need not be narrated verbatim, but must agree with the script. Do not include Markdown formatting or standalone punctuation tokens in narration.
3. Adapt `art.make` branches and route coordinates to the new topic. The example's Magellan scene kinds, ship outcomes, captain labels, European carrack, clothing and schematic geography are not reusable historical facts. Use its cut/texture/shadow/label primitives and map compositor for new scenes. Scene counters derive from the input scene list.
4. Check map projection/longitude wrapping, marker placement and period details. Modern Natural Earth coastlines are an explanatory base, not a sixteenth-century chart. Default land data is bundled, public domain; provenance: https://www.naturalearthdata.com/about/terms-of-use/ .

## Execute

Animation defaults to clearly visible movement, following the user’s latest preference: independent ship/subject and wave planes, a4.5% camera push, travelling map-route cursor and0.6s paper reveal. Keep maps registered and captions fixed. Tune per scene; do not slide people across a battlefield simply to add motion.

Run from the new project:

```sh
KOKORO_PY=/Users/decniner/.local/share/kokoro/venv/bin/python
MEDIA_PY=/Users/decniner/Documents/Codex/2026-10-10-FirstProject/.youtube-venv/bin/python
"$KOKORO_PY" work/narrate.py
"$MEDIA_PY" work/art.py
"$MEDIA_PY" work/render.py --proof
# Inspect work/proof.mp4 and actual frames before the full render.
"$MEDIA_PY" work/render.py
"$MEDIA_PY" work/verify.py
```

Narration caches each text/voice/speed/model identity. Frames use an audio-measured24fps grid and .7s lead/.9s tail per scene. Rendering caches each scene from layers, captions and timing. Keep two encoders by default. On a change, regenerate affected artwork; existing hashes select only affected artwork scene renders when audio and captions are unchanged. Any caption or narration-timing change invalidates all scene renders because the complete caption-file hash is part of every cache key. Plain prose should avoid ASS control characters; escape those if the requested script requires them.

## Verification and outputs

The renderer writes `project.json.output_basename + .mp4`; verifier reads the same name. Counters, spoken-word coverage and contact-sheet pagination derive from actual inputs, not the Magellan film's19scenes/614words. Word-color samples and artwork-motion samples are technical evidence, not full listening. Verification samples are keyed to the current video SHA-256 and sampling timestamp to prevent stale-frame reuse. Review full-frame contact sheets: crop-to-fill thumbnails can conceal clipped titles. If map markers or dates change, inspect the actual encoded new frame.

Prepare `research-and-production-notes.md` with sources, uncertainties, public-domain/owned-asset provenance, exact voice, free production statement and validation limits. Export clean narration with explicit `-ar 24000` after loudness normalization; FFmpeg's loudnorm otherwise upsamples. Package source/layers without credentials/model weights/system fonts. Do not carry the old example's verification result to a new video.

## Approved reference

The initial source example used gentle motion; the current starter adopts the later explicit preference for noticeable animation. The4m43.875s Magellan–Elcano film has19scenes,614spoken words,24fps,6813frames, local Adam at0.94, original paper art, Natural Earth coastlines. Full decode/no-black-frame tests, all-scene movement/highlight samples and source-audio correlation checks passed; every encoded scene was visually inspected. Those numbers document the reference only; they are not targets or certification for future films.
