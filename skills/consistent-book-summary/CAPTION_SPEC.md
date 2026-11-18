# Caption geometry and Dracula style contract

All tokens in every cue across the complete video share the **same single line box and baseline**. Keep glyph positions fixed; do not change top, translateY, font-size, line-height, vertical-align or font weight between word states. At word boundaries, switch only the active word fill to burgundy; do not add a backing plate or highlight capsule. Wrap whole phrases with one layout calculation; never position tokens with independent baselines.

Use one pinned local font asset with known SHA256. If unavailable, fail rather than silently substitute.

For each caption cue: start_ms < end_ms, nonempty text, nonnegative token offsets, tokens inside cue bounds, no overlapping word highlights, and the same baseline_px as every other cue. Validate frame samples at first/middle/last word. Test letters with ascenders and descenders (e.g. 'g', 'p', 'T') for visual baseline drift.

Coordinates, font metrics, stroke and shadow must be measured from approved reference frames and recorded in STYLE_LOCK.md. Never label arbitrary default values as reference-matched.

## Current measured style lock

Consecutive decoded Dracula frames show a stationary left-aligned phrase with a single burgundy spoken-word highlight advancing at word boundaries. It does not use a moving background capsule. There is no bounce, scale, or caption translation. The reference appears to use an Arial-like bold sans face; exact font identity cannot be recovered from compressed pixels.

The reusable caption treatment uses 56 px bold text, x=78 px, baseline y=1368 px, native font spacing, a 4 px warm-ivory outline and subtle dark shadow. Inactive words use charcoal; the active spoken word changes fill to burgundy. Keep the full cue phrase stationary. Do not add a background plate or capsule; readability comes from the font size, outline, and shadow.

Keep each timed cue's complete phrase visible until the next cue. Never scroll a rolling word window. FFmpeg/Pillow and Remotion must use the same `caption_style.json`, fixed baseline, font asset, word timing, and per-word fill treatment. Preserve the line's fixed x positions; only the current word changes fill at word boundaries.

All renderers should consume `caption_style.json` as the style source of truth. Do not tune FFmpeg/Pillow and Remotion independently. Projects may map the style fields to their native text APIs but must preserve the same font asset, geometry, stroke, shadow, colors, spacing, and instantaneous timing behavior.
