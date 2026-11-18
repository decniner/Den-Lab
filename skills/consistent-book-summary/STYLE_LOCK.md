# Dracula series style lock v0.2

Status: **REFERENCE INSPECTED; NUMERIC DESIGN CALIBRATION PENDING**.

## Verified reference provenance
Library reference: `Dracula_YouTube_Short_Painterly(2).mp4`
SHA256: `1c1744612f4d9aebbe37e2b450d843f825fc29ff1650684eba8fe30df3b32a9b`
Runtime: 161.47 seconds; 1080 × 1920; 30 fps.
Cover: `Dracula_Hook_Cover_Painterly.png`
Cover SHA256: `570a3ed4cb2ea107c7f785671c7d7d6f5f924b71c15e7fbf1a2302983bc01c0d`
Representative inspected frame times: 1, 8, 20, 40, 65, 90 seconds. Reference files reside in the user's Library; they are not committed to this public repository.

## Observed visual contract
- Vertical canvas with a soft, warm, blurred beige/gray backdrop and generous negative space.
- Central near-square storybook illustrations with subtle shadow, usually located in the upper-middle region, not full-bleed backgrounds.
- Expressive, simplified, rounded, dark-outline characters (stickman-inspired faces) embedded in detailed painterly Victorian settings.
- Palette dominated by warm cream, sepia/brown, charcoal/black, and dark burgundy/red.
- Select scenes include an off-white rounded title panel near the top with compact burgundy eyebrow text and heavy black headline; not every scene repeats it.
- Captions appear directly below the central illustration, left aligned near the illustration's left edge. Heavy black bold lettering with light outline/shadow, burgundy highlighted spoken word. Avoid independently positioned word baselines.
- Scene compositions include castle approach, candlelit interiors, stormy ship, and character close-ups; each new book must use its own story-relevant scenes while preserving this illustration language.
- Scene images are visually sharp against the deliberately soft surrounding canvas. No ornate borders or full-frame parchment page texture.

## Fixed technical contract
- 1080 × 1920, 30 fps unless explicitly overridden.
- Use one shared caption renderer, shared baseline and shared font asset across all words.
- Use local Kokoro where available; do not infer the exact reference voice from visual frames.
- Do not substitute a generic photorealistic image style for the expressive storybook characters.

## Still unverified
Exact font family/file and SHA256, font metrics, numerical caption coordinates, RGB/HEX palette, title box dimensions, animation curves, narration voice/speed, audio normalization, and exact cover layout. Measure these from source media/project files before claiming pixel-exact reproduction.

## Validation gate
Reference footage has now been located and visually inspected. However, the example manifest remains unapproved. Do not change its status to LOCKED without completing numerical calibration and review. A 10-second comparison render is still required before production approval.
