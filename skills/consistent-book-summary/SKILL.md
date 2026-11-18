---
name: consistent-book-summary
description: Create polished Stickman Storybook book-summary videos and matching hook covers in one recognizable visual identity. Use whenever the user asks to plan, script, generate, revise, or package a classic-literature summary for YouTube Shorts, Facebook Reels, or TikTok, especially when they ask for the Dracula or Virginia Woolf series look.
---

# Consistent Book Summary

Create each book summary as part of one repeatable Stickman Storybook series. Carry the visual identity across the cover, opening hook, scene illustrations, captions, and end card while changing the story-specific imagery for each title.

## Establish the reference

- Use the latest approved Dracula Short and its cream parchment, black, and deep burgundy cover as the visual reference when available. Also check the approved *A Room of One's Own* cover as the matching female-led variation.
- If those files are not available in the current workspace, ask the user to attach them or locate the exact existing project assets before creating a near-match. Do not pretend to have inspected missing references.
- Preserve the series' core design: warm aged-paper backgrounds, limited ivory/black/burgundy palette, fine inked outlines, restrained paper texture, elegant literary serif typography for titles, and expressive modern stickman/stickwoman characters dressed to fit the book's period.
- Use burgundy as an accent, not a blanket tint. Keep strong light-dark separation so the characters, props, and title remain readable on a phone.

## Story and script

- Verify the book's plot and distinguish plot events from interpretation. For nonfiction or essay collections, summarize the central argument and structure rather than inventing a conventional plot.
- Open by saying the full book title and author clearly. Follow with a short curiosity hook, then tell the story in a coherent beginning-to-ending sequence and close on the book's central idea or emotional payoff.
- Keep the requested runtime. For a 2–3 minute short, write narration to fit naturally at the requested speaking pace; estimate duration from spoken word count and leave room for pauses and transitions.
- Keep language clear when heard without visuals. Avoid dense literary jargon and misleading spoilers in the hook.
- Use the requested Kokoro voice when available. For this user's established preference, select a Kokoro female voice unless the user asks for a different voice. Do not substitute a paid cloud voice service when a local Kokoro workflow is requested.

## Visual sequence

- Make a vertical 9:16 video at 1080x1920 or higher, normally 30 fps, unless the user specifies otherwise.
- Build a scene plan from the narration before rendering. Change to new, story-specific rendered artwork about every 4–5 seconds, and sooner when the story scene changes. Do not reuse the same still as filler or duplicate the same composition across adjacent beats.
- Keep each scene visually distinct while retaining the same linework, palette, character design, lighting, texture, and period details. Reuse a character model consistently, but vary pose, framing, setting, props, and action to match the narration.
- Favor readable cinematic compositions: one clear focal action, purposeful foreground/background layers, restrained camera motion, and uncluttered negative space for captions. Avoid generic AI collage grids, random decorative elements, illegible text embedded in art, and sudden style shifts.
- Match story-specific scenes to the actual book. For *A Room of One's Own*, for example, use a woman narrator, a university/library boundary, Judith Shakespeare, a private room, writing tools, and the conditions Woolf argues women writers need. Do not reuse Dracula characters or gothic props just to force series similarity.

## Cover and typography

- Create a dedicated high-resolution vertical hook cover with the same parchment/black/burgundy identity. Show the exact book title prominently and the author's name beneath or nearby; spell-check all lettering.
- Adapt the central illustration to the book while preserving the series composition, border/ornament treatment, title hierarchy, and contrast. Keep the title large enough to read at phone size and inside safe margins.
- Keep the thumbnail distinct from the video opening art when useful, but make them clearly part of the same release.
- Do not rely on the platform to add the cover automatically. If asked to upload, set the custom thumbnail in the platform's creator studio and verify the saved thumbnail there.

## Captions and platform-safe layout

- Use clean karaoke-style captions synchronized to speech: highlight the current spoken word or short phrase, keep remaining words readable, and use a consistent font, size, stroke/shadow, and highlight color throughout the video.
- Keep captions in the central lower-safe region, above the bottom interface area and away from the right-side buttons and top title areas. Leave generous margins for YouTube Shorts, Facebook Reels, and TikTok overlays. Never place essential text at the extreme edges.
- Limit each caption line to a short phrase, use no more than two lines, and check readability against both light and dark scenes. Do not let captions cover faces, key plot objects, or the book title.

## Production and review

- Before rendering, confirm the script, scene-by-scene artwork plan, voice, caption style, runtime, and cover title agree with each other.
- Render and inspect the complete video, not only a still frame. Check title spelling, scene uniqueness and timing, character continuity, audio pacing, caption synchronization, caption safe zones, transitions, and export dimensions.
- Fix issues found in review and re-render. Preserve project files and final exports locally when requested. When uploading is requested, use the user's specified visibility and destination, then verify the final published/uploaded item and its custom cover.
- Report what was actually completed and distinguish a generated asset from one saved or published to a platform.

## macOS and Windows compatibility

- Make every project usable on both macOS and Windows. Do not embed machine-specific paths, home-directory names, drive letters, or shell-specific assumptions in prompts, project files, or commands.
- Prefer portable project-relative paths and standard media formats. In scripts, use cross-platform path APIs (for example, Python's `pathlib`) and avoid hard-coded path separators.
- When providing setup or render commands, label the shell and give working equivalents for macOS Terminal and Windows PowerShell when commands differ. Avoid requiring Bash, WSL, Homebrew, or a Windows-only package manager unless the user explicitly chooses it.
- Detect and use the tools already installed on the current machine. Check the executable is available before starting a render; give platform-specific installation steps only when a required tool is missing.
- Keep assets, project files, and output paths relative to the project folder by default. Make filenames safe on Windows (no reserved characters such as `: ? * < > | ` or trailing periods/spaces).
- Do not assume that a local Kokoro installation, model files, fonts, or FFmpeg installation is shared between machines. Check availability on the active machine and use the user's existing local setup when present.
- Avoid case-sensitive filename mismatches and verify the final project can locate all audio, image, font, and video assets on both operating systems.
