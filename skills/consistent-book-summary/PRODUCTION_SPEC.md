# Reproducible production specification

## Reference lock

The required reference inputs are exactly `Dracula_Hook_Cover.png`, `Dracula_YouTube_Short_Painterly.mp4`, and `A Room of One’s Own Legacy.png`, identified by the hashes in `reference-manifest.example.json`. Keep user-supplied reference files in a project-local `references/` folder; do not commit copyrighted media or private machine paths. Use `A Room of One’s Own Legacy.png` as the hook-cover look and feel: top-positioned large serif title, burgundy divider, author line beneath, warm textured ground, and a premium illustrated scene. Keep the exact Dracula cover as a secondary series reference. Use the short's inspected frames to set animation, character, scene, framing, and caption quality. Do not copy geometric placeholder art from any reference as production artwork.

## Artwork gate

Generate finished raster illustrations before animation. Characters must be premium, expressive, stickman-inspired storybook figures with stable identity and proportions. Use a coherent 2–3 tone dominant palette (warm ivory, charcoal, deep burgundy); within-family texture and shading are acceptable. Primitive SVG people, straight-line limbs, circles, geometric placeholders, flat icon art, and wireframes fail. Build a contact sheet from the actual candidate cover and scene assets with `python scripts/build_contact_sheet.py assets/contact-sheet.png assets/hook-cover.png assets/scene-01.png ...`; inspect it at full resolution and record a named human approval in the manifest. The builder requires Pillow and fails clearly when Pillow or any image is unavailable. Metadata cannot certify aesthetic quality; the reviewer owns that decision. The cover must be a 1080×1920 PNG.

## Remotion timeline

Render the hook as a separate short composition for inspection, then render the final summary composition. The hook occupies the first N frames of the existing approved timeline: shift/replace the opening scene inside that same frame budget. Never append the hook to the existing duration. Keep the existing narration track and cue timestamps; the Remotion composition uses that audio from frame 0 and overlays the hook visual. Do not stretch, regenerate, trim, or offset Kokoro narration to make room for the cover. Caption words continue using the shared `Caption.tsx`, one fixed baseline/font/line box, and fill-only word highlighting. Baseline changes are a regression requiring correction.

## Portable execution

The JSON manifest is project-root-relative. Values in `project-manifest.example.json` are placeholders; measure caption baseline and duration/frame values from each inspected project instead of assuming the example baseline is reference-matched. Python `pathlib` resolves paths; subprocess commands are JSON argv arrays and always run with `shell=False`. Configure Remotion as `["node", "node_modules/remotion/cli/index.mjs"]` or an equivalent installed CLI path. No shell-specific quoting, hard-coded home directory, or OS-specific path separator belongs in manifests. `production.py` runs hook then full composition and checks the Remotion runtime and FFprobe before rendering, then requires 1080×1920, 30 fps, an audio stream, and the approved total duration within one frame. The manifest keeps narration at frame zero and pins the same narration path, total frame budget, hook frame count, and shared caption component. Listening through playback and inspecting caption sync remain human checks. Use the existing local Kokoro workflow to create narration before running the gate; do not replace it with a remote service.

## Explicit failures

Stop before rendering when either exact reference is absent or hash-mismatched, the configured image-generation executable is unavailable, raster artwork/contact sheet is missing, the 2–3 tone quality review is not approved, Kokoro narration is missing, or the Remotion/FFprobe toolchain is incomplete. Fix inputs and rerun; never downgrade the gate silently.

## Shell entry points

macOS Terminal: `./scripts/run_production.sh project-manifest.json`

Windows PowerShell: `./scripts/run_production.ps1 project-manifest.json`

Validation only: add `--validate-only` after the manifest on either shell. Install Python 3.9+, Pillow, Node/Remotion, FFmpeg/FFprobe, local Kokoro, and the selected image-generation tool on each machine. Dependency versions and image-generation model/version must be recorded with each project.
