# Caption geometry and Dracula style contract

All tokens in every cue across the complete video share the **same single line box and baseline**. Keep glyph positions fixed; do not change top, translateY, font-size, line-height, vertical-align or font weight between word states. At word boundaries, move only the burgundy highlight capsule to the next timed token. Wrap whole phrases with one layout calculation; never position tokens with independent baselines.

Use one pinned local font asset with known SHA256. If unavailable, fail rather than silently substitute.

For each caption cue: start_ms < end_ms, nonempty text, nonnegative token offsets, tokens inside cue bounds, no overlapping word highlights, and the same baseline_px as every other cue. Validate frame samples at first/middle/last word. Test letters with ascenders and descenders (e.g. 'g', 'p', 'T') for visual baseline drift.

Coordinates, font metrics, stroke and shadow must be measured from approved reference frames and recorded in STYLE_LOCK.md. Never label arbitrary default values as reference-matched.

## Current measured style lock

Consecutive decoded Dracula frames show a stationary left-aligned phrase with a single burgundy spoken-word highlight advancing at word boundaries. It does not use a moving background capsule. There is no bounce, scale, or caption translation. The reference appears to use an Arial-like bold sans face; exact font identity cannot be recovered from compressed pixels.

The reusable karaoke readability treatment uses 56 px bold text, x=78 px, baseline y=1368 px, native font spacing, 4 px dark outline and subtle shadow. Inactive words use warm ivory; the current word uses a burgundy rounded highlight with ivory lettering. The highlight snaps to each active word while the phrase remains stationary. This moving highlight capsule is a deliberate karaoke adaptation, not a pixel-exact Dracula element. It replaces the fixed caption plate because the user asked for a recognizable karaoke word-follow effect.

Keep each timed cue's complete phrase visible until the next cue. Never scroll a rolling word window. FFmpeg/Pillow and Remotion must use the same `caption_style.json`, fixed baseline, font asset, word timing, and per-word highlight geometry. Preserve the line's fixed x positions; only the active burgundy capsule changes position at word boundaries.

All renderers should consume `caption_style.json` as the style source of truth. Do not tune FFmpeg/Pillow and Remotion independently. Projects may map the style fields to their native text APIs but must preserve the same font asset, geometry, stroke, shadow, colors, spacing, and instantaneous timing behavior.
