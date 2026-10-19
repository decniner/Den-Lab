---
name: youtube-create3
description: Use when creating or revising a finished premium vertical narrated short with real moving footage, smooth transitions, and continuous word-synchronized captions, especially when the user requests youtube-create3 or wants moving video instead of still images.
---

# Premium moving short

Produce the rendered video, not only a script or storyboard. Build an editorial moving-footage edit with natural narration, restrained typography, and steady, readable karaoke captions. Use the established local production setup where practical. Read [production notes](references/production.md) when reusing the working renderer or implementing caption and transition timing.

## Defaults

- 80 seconds, vertical 1080 x 1920, 30 fps, H.264 MP4 with AAC audio. Follow a different duration or format if requested.
- Microsoft Edge `en-US-AndrewNeural`, natural default rate. Reuse narration unchanged when revising visuals unless the user requests a script or voice change. Measure audio before setting scene timings; a short intentional closing hold is acceptable. Do not accelerate speech unnaturally or stretch a short script with long silence.
- Real moving footage with purposeful shot changes, coherent grading, and clean composition. Prefer relevant licensed free clips. Moving subjects are essential: a slow zoom on a still photograph does not fulfill a request for moving video.
- Dark navy or charcoal, warm white, and restrained gold accents unless another direction is requested. Use deliberate typography and negative space, with separate regions for titles, action, and captions.
- White inactive caption words; only the currently spoken word turns gold. Use bold readable sans-serif around 64-76 px, short phrases, at most two lines, and a stable dark backing or gradient. Keep captions above bottom controls and clear of right-side icons, faces, and important objects.

## Production

1. Inspect the existing project, dependencies, narration assets, and timing data. Preserve prior outputs; save the revision to a clearly named new folder and MP4.
2. Adapt the message for a truthful opening and coherent conclusion. Consider three hook options internally and select the strongest accurate one. Verify medical, financial, and other material factual claims against authoritative sources; save URLs and access dates. Do not fabricate outcomes, statistics, testimonials, or quotations.
3. Generate and measure narration with Edge word-boundary events. Check that timing tokens match the authored script, including restored punctuation. Fit the visual edit to the measured voice. If Andrew fails, troubleshoot the existing free setup and reusable assets before substituting another free English voice; report any substitution.
4. Obtain relevant moving clips and save their source pages and license terms. Inspect the actual footage before use. Use a varied shot sequence, often changing composition every 3-5 seconds while giving important information time to register. Reframe landscape footage carefully; do not crop away the action to force a vertical format. Avoid unrelated footage and implied model or brand endorsements.
5. Use restrained cross-dissolves, typically 0.3-0.4 seconds, and softly changing titles. Keep typography stable independently of footage. Account for overlapping transition frames so the final runtime remains correct. Show charts or explanatory graphics only when they aid understanding; calculate displayed figures with code.
6. Keep each full caption phrase continuously visible through pauses between words. Highlight with the actual word's start/end timestamps, returning it to white during pauses. Use a brief phrase transition around 0.1 seconds, with no blank interval or word-level disappearance. Do not fade the whole caption on every word. Keep layout fixed while highlights change.
7. Render using free local tools such as FFmpeg and Python. Reuse installed dependencies, media, and narration. Do not purchase credits, activate paid trials, subscribe, or create billable resources. If suitable moving media is unavailable for free, complete a purposeful original motion-graphics version and disclose the substitution; do not pass animated stills off as live-action footage. Add music only with a suitable license and keep it comfortably beneath narration.

## Verification and delivery

- Confirm the requested runtime within one frame, resolution, frame rate, and decoded frame count. Decode the entire video and audio stream; check audio peak levels for clipping.
- Inspect exported frames at the opening, ending, scene transitions, phrase changes, and gaps between spoken words. Check phone-size legibility, text collisions, unobstructed faces/action, and readable important assumptions.
- Verify captions have continuous coverage during narration, no more than two lines, and accurate word highlighting. Compare separated frames within each shot to confirm that the delivered footage actually moves.
- For visual-only revisions, verify the original narration asset is unchanged. Watch and listen to the full export when playback is available; clearly state unavailable checks.
- Save the MP4, narration, script, timed captions, source/license notes, reproducible rendering files, three titles, description, five hashtags, and a concise substitutions/limitations record. Include calculation code/results when the content uses calculated figures.
- Deliver a clickable local MP4 link and its exact absolute path and filename. Do not upload publicly unless explicitly requested.
