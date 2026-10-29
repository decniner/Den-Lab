---
name: create-low-poly-philosophy-films
description: Use when the user requests a philosophical human–AI animated film like The Space Between Seconds, or a reference with white low-poly characters, alternating close-ups and dark scientific or cosmic cutaways. Also use for simple, funny human–AI conversations on other subjects in this approved film style.
---

# Create Low-Poly Philosophy Films

Produce an original, voiced animated film in the approved visual language: sculptural white characters in a bright space, alternating with luminous diagrams on charcoal. Preserve the reference's visual contrast and conversational rhythm.

## Production contract

- Use a faceted human, an original robot with a restrained teal face accent, a shared table and a recurring physical prop. Alternate wide shots and speaker close-ups; use restrained gestures and camera movement.
- Put abstract cutaways on near-black backgrounds with fine light lines and small warm accents. Use clean sans-serif speech captions and a serif title. Follow the supplied reference before any generic style default. This style has no 90% near-white area target.
- Default to 1080 × 1920, 30 fps, H.264/AAC stereo; target 120–180 seconds. Let an effective exchange run longer naturally. Use local Chatterbox Turbo with Peter Yearsley for the human and Caro Davy for the AI, reflective pauses and a short ending hold. Use the CC0 reference recordings documented in the narration reference.
- Show one spoken word at a time, preserving authored punctuation. Default to 44 px at y=920 on the internal 720×1280 canvas: 66 px at y=1380 in a 1080×1920 export. Clear text in speech gaps; reveal nothing before its acoustic onset. These settings are about 29% larger and 153 output pixels higher than the previous layout. Check actual playback overlays before promising clearance.
- Use simple everyday words and short sentences by default, as if explaining the idea to a five-year-old without talking down to the audience. Use familiar examples and light jokes; simplify diagram labels as well as dialogue. Treat supernatural or villain premises as pretend stories, not claims about the AI.
- Start with a concrete human experience, let the human challenge the AI, connect it to a larger question and return with changed meaning. Keep humor light and specific to the subject when requested. Separate science, uncertainty and metaphor. When discussing AI, do not imply present systems have private desires or can guarantee what future systems will do. End with an open question.
- When the brief asks for a grumpy, reluctant AI, make the reluctance unmistakable in the performance and dialogue: begin with an annoyed sigh or complaint, have the AI push back before answering, add dry subject-specific jokes, and let its patience soften only slightly by the ending. Keep the human warm and playful so the contrast carries the comedy. The grumpiness is a fictional performance choice, not a claim that AI systems have feelings.
- Use original dialogue, characters and animation. Credit a specific reference when used. Keep music off by default, matching the approved film's voice-led treatment. Do not promise award-level quality or commercial voice rights.
- Add occasional story-specific sound effects only where an action calls for them. Record each cue's event, approximate time, and target loudness in the cue sheet; effects should be clearly audible on a phone speaker while remaining below dialogue. After mixing, listen to the exported video at normal playback volume and check each cue window in the rendered audio. Do not treat the existence of an SFX track or waveform as proof that viewers can hear it. Keep pauses quiet and avoid a constant effect bed.
- Keep faces clear. In shared shots with the supplied camera, reserve the upper y=100–280 area for flat cards and icons; heads occupy roughly y=320–560 on the internal 720×1280 canvas. Keep table props in the central gap. Recheck these regions if the camera changes. Never place sticky notes, calendars, keys, or music notes over a face.
- End on the final spoken question. Do not add an ending title or credits card unless requested; set `tail_seconds` to 0 and `closing_lines` to an empty list. Keep any needed credits in metadata or production notes.
- Map every spoken beat to a concrete, subject-relevant image or action. Build a shot-by-shot storyboard before rendering; avoid generic motifs that are merely relabeled. Inspect representative early and late frames from each dialogue turn, then inspect exported frames and repair any mismatch.
- Prepare a concise, accurate video title and description with a clear synthetic-media disclosure. Create a matching cover image with one bold, centered subject word or short hook, and check it at phone size. Keep the cover and metadata with the production deliverables.

## Make the film

For the approved easy-word, light-humor version, read [simple-conversation.md](references/simple-conversation.md). It includes a reusable working preset from “If You Were the Devil?” and a face-clearance check. Use its story as an example; write fresh dialogue and matching visuals for other subjects.

Read [production.md](references/production.md) for the project schema and scenes, and [chatterbox.md](references/chatterbox.md) for local narration setup, references, acoustic word timing and pronunciation repairs. Use the bundled working renderer; create each production outside the skill directory.

```bash
python3 <skill-dir>/scripts/make_film.py init --project <absolute-project-dir>
```

1. Replace `dialogue.json` and update `film.json` together. Change the title, personal anchor, ending, scene choices and credit for a new film. The included story is the approved example, not a mandatory plot.
2. Install the CPU dependencies in the narration reference, then check FFmpeg/FFprobe and fonts. Run `validate`, `setup-voice`, `audio`, then `samples` with the same `--project` argument.
3. Inspect `contact.jpg` and full-size previews. Check actual white character shots and dark cutaways, phone-readable captions, contrast and scene meaning. Improve weak frames before rendering.
4. Run `render`. It produces the MP4 and verifies full decoding, duration, dimensions, stereo sound, speech presence and caption integrity. Inspect `export_contact.jpg`, including the ending; do not substitute source previews for exported-frame inspection.
5. Save the MP4, one-word cover, dialogue, captions and verification report in the requested output location. Deliver a playable/downloadable link with duration. If a Library tool is available and in scope, preserve its identity for revisions.

For a requested voice or caption audition, use a separate project with roughly 30 seconds of complete exchanges; keep its export separate from the current full film.

Read the output and fix errors before claiming completion. Preserve TLS verification. Narration failure is a blocker; never silently substitute a silent film. Caches fingerprint text and voice settings; do not reuse old narration after a script change. An OS project lock permits only one producer and releases automatically on exit; its leftover filename does not mean a producer is active.

## Publishing

Upload or publish only when the current user request authorizes it. Discover a supported YouTube connector first; otherwise use an available browser and its secure authentication/upload guidance. Verify the channel, upload status, visibility and resulting video URL. A request to upload can be completed privately when no publication visibility is specified; make it public only when explicitly requested. Apply a requested custom thumbnail in Studio, save, refresh, and confirm the expected cover is still displayed. An API success or the presence of thumbnail variants alone does not prove that the intended image is selected in Studio. If Studio requires an audience setting to save, choose accurately from the content and ask when uncertain. Report any sign-in blocker plainly. Creating a film alone does not authorize publishing it.

## Common fixes

| Problem | Action |
| --- | --- |
| Another all-white/pencil style activates | Follow this reference-matched contract for this film |
| Graphics cover faces | Move cards and icons into the upper safe area; inspect full-size shared shots and run the face-clearance helper with the supplied camera |
| Weak diagram contrast | Inspect light strokes against the charcoal canvas at phone size |
| Captions appear early or cover controls | Use acoustic onsets and the single-word caption selector; inspect the raised position in exported frames |
| A spoken word is clipped or mispronounced | Regenerate that turn with a new configured seed, then rerun alignment and rendering |
| Captions lose punctuation | Keep authored tokens and align them to speech boundaries |
| Narration sounds stale | Change text/settings and let the fingerprint invalidate the cache |
| Sound effects are present but hard to hear | Raise those cues in the mix, replay the exported cue windows at normal volume, and confirm they remain below dialogue |
| New visual subject is unsupported | Copy the renderer to the production directory and adapt that local copy |
