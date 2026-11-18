# Caption geometry contract

All tokens in a caption beat share a **single line box and baseline**. Do not animate words by changing top, translateY, font-size, line-height, vertical-align or font weight. Animate fill/opacity only. Wrap entire phrases with one layout calculation; never position individual tokens with independent y coordinates.

Use one pinned local font asset with known SHA256. If unavailable, fail rather than silently substitute.

For each caption cue: start_ms < end_ms, nonempty text, nonnegative token offsets, tokens inside cue bounds, no overlapping word highlights. Validate frame samples at first/middle/last word. Test letters with ascenders and descenders (e.g. 'g', 'p', 'T') for visual baseline drift.

Coordinates, font metrics, stroke and shadow must be measured from approved reference frames and recorded in STYLE_LOCK.md. Never label arbitrary default values as reference-matched.
