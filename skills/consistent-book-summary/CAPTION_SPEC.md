# Caption geometry and Dracula style contract

All tokens in every cue across the complete video share the **same single line box and baseline**. Do not animate words by changing top, translateY, font-size, line-height, vertical-align or font weight. Animate fill/opacity only. Wrap entire phrases with one layout calculation; never position individual tokens with independent y coordinates.

Use one pinned local font asset with known SHA256. If unavailable, fail rather than silently substitute.

For each caption cue: start_ms < end_ms, nonempty text, nonnegative token offsets, tokens inside cue bounds, no overlapping word highlights, and the same baseline_px as every other cue. Validate frame samples at first/middle/last word. Test letters with ascenders and descenders (e.g. 'g', 'p', 'T') for visual baseline drift.

Coordinates, font metrics, stroke and shadow must be measured from approved reference frames and recorded in STYLE_LOCK.md. Never label arbitrary default values as reference-matched.

## Current measured style lock

Inspection of decoded consecutive frames (0.8–1.9 s) from the hash-verified `Dracula_YouTube_Short_Painterly.mp4` shows a stationary left-aligned phrase whose active burgundy word advances in place as narration continues; the phrase does not scroll a rolling five-word window. There is no word scale, bounce, fade, or translation. The reference appears to use an Arial-like bold sans face. Exact font identity is not recoverable from compressed pixels.

At 1080×1920, use approximately: Arial Bold 56 px / weight 700, x=78 px, alphabetic baseline y=1368 px, native font space advance with no added tracking, 4 px warm-ivory outline, and a dark shadow at about 18% opacity with 1.5 px blur and (1,2) px offset. Inactive fill is #1d1b19; active fill is #7b2d3c; outline is #f7f1e7. A fixed warm-ivory caption plate behind words improves contrast over dark hook art; it stays in one position and does not follow the active word. The plate is a readability aid, not a measurement from Dracula. Values are calibrated estimates because H.264 and antialiasing obscure exact source raster parameters. Do not recreate the previous 10 px outline plus opaque 12 px shadow stroke; that treatment is visibly too thick.

Keep each timed cue's complete phrase visible until the next cue; highlight follows each word's supplied timing in place. Do not slide a rolling word window. Keep the 56 px type size for mobile readability. Use the same style values in FFmpeg/Pillow and Remotion. In Pillow, calculate natural text width per token and use the font's native space advance; in SVG, preserve one text node and one alphabetic baseline with native spaces and zero added word spacing. Highlight only the active word at its supplied timing, switching fill instantaneously with no movement or scaling. Keep the complete cue visible until the next cue. Use the stationary warm-ivory plate defined in `caption_style.json` where dark artwork would otherwise reduce legibility.

All renderers should consume `caption_style.json` as the style source of truth. Do not tune FFmpeg/Pillow and Remotion independently. Projects may map the style fields to their native text APIs but must preserve the same font asset, geometry, stroke, shadow, colors, spacing, and instantaneous timing behavior.
