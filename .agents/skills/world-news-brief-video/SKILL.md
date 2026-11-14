---
name: world-news-brief-video
description: Create suspenseful, fact-checked vertical current-affairs Reels for World News Brief with licensed moving footage, clear figures, synchronized captions, and a hook cover.
---

# World News Brief Video

Use this skill to build unpublished, premium 9:16 news Reels for World News Brief. It adapts the repository's stock-footage workflow to the series' short-form, high-tension editorial style. On Windows, use PowerShell and Windows paths; never rely on macOS paths or shell-only setup.

## Series style

- Default to 1080×1920, 30 fps, bright natural footage, and a 60–120 second runtime unless the story needs another length.
- Open with a spoken hook. Match it on the cover, with a dark cover-only overlay for contrast.
- Build suspense through stakes, contrast, pacing, and precise detail. Attribute reports. Do not invent urgency, consequences, threats, numbers, or certainty. A request, estimate, negotiation, proposal, and approved policy are different statuses; preserve the distinction in both script and graphics.
- Prefer real, relevant moving footage and fresh shots every 3–5 seconds. Match footage to the words being narrated: use crowds from the named country when the story addresses its residents or taxpayers. Stock footage is visual context, not proof of the reported event; record that distinction in the asset notes without adding an unnecessary spoken disclaimer.
- Keep maps only when geography helps the audience understand the story. Do not stretch maps or use them as filler. Do not darken footage to create urgency.
- Keep captions synchronized and near the upper portion of the frame. On-screen copy should be narration or a direct numeric rendering of a spoken figure. Show every material figure in large, readable numerals with a plain label and period (for example, total vs annual amount). Use comparisons that share the same units and time period.
- For amount cards over footage, use a translucent navy backing at 50% opacity (RGBA alpha 128 on an 8-bit channel), a clear outline, and high-contrast white/gold text. Keep the footage visible behind the card while preserving phone-size readability.
- Use restrained, licensed music under clear narration. Preserve the voice already approved for the series or specified in the active project instructions; never change it silently. Close with “Like, follow and share.”

## Research and script

1. Confirm the current story with primary sources where available and reliable reporting. Record the publisher, date, exact source URL, and the date checked. Use time-sensitive language appropriate to when the Reel will be viewed.
2. Draft an original script with a short hook, a simple explanation, attributed evidence, stakes, and a concise ending. Use plain language without making unsupported claims more frightening than the source supports.
3. For any speculative cost or tax illustration, state the assumptions in the narration and on screen. Show the calculation and source in the notes. Label it as a hypothetical, not a forecast or government plan. Do not turn a national total into an actual household bill without a sourced funding formula.
4. Plan the visual timeline against the recorded narration. Put important footage on the spoken phrase it illustrates, including named places and people. Avoid unrelated visuals during pauses.

## Windows production

- Start from a clean project folder such as `C:\Den-Labs\stock-footage-projects\<project-name>\`. Keep source media, render intermediates, and deliverables organized by episode.
- Run the sibling environment check at `.agents\skills\stock-footage-documentary\scripts\check_environment.ps1`. Follow that skill's [rendering guide](../stock-footage-documentary/references/rendering.md) and [provider and rights guide](../stock-footage-documentary/references/providers-and-rights.md) for Windows setup, licensed footage discovery, downloads, and the asset manifest. Do not scrape provider pages, bypass download controls, use undocumented CDN links, or use YouTube videos as stock.
- Use PowerShell-safe, project-relative paths. Check Python, Kokoro, FFmpeg, and FFprobe before rendering. Read secrets only from environment variables; never put API keys in scripts, prompts, or deliverables. Do not install system-wide software or use paid providers without authorization.
- Generate speech and word timings from the approved local Kokoro setup. Keep the chosen voice and settings in episode metadata. Render captions from actual timings, not estimated word durations.

## Deliverables and review

Save the MP4, cover, narration script, timed captions, post caption, title options, research sources, asset/license catalog, project inputs, and a verification report in the episode folder. Before delivery, check the opening and cover, every material figure, taxpayer/country footage alignment, transitions, captions, ending, full audio/video decode, dimensions, frame rate, duration, and speech/music balance. Inspect sample frames from the exported MP4. Report any check that could not be completed.

Keep the episode unpublished unless the user explicitly asks to upload it. An upload request authorizes preparing the upload, but verify the platform destination and the resulting post before claiming success.
