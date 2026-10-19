# Rendering and timing

## Inputs

Use a project manifest containing the selected clip path, provider, asset ID, creator, source page, acquisition method, license evidence, review status, source-in time, and scene duration. `download_url` is recorded for the optional documented API path; manual provider downloads leave it empty and record `downloaded_via_provider_ui: true`. Include the narration file and a UTF-8 SRT subtitle file. Scene durations must cover the measured narration duration after transition overlap.

## Clip treatment

- Use `ffprobe` to inspect each clip's duration, dimensions, frame rate, and codecs before rendering.
- Trim at the selected source-in point. Scale to fill the target frame, crop around the scene's important subject, normalize frame rate and sample aspect ratio, and encode H.264/yuv420p.
- Use a brief dissolve (default 0.25 seconds) only when the scenes and narration support it. Calculate overlap explicitly; the combined scene timeline is `sum(scene durations) - (scene count - 1) × dissolve duration`.
- For portrait, keep faces and key action near the center-safe area; avoid cropping hands, signs, or contextual detail. Inspect crop previews before final rendering.
- Burn captions in a stable high-contrast region with safe margins. Do not cover faces or critical footage. Keep caption phrases short and accurate; if word-level timestamps are unavailable, use phrase-level subtitles rather than claiming karaoke synchronization.
- Narration remains primary. Add music only when its license is documented and mix it low; use side-chain ducking or a manually checked level. Omit music if it reduces intelligibility.

## Renderer use

`scripts/render_documentary.py` accepts a manifest whose every clip has a completed human license review. It fails closed on missing files, unresolved rights, or a scene timeline that differs from narration duration. It uses the local FFmpeg and FFprobe executables and does not install packages.

Example:

```powershell
python .\scripts\render_documentary.py --manifest .\project.json --output .\deliverables\final.mp4
```

The renderer produces a technical MP4; it cannot judge factual correctness, footage relevance, rights beyond the recorded review, or whether the narration sounds good. Complete the human QA checklist before delivery.
