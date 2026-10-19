---
name: stock-footage-documentary
description: Create narrated educational or travel documentaries from real, licensed stock video clips; use for YouTube Shorts and landscape YouTube videos, not slideshow-only edits or unauthorized footage.
---

# Stock Footage Documentary

Create a polished, factual documentary from a topic using real moving footage whose usage rights have been checked. Use this skill when the user asks for a stock-footage-led YouTube video. Do not upload or publish unless separately requested.

## Defaults

- 60-second vertical Short, 1080×1920, 30 fps, English narration, global audience.
- Landscape requests use 1920×1080. Support durations from 30 seconds to 10 minutes.
- Use local Kokoro TTS when installed and configured. Inspect available voices and use a natural English voice; record the chosen voice and settings. Never silently substitute another voice if Kokoro is unavailable.
- Real, relevant moving footage is the primary visual. Use original titles, restrained transitions, legible captions, and optional properly licensed music. Do not replace unavailable footage with generated illustrations without telling the user and getting authorization.

## Workflow

1. Inspect the available Python, Kokoro, FFmpeg, FFprobe, and existing video assets. Read [rendering](references/rendering.md) before composing the render. Ask before system-wide installation or paid services.
2. Research the topic from credible sources. Verify every material claim, retain direct source URLs and access dates, and write an original narration with a hook, clear progression, and conclusion. Do not invent facts. Create one visual beat and a specific stock-search query per narration segment.
3. Discover candidate clips without an API by searching providers' public video pages in a browser. Use the official download control on the chosen asset page when the current terms permit. Do not scrape pages, automate around access controls, or fetch media from undocumented CDN links. API discovery is an optional automation path: use `scripts/discover_footage.py` with authorized Pexels or Pixabay credentials in environment variables when available.
4. Review every chosen clip's asset page and applicable license. Inspect for people, logos, artwork, private locations, sensitive context, and other third-party rights. A search result or API record does not prove every required release. Record creator, original page, acquisition method, license URL and version/date, download date, restrictions, attribution, and human review outcome in the manifest. For manual downloads, leave `download_url` empty and set `downloaded_via_provider_ui` to `true`; do not use unresolved assets.
5. Download only selected clips after license review. For the manual route, use only the provider's own download control; for the optional API route, use the approved downloader. Preserve the original source file and record a checksum. Keep cached assets for reuse; do not redownload unchanged assets. Never scrape provider search pages, bypass access controls, or fetch videos from YouTube.
6. Generate narration with the configured local Kokoro workflow. Measure the actual audio duration and align scene durations and captions to it. Keep normal speech pacing; revise the script or scene plan instead of speeding the voice unnaturally.
7. Validate the complete manifest with `scripts/validate_manifest.py`. Create a short proof render when the tools and cleared assets are available. Then render with `scripts/render_documentary.py`, using real video clips, scene-matched crops, a restrained dissolve, and readable captions.
8. Inspect the exported video and audio, including representative frames, transitions, captions, speech intelligibility, clipping, duration, and dimensions. Run the technical checks in [quality assurance](references/quality-assurance.md). Fix observed issues and rerender. State anything that could not be checked.
9. Deliver the MP4, narration script, timed subtitle file, source and license manifest, research references, title/description/tags, and a QA report in `C:\Den-Labs\stock-footage-projects\<project-name>\`. Keep intermediate assets sufficient to reproduce the edit. Never publish automatically.

## Provider/API boundaries

Read [provider and license notes](references/providers-and-rights.md) before discovery. No API key is required for the manual browser workflow. API keys are only needed for automated API discovery/download helpers. Check current provider terms for every project. A general provider license does not automatically clear a depicted person's publicity rights, trademarks, artwork, or location restrictions.

## Failure handling

- If one provider fails, record its error without exposing keys and continue with the other enabled provider.
- If there is no suitable clip, unresolved license/release status, or missing local renderer/voice, stop at that boundary and explain the smallest next step. Lack of an API key alone is not a blocker: use manual provider-page discovery. Never silently substitute footage, images, audio, or a voice.
- Do not log credentials or store them in the project. Read API keys only from `PEXELS_API_KEY` and `PIXABAY_API_KEY` environment variables.
- Do not upload, schedule, or change visibility as part of generation.
