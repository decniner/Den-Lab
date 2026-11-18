# Dracula series style lock v0.3

Status: **REFERENCE IDENTITIES LOCKED; DESIGN CALIBRATION PARTIAL**. The filenames and hashes are verified. Do not call this a pixel-exact numeric calibration.

## Verified reference provenance
Cover design reference: `A Room of One’s Own Legacy.png`
SHA256: `5a3c4fc5d24ab85e28b909f6247a4116d22e9c53faab4163bbdbfd7fe7f944e0`
Canvas: 941 × 1671. Large two-line black serif title at top, burgundy divider, centered serif author beneath; warm ivory textured ground; a polished expressive illustrated figure and detailed domestic setting below. Use this reference for hook-cover layout, typography and illustration quality.

Library reference: `Dracula_YouTube_Short_Painterly.mp4`
SHA256: `1c1744612f4d9aebbe37e2b450d843f825fc29ff1650684eba8fe30df3b32a9b`
Runtime: 161.47 seconds; 1080 × 1920; 30 fps.
Cover: `Dracula_Hook_Cover.png`
Cover SHA256: `2f1f7801f6908c62ca75c8b30b454397499bbae465eee21de05e9e322f162100`
Representative inspected frame times: 1, 8, 20, 40, 65, 90 seconds. Dracula references reside in the user's Library and the A Room cover reference is user-supplied locally; none are committed to this public repository.

## Observed visual contract
- Vertical canvas with a soft, warm, blurred beige/gray backdrop and generous negative space.
- Central near-square storybook illustrations with subtle shadow, usually located in the upper-middle region, not full-bleed backgrounds.
- Expressive, simplified, rounded, dark-outline characters (stickman-inspired faces) embedded in detailed painterly Victorian settings.
- Dominant 2–3-tone palette: warm ivory, charcoal black, and deep burgundy. Subtle within-family texture and shading are allowed; other hues must remain supporting accents, not a competing palette.
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
Exact font family/file and SHA256, font metrics, numerical caption coordinates, RGB/HEX palette, title box dimensions, animation curves, narration voice/speed, audio normalization, and exact numerical layout measurements. The A Room cover reference is 941×1671 and places a large two-line title above a burgundy rule and centered author, with the illustrated scene below. Measure exact pixel coordinates from source media before claiming pixel-exact reproduction.

## Validation gate
Exact reference identities are hash-locked in the example manifest. Use `A Room of One’s Own Legacy.png` as the authoritative hook-cover look and feel. The Dracula cover remains an exact series reference but does not override this cover direction. Use actual Dracula short frames for animated scene/caption style. Numeric typography, animation, audio, and caption calibrations remain partial; inspect and record measurements per project before claiming exact reproduction. A contact sheet and rendered comparison remain mandatory.
