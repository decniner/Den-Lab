---
name: consistent-book-summary
description: Create polished Stickman Storybook book-summary videos and matching hook covers in one recognizable visual identity. Use whenever the user asks to plan, script, generate, revise, or package a classic-literature summary for YouTube Shorts, Facebook Reels, or TikTok, especially when they ask for the Dracula or Virginia Woolf series look.
---

# Consistent Book Summary

Create each book summary as part of one repeatable Stickman Storybook series. Carry the visual identity across the cover, opening hook, scene illustrations, captions, and end card while changing the story-specific imagery for each title.

## Establish the reference

- Use the latest approved Dracula Short as the primary series reference and the approved *A Room of One's Own* Short as the female-led variation. The videos themselves are the references; a hook cover, contact sheet, or written style description alone cannot establish the full video look.
- Before generating artwork, locate and open the exact approved reference video files or exact published videos. Record which source was inspected. If only a cover or a few stills are available, state that limitation and do not claim a full-video match.
- Inspect a contact sheet of the actual footage: the opening/title, at least three body moments including a scene change and a captioned shot, and the ending. Note the actual framing, art medium, linework, texture, character proportions and faces, palette and contrast, lighting, typography, caption placement, camera motion, and transitions. Do not infer these details from memory or from this skill's prose.
- If the exact reference video cannot be located or opened, stop before image generation and ask the user to provide the video or identify its exact local, Library, or published source. Do not fill the gap with a generic interpretation such as ornate parchment borders, painterly realism, or a palette copied from the cover.
- When the image-generation tool accepts reference images, attach representative inspected frames on every scene-art generation. If it cannot accept references, use the observed-frame notes as constraints and compare the generated test frame side by side with the references before continuing.
- Make one test frame first. Compare it directly with both approved videos and correct any mismatch in rendering style, character design, composition, or caption treatment before generating the rest. Recheck representative frames after rendering; visual continuity means matching the actual videos, not merely sharing colors or a book theme.
- Derive the series' visual rules from the inspected reference footage. Do not assume parchment backgrounds, an ivory/black/burgundy palette, ink or gouache rendering, serif titles, stick figures, ornate borders, or any other treatment unless it is visibly present in the approved videos. Covers may use a different treatment from the video scenes; do not transfer cover styling to footage without evidence.
- Match the reference's real color balance, contrast, character rendering, backgrounds, framing, typography, and caption treatment. Keep essential faces, props, and text readable on a phone without changing the established look.

## Story and script

- Verify the book's plot and distinguish plot events from interpretation. For nonfiction or essay collections, summarize the central argument and structure rather than inventing a conventional plot.
- Open by saying the full book title and author clearly. Follow with a short curiosity hook, then tell the story in a coherent beginning-to-ending sequence and close on the book's central idea or emotional payoff.
- Keep the requested runtime. For a 2–3 minute short, write narration to fit naturally at the requested speaking pace; estimate duration from spoken word count and leave room for pauses and transitions.
- Keep language clear when heard without visuals. Avoid dense literary jargon and misleading spoilers in the hook.
- Use the requested Kokoro voice when available. For this user's established preference, select a Kokoro female voice unless the user asks for a different voice. Do not substitute a paid cloud voice service when a local Kokoro workflow is requested.

## Visual sequence

- Make a vertical 9:16 video at 1080x1920 or higher, normally 30 fps, unless the user specifies otherwise.
- Build a scene plan from the narration before rendering. Change to a new, story-specific rendered artwork about every 4–5 seconds, and sooner when the story scene changes. Do not reuse the same still as filler or duplicate the same composition across adjacent beats.
- Keep each scene visually distinct while retaining the same linework, palette, character design, lighting, texture, and period details. Reuse a character model consistently, but vary pose, framing, setting, props, and action to match the narration.
- Favor readable cinematic compositions: one clear focal action, purposeful foreground/background layers, restrained camera motion, and uncluttered negative space for captions. Avoid generic AI collage grids, random decorative elements, illegible text embedded in art, and sudden style shifts.
- Match story-specific scenes to the actual book. For *A Room of One's Own*, for example, use a woman narrator, a university/library boundary, Judith Shakespeare, a private room, writing tools, and the conditions Woolf argues women writers need. Do not reuse Dracula characters or gothic props just to force series similarity.

## Cover and typography

- Inspect the exact published hook cover or thumbnail of the approved reference video. Do not assume a generated cover file is the cover that was actually used on YouTube or Facebook.
- Create a dedicated high-resolution vertical hook cover for the new title, matching the approved cover's actual composition, illustration treatment, colors, border, typography, and title hierarchy. Show the exact book title and author, spell-check all lettering, and keep them readable within phone-safe margins.
- If the exact approved cover cannot be found, ask for its source before claiming or attempting an exact match.
- Keep the thumbnail distinct from the video opening art when useful, but make them clearly part of the same release.
- Do not rely on the platform to add the cover automatically. If asked to upload, set the custom thumbnail in the platform's creator studio and verify the saved thumbnail there.

## Captions and platform-safe layout

- Use clean karaoke-style captions synchronized to speech: highlight the current spoken word or short phrase, keep remaining words readable, and use a consistent font, size, stroke/shadow, and highlight color throughout the video.
- Keep captions in the central lower-safe region, above the bottom interface area and away from the right-side buttons and top title areas. Leave generous margins for YouTube Shorts, Facebook Reels, and TikTok overlays. Never place essential text at the extreme edges.
- Limit each caption line to a short phrase, use no more than two lines, and check readability against both light and dark scenes. Do not let captions cover faces, key plot objects, or the book title.

## Production and review

- Before rendering, confirm the script, scene-by-scene artwork plan, voice, caption style, runtime, and cover title agree with each other. Include a visual-reference match check against the inspected approved video frames.
- Render and inspect the complete video, not only a still frame. Check title spelling, scene uniqueness and timing, character continuity, audio pacing, caption synchronization, caption safe zones, transitions, and export dimensions.
- Fix issues found in review and re-render. Preserve project files and final exports locally when requested. When uploading is requested, use the user's specified visibility and destination, then verify the final published/uploaded item and its custom cover.
- Report what was actually completed and distinguish a generated asset from one saved or published to a platform.

## macOS and Windows compatibility

- Make every project usable on both macOS and Windows. Do not embed machine-specific paths, home-directory names, drive letters, or shell-specific assumptions in prompts, project files, or commands.
- Prefer portable project-relative paths and standard media formats. In scripts, use cross-platform path APIs (for example, Python `pathlib`) and avoid hard-coded `/` versus `\\` path concatenation.
- When providing setup or render commands, label the shell and give working equivalents for macOS Terminal and Windows PowerShell when the commands differ. Avoid requiring Bash, WSL, Homebrew, or a Windows-only package manager unless the user explicitly chooses it.
- Detect and use the tools already installed on the current machine. Check the executable is available before starting a render; give platform-specific installation steps only when a required tool is missing.
- Keep assets, project files, and output paths relative to the project folder by default. Make filenames safe on Windows (no reserved characters such as `:`, `?`, `*`, `<`, `>`, `|`, or trailing periods/spaces).
- Do not assume that a local Kokoro installation, model files, fonts, or FFmpeg installation is shared between machines. Check availability on the active machine and use the user's existing local setup when present.
- Avoid case-sensitive filename mismatches and verify the final project can locate all audio, image, font, and video assets on both operating systems.
