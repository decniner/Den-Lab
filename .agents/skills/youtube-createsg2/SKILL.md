---
name: youtube-createsg2
description: Create or revise a finished narrated widescreen video with premium Ghibli-inspired full-screen paintings and distinct artwork for every shot. Use when explicitly invoking youtube-createsg2 or requesting this painterly documentary treatment. Excludes script-only work, caption-only edits, vertical Shorts and public uploading.
---

# Painterly cinematic documentary

Produce a finished playable MP4 and reproducible project. Read [production mechanics](references/production.md) before production. Honor the user's supplied narration, duration and approved material.

## Visual treatment

Use original Ghibli-inspired painterly imagery: expressive credible characters, richly detailed environments, watercolor/gouache texture, atmospheric lighting, coherent architecture and warm natural colors. This is aesthetic inspiration, not official studio artwork or a promise of an exact studio match.

Every shot needs its own original artwork and composition. Maintain character and world continuity without replaying images, recycling shots, or counting crops of the same image as new scenes. Change viewpoint, action, setting and emotional emphasis to match each narration beat. Review adjacent scenes together; regenerate compositions that look too similar.

Full-screen cinematic paintings are the dominant visual language. Avoid cheap diagrams, native line charts, flowchart boxes, business icons and sparse vector geometry. For a full documentary, default to no more than three explanatory painted scenes, and fewer for shorter videos. Where needed, use richly painted physical models or architectural cutaways integrated into the world. Preserve an approved opening when revising unless the user requests changing it.

Use the built-in image-generation tool for new paintings. Inspect the first image, then reference it for brushwork, palette and character continuity while explicitly requesting a different composition for each subsequent image. Save exact prompts and originals. If generation is unavailable, report the blocker; do not silently substitute sparse graphics or a separately billed API.

## Production

Default to 1920x1080, 16:9, 30 fps, H.264/yuv420p, 48 kHz AAC. Runtime follows the complete natural narration; preserve supplied spoken words exactly. Prefer available local Kokoro bm_george narration and restrained original or licensed sound beneath speech. Cache narration and timing during visual revisions.

Make a frame-rounded storyboard covering all spoken paragraphs. Use distinct semantic artwork IDs, source hashes and cache fingerprints. Inspect paintings for faces, hands, perspective, unwanted lettering, and composition before rendering. Render and inspect a five-second prototype, then encode each scene separately with FFmpeg on CPU. Cache decoded still frames before zoom/pan to avoid repeated large PNG decoding.

Keep paintings visible with gentle varied camera movement and restrained transitions. Use very few small native headings. Do not add diagram overlays or large drawing markers. This version defaults to cinematic painted imagery, not traced whiteboard reveals. Camera movement over a painting is not articulated character animation; if the user requires walking, acting or lip sync, obtain actual animated footage and verify those movements rather than relabeling stills.

## Verification and delivery

Verify the actual final MP4 with a full decode, frame count and format checks, exact narration coverage, unique artwork hashes, one-time shot use, source/export audio drift, loudness/clipping checks and a deliberate ending. Inspect an exported sample from every scene and contact sheets across adjacent shots. Preserve earlier exports under distinct names.

Deliver the exact MP4 path, a visual contact sheet, subtitles when appropriate, originals/prompts, narration/timing, code, source provenance and reproduction instructions. Distinguish measured checks from visual judgment and any unavailable full continuous listening/playback. Do not upload publicly as part of creation.
