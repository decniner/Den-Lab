---
name: world-news-brief-reels
description: Create polished, fact-checked vertical news Reels for World News Brief with moving footage, purposeful maps, Adam narration, synchronized captions, and a hook cover.
---

# World News Brief Reels

Use this skill to produce or revise short, narrated World News Brief videos for social platforms. Favor a dramatic newsroom pace while keeping each claim and visual grounded in the reporting.

## Workflow

1. **Inspect the established production setup.** Read the project instructions, the relevant prior episode, and its renderer, assets, timings, and output notes. Reuse working local infrastructure where it fits; do not assume a prior renderer or media path is portable without checking it. For moving-footage shorts, use the `youtube-create3` workflow when it is available, adapting the voice, pacing, and graphics to the project brief.
2. **Verify the story.** Check current reporting close to production time. Prefer official or primary sources for statements and data, then reliable reporting for context. Record source URLs and check dates. Preserve who made each claim, its time period, geography, and whether it is an observation, estimate, or forecast. Keep projections distinct from confirmed counts and do not turn uncertainty into inevitability.
3. **Write the narration first.** Open with a short, accurate hook, then build a clear sequence of evidence, stakes, and payoff. Use tension and vivid specifics without inventing danger, certainty, or consequences. Attribute claims naturally in the spoken copy. Avoid filler disclaimers and generic caveats; make scope clear through the actual place, date, population, or forecast being described. For example, say where an event happened and who reported the figure rather than adding a broad warning that the story is not nationwide.
4. **Plan the visual sequence around the words.** Use fresh, relevant moving footage, typically changing shots every 3–5 seconds. Do not reuse a source clip within a Reel or reuse the same clips across multiple Reels in one set. Keep a source catalog with creator, source page, download URL when available, license, and whether the image is illustrative. Do not present stock footage as verified footage of the reported event. Keep that distinction in production notes and choose visuals that cannot reasonably be mistaken for specific evidence; do not add an unnecessary spoken disclaimer.
5. **Use maps only when they explain the story.** Add a map to establish a named place, route, regional scope, or comparison when that context helps viewers understand the narration. Do not use maps as visual filler, especially immediately after a hook. Match the map to the words being spoken; use accurate boundaries and markers, preserve geographic proportions, and never stretch a map. Prefer footage over repeated map cards when the narration is not explaining geography. During pauses, hold the previous relevant visual or make an intentional transition; never let a gap fall through to an unrelated or default map.
6. **Keep the style premium and legible.** Deliver portrait 9:16 video (normally 1080×1920). Use bright, natural footage; do not apply an overall dark grade. Use a dark overlay on the separate hook cover for readable title text. Cover wording should be the same hook the narrator says. On-video text should be limited to the narrator’s words, shown as synchronized captions with readable white text and restrained gold word highlighting. Avoid unrelated labels, decorative copy, and fabricated interface screens.
7. **Narrate and mix carefully.** For World News Brief, use the established Adam voice (`am_adam`) through the available local Kokoro setup, normally `/Users/decniner/.local/share/kokoro/venv/bin/python` with American English `lang_code="a"`. Generate real word timings for captions. If that voice or environment is unavailable, report the blocker instead of silently changing voices. Use only properly licensed music, mixed softly beneath speech.
8. **Finish the package.** Save the rendered MP4, hook cover, narration, authored script, synchronized captions, post caption, source list, asset catalog, and reproducible project files in a story-specific output folder. The usual close for this page is “Like, follow and share.”

## Review before delivery

- Confirm portrait dimensions, frame rate, duration, and complete audio/video decoding; check audio peaks and speech/music balance.
- Inspect the opening, the hook-to-story transition, map/footage transitions, caption phrases and pauses, and ending. Check for blank frames, frozen tails, repeated clips, accidental map inserts, or words on screen that the narrator does not say.
- Confirm the hook cover is readable on a phone and its wording matches the spoken hook.
- Recheck factual claims against the source notes. Keep time-sensitive status dated in the narration when viewers could otherwise mistake an old incident for a live one.
- Keep drafts unpublished unless the user explicitly asks to publish. If publishing is requested, follow the relevant platform workflow and verify the destination and resulting post.
