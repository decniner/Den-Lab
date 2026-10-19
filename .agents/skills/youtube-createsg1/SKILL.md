---
name: youtube-createsg1
description: Use when creating or revising a finished narrated widescreen drawing explainer with premium Studio Ghibli-inspired painterly imagery, or when explicitly invoking youtube-createsg1. Excludes script-only work, caption-only edits, vertical Shorts and public uploading.
---

# Painterly drawing explainer

Create a complete narrated MP4 and reproducible project. Read [production mechanics](references/production.md) before generation or rendering. Honor explicit user specifications over defaults.

## Art and output

Default to about 30 seconds, 1920x1080, 16:9, 30 fps, H.264/yuv420p and 48 kHz AAC. Use local Kokoro bm_george British narration when available; preserve supplied words exactly and let runtime follow complete natural speech.

Create original cohesive Studio Ghibli-inspired paintings with expressive credible adults, intricate environments, watercolor/gouache texture, atmospheric lighting and warm ivory paper edges. Treat this as visual inspiration; do not promise an exact studio match or describe generated artwork as official studio work. Use the built-in image-generation skill for new paintings, with the first reviewed image as a style/character/architecture reference for later scenes. Do not substitute simple vector business icons for finished premium artwork.

Inspect finished artwork before animation for faces, hands, perspective, composition, character continuity, undesired typography and consistent atmosphere. Save original images and exact generation prompts in the new project. If the image tool is unavailable, explain the blocker; do not silently fall back to a separately billed API or sparse geometry.

## Drawing and production

Copy the bundled reference pipeline into a new writable project with [scripts/new_project.py](scripts/new_project.py). It contains a specific AI-takeover example; adapt the story, paintings, headings, screen positions and timing together for new requests.

Keep the drawing tool tiny: roughly 40 px long and 5 px wide at 1080p. Its nib must follow the current contour endpoint and leave faces, text and new strokes visible. The template uses a faint underdrawing, ordered raster-derived contour strokes, and a separate soft painted finish. These are approximate traced paths and an interpretive reveal, not original animator brush strokes or a pencil physically applying color. Avoid rectangular picture wipes.

Render and inspect a five-second prototype before full production. Fix noisy contours, missing facial detail, awkward gaps, occlusion, text placement and transitions. Keep sufficient finished-art screen time; an excellent painting cannot compensate for a poor reveal.

Use measured narration for frame-rounded scenes and sound cues. Cache the unchanged voice for visual revisions. Mix restrained original or licensed sound under speech. Stream frames to FFmpeg and render scenes separately on CPU; preserve earlier exports.

## Verify and deliver

Check the actual final MP4: full decode, frame count, formats, exact narration coverage, source/export audio drift, clipping, representative frames and ending. Inspect the final contact sheet and fixes after revisions. Separate technical checks from visual opinions and unavailable full listening/playback.

Deliver video, contact sheet, original artwork, prompts, derived paths, audio, timing, code, provenance and reproduction instructions. Link the exact MP4 path. State any unmet realism or animation requirements; do not label still-painting reveals fully articulated studio character animation.
