# Approved caption lock

**Authoritative render:** `outputs/Mans_Search_for_Meaning_Test_10s_CaptionNoBackground.mp4`
**SHA-256:** `692ff3815eea7bbe23ba4254cd37546afe50d70b0b9d713d2cf6348a4600802d`
**Authoritative implementation:** commit `2b7f753` on `feat/book-summary-reproducibility`
**Video format:** 1080×1920, 30 FPS, 10.000 seconds. The hash-verified Dracula video informed the caption behavior; the approved Frankl render locks these concrete values and pixels.

## Locked appearance and behavior

- Typeface: alias `BookSummaryCaption`, bound to `public/assets/Arial-Bold.ttf` (SHA-256 `d72db21f9242aedd6b917d8549ad5921766b24d5f8d0becfda2ff4c620b3c2e0`), weight 700, size 56 px.
- Position: x=78 px; alphabetic baseline y=1368 px; native font spacing; no added tracking.
- Inactive fill: charcoal `#1d1b19`.
- Active spoken word fill: burgundy `#7b2d3c`.
- Outline: warm ivory `#f7f1e7`, 4 px, round joins.
- Shadow: `rgba(35,28,25,0.176)`, blur 1.5 px, offset (1,2) px.
- Karaoke timing: keep the complete timed phrase stationary; only the currently spoken word changes to burgundy at its supplied word interval. All glyphs stay on the same baseline and retain their x/y positions throughout the cue.
- No caption background plate or template.

These settings are locked to `caption_style.json`; do not redesign or independently tune them. Explicitly prohibit caption background plates/templates, rolling or scrolling word windows, moving text, per-word translation, bounce, scaling, fades, baseline drift, and unapproved font family/size/weight/spacing/outline/shadow/color changes. A change requires a new approved video and replacement of the golden fixtures with approval.

## Renderer parity

`caption_style.json` is the only style source. Remotion imports it in `components/Caption.tsx`. FFmpeg/Pillow must load the same project-relative JSON and apply its values directly; do not duplicate or override caption constants. Both renderers must use the same pinned font asset and cue/word timestamps. The FFmpeg/Pillow renderer in the approved project reads this same JSON file. Compare the project and skill copies when changing projects; their parsed JSON must match.

## Visual regression fixtures

Five PNG crops in `tests/fixtures/captions/` are decoded directly from the authoritative MP4 at 0.40, 0.80, 1.20, 1.60, and 1.85 seconds. They show “Viktor”, “Frankl’s”, “Man’s”, “Search”, and “for” highlighted in turn. `approved_frames.json` records the source SHA-256, sample time, crop, word region, stable glyph bounds, and a background probe. `test_caption_visual_regression.py` verifies the active burgundy fill is strongest in the expected word region, caption glyph bounds stay pixel-identical, and the background probe remains the original dark artwork rather than a plate. These golden images may only be replaced alongside an explicitly approved caption render.
