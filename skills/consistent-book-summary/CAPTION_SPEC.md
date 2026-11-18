# Caption geometry and Dracula style contract

All tokens in every cue across the complete video share the **same single line box and baseline**. Do not animate words by changing top, translateY, font-size, line-height, vertical-align or font weight. Animate fill/opacity only. Wrap entire phrases with one layout calculation; never position individual tokens with independent y coordinates.

Use one pinned local font asset with known SHA256. If unavailable, fail rather than silently substitute.

For each caption cue: start_ms < end_ms, nonempty text, nonnegative token offsets, tokens inside cue bounds, no overlapping word highlights, and the same baseline_px as every other cue. Validate frame samples at first/middle/last word. Test letters with ascenders and descenders (e.g. 'g', 'p', 'T') for visual baseline drift.

Coordinates, font metrics, stroke and shadow must be measured from approved reference frames and recorded in STYLE_LOCK.md. Never label arbitrary default values as reference-matched.

## Current measured style lock

Inspection of decoded consecutive frames (0.8–1.9 s) from the hash-verified `Dracula_YouTube_Short_Painterly.mp4` shows a stationary left-aligned single line. The active word changes fill immediately to burgundy; there is no word scale, bounce, fade, or translation. The reference appears to use an Arial-like bold sans face. Exact font identity is not recoverable from compressed pixels.

At 1080×1920, use approximately: Arial Bold 50 px / weight 700, x=78 px, alphabetic baseline y=1368 px, native font space advance with no added tracking, 4 px warm-ivory outline, and a dark shadow at about 18% opacity with 1.5 px blur and (1,2) px offset. Inactive fill is #1d1b19; active fill is #7b2d3c; outline is #f7f1e7. Values are calibrated estimates because H.264 and antialiasing obscure exact source raster parameters. Do not recreate the previous 10 px outline plus opaque 12 px shadow stroke; that treatment is visibly too thick.

Keep the full 50 px type size for mobile readability. Use the same style values in FFmpeg/Pillow and Remotion. In Pillow, calculate natural text width per token and use the font's native space advance; in SVG, preserve one text node and one alphabetic baseline with native spaces and zero added word spacing. Highlight only the active word at its supplied timing, switching fill instantaneously with no movement or scaling.

All renderers should consume `caption_style.json` as the style source of truth. Do not tune FFmpeg/Pillow and Remotion independently. Projects may map the style fields to their native text APIs but must preserve the same font asset, geometry, stroke, shadow, colors, spacing, and instantaneous timing behavior.
