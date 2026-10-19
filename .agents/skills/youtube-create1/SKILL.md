---
name: youtube-create1
description: Restyle captions on an existing short-form or YouTube video with a polished, premium look and synchronized gold highlighting for the currently spoken word. Use when asked to improve video captions or apply this caption treatment; do not use for script-only, subtitle-text-only, or unrelated video edits.
---

# Premium YouTube captions

Improve the caption presentation of the user's existing video while preserving its footage, narration, music, sequence, and message. Treat this as a focused caption and graphics edit, not permission to upload or publish.

## Workflow

1. Inspect the available video, subtitle/caption source, and editing tools. Reuse the existing project and its source timing wherever possible. Keep a copy of the original output.
2. Preserve the exact spoken wording. Correct transcription only when the audio clearly supports the correction; do not invent or rewrite lines.
3. Use word-level timing data when available. If only sentence or phrase timings exist, derive word timings from the existing speech/audio and inspect representative moments; do not claim precise synchronization without checking it.
4. Apply a restrained premium style: legible bold sans-serif type, sentence case, white inactive words, warm gold on the currently spoken word, and subtle outline/shadow for contrast. Avoid heavy opaque boxes, excessive decoration, tiny type, and unnecessary motion. Keep captions away from faces, hands, important visuals, and common platform UI overlays.
5. Preserve vertical framing and source quality. Render to a new clearly named file in the existing project; do not overwrite the source master.
6. Inspect caption samples near the beginning, middle, end, and scene changes. Confirm the gold word tracks the speech, line breaks are readable, captions remain within frame, and graphics do not obscure important content. Decode the rendered file or otherwise verify that it plays through and report only checks actually performed.
7. Summarize the output path and material verification results. Do not upload, publish, or change platform visibility unless explicitly requested.

## Style decisions

When the user gives a visual direction (for example “premium” and “gold spoken words”), follow it directly. If a materially important choice remains unspecified, use the restrained style above rather than delaying straightforward work for minor preferences. Respect any existing caption design the user asks to retain.

## Rendering guidance

Use the project's existing renderer when practical. ASS/libass can support per-word color changes and positioning; use correct subtitle escaping and available local fonts. Do not add a dependency or download a font unless needed and permitted. Avoid changing scene visuals merely to make room for captions; adjust caption placement first, and make only minimal unobtrusive scene adjustments if the caption treatment otherwise blocks essential information.
