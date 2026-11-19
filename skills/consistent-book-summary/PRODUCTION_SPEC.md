# Reproducible production specification

## Reference lock

The required reference inputs are exactly `Dracula_Hook_Cover.png`, `Dracula_YouTube_Short_Painterly.mp4`, and `A Room of One’s Own Legacy.png`, identified by the hashes in `reference-manifest.example.json`. Keep user-supplied reference files in a project-local `references/` folder; do not commit copyrighted media or private machine paths. Use `A Room of One’s Own Legacy.png` as the hook-cover look and feel: top-positioned large serif title, burgundy divider, author line beneath, warm textured ground, and a premium illustrated scene. Keep the exact Dracula cover as a secondary series reference. Use the short's inspected frames to set still-image art, scene pacing, framing, and caption quality. Do not copy geometric placeholder art from any reference as production artwork.

## Artwork gate

Generate finished raster illustrations before video assembly. Characters must be premium, expressive, stickman-inspired storybook figures with stable identity and proportions. Use a coherent 2–3 tone dominant palette (warm ivory, charcoal, deep burgundy); within-family texture and shading are acceptable. Primitive SVG people, straight-line limbs, circles, geometric placeholders, flat icon art, and wireframes fail. Build a contact sheet from the actual candidate cover and scene assets with `python scripts/build_contact_sheet.py assets/contact-sheet.png assets/hook-cover.png assets/scene-01.png ...`; inspect it at full resolution and record a named human approval in the manifest. The builder requires Pillow and fails clearly when Pillow or any image is unavailable. Metadata cannot certify aesthetic quality; the reviewer owns that decision. The cover must be a 1080×1920 PNG.

## Mandatory emotional-context gate

Every scene record must include `emotional_review` fields for `narration_meaning`, `intended_tone`, `facial_expression`, `body_language`, `environmental_mood`, and `human_review_status: "approved"`. Treat hardship, grief, separation, imprisonment, illness, suffering, and trauma as solemn context: cheerful or smiling faces fail unless `intentional_contrast: true` includes an explicit story-based `contrast_justification`. Human review is required; automated checks validate that review exists and catch obvious contradictory labels, but cannot judge the artwork. Review contact sheets before final render. Preserve the scene composition and character identity when correcting expressions unless the scene cannot be made coherent through expression/body-language edits.

## Still-image sequence and timeline

Generate one high-resolution, story-specific still illustration for every narration scene. Each `artwork.scenes` item records an on-disk image path plus contiguous `start_ms`/`end_ms` values covering the full approved runtime. Keep Remotion media under `public/`; `StillImageSequence.tsx` strips an optional `public/` prefix before calling `staticFile()` on macOS or Windows. Render the 1080×1920 hook PNG as a still visual within the first N frames of that same timeline; it replaces the opening image time and never extends runtime. Keep the Kokoro narration track at frame 0 and preserve its cue timestamps. Use `components/StillImageSequence.tsx` as the reusable Remotion scene compositor: it shows the current generated still, overlays the cover only during the first `hookFrames`, starts the supplied Kokoro audio at frame 0, and highlights the current cue word through the shared `Caption.tsx`. Register it as a 1080×1920, 30fps Remotion composition and map manifest millisecond timings to frames. Scene cuts are the default; crossfades and restrained whole-image pan/zoom may be added only where useful. Do not animate characters, require a skeleton/rig, or rebuild art from vectors. Caption words continue using the shared `Caption.tsx`, one fixed baseline/font/line box, and fill-only word highlighting. Baseline changes are a regression requiring correction.

## Portable execution

The JSON manifest is project-root-relative. This implementation uses the existing Remotion renderer to assemble stills; it does not need character-animation tooling. `components/StillImageSequence.tsx` provides the reusable composition body; the user project registers the named Remotion compositions referenced by the manifest. Values in `project-manifest.example.json` are placeholders; measure caption baseline and duration/frame values from each inspected project instead of assuming the example baseline is reference-matched. Python `pathlib` resolves paths; subprocess commands are JSON argv arrays and always run with `shell=False`. Configure Remotion as `["node", "node_modules/remotion/cli/index.mjs"]` or an equivalent installed CLI path. No shell-specific quoting, hard-coded home directory, or OS-specific path separator belongs in manifests. `production.py` runs hook then full composition using generated still illustrations and checks the Remotion runtime and FFprobe before rendering, then requires 1080×1920, 30 fps, an audio stream, and the approved total duration within one frame. The manifest keeps narration at frame zero and pins the same narration path, total frame budget, hook frame count, and shared caption component. Listening through playback and inspecting caption sync remain human checks. Use the existing local Kokoro workflow to create narration before running the gate; do not replace it with a remote service. The narration provider field must remain `kokoro`.

Pin `narration_voice`, `narration_settings.lang_code`, and `narration_settings.speed` in every project manifest. Never assume a global default voice: reproduce the approved project’s recorded voice. Keep the skill’s immutable style/caption rules separate from each book’s story, narration, scene plan, artwork prompts, and project-relative asset paths. Platform render settings belong in the project manifest; the vertical baseline is 1080×1920 at 30 fps.

The approved production reference package lives in `baseline/mans-search-for-meaning/`. Its `approved/` files are immutable golden artifacts. `baseline/SHA256SUMS.json` records hashes for those deliverables and all staged production inputs, scene artwork, and local reference assets. Verify the manifest before use; never write a render to an approved path. The baseline is protection and provenance, not a replacement for fresh-session human artwork review.

## Explicit failures

Stop before rendering when any exact reference is absent or hash-mismatched, one or more timed raster scene illustrations/contact sheet are missing, the 2–3 tone quality review is not approved, Kokoro narration is missing, or the Remotion/FFprobe toolchain is incomplete. When `image_generation.generation_pending` is true (the default), the configured image-generation executable must also be available. Set it to `false` only after all reviewed raster artwork has already been generated and staged; rendering consumes those files and does not call an image generator. Fix inputs and rerun; never downgrade the gate silently.

## Shell entry points

macOS Terminal: `./scripts/run_production.sh project-manifest.json`

Windows PowerShell: `./scripts/run_production.ps1 project-manifest.json`

Validation only: add `--validate-only` after the manifest on either shell. Install Python 3.9+, Pillow, Node/Remotion, FFmpeg/FFprobe, local Kokoro, and the selected image-generation tool on each machine. Dependency versions and image-generation model/version must be recorded with each project.

## Cross-platform acceptance

Code inspection alone never counts as Windows validation. Mark Windows production `NOT TESTED` until the Windows PowerShell workflow has independently rendered and passed media, caption, emotional-review, and playback checks.
