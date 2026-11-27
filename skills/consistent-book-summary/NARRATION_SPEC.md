# Narration and opening contract

For every new book-summary production, the first spoken sentence is exactly:

`[Book Title] by [Author]. A book summary in under 3 minutes.`

Replace the bracketed fields with the title and author exactly as shown on the cover. Speak the sentence at the start of the narration track (time zero), then immediately begin the summary. Do not insert a hook, greeting, transition, or other words between this sentence and the summary. The matching caption cues must render every word in the same order, with the final word `minutes.` including its period. `scripts/validate_opening.py` enforces the opening narration and caption tokens; `production.py` runs it as part of the fail-closed production gate.

## Approved legacy recordings

Previously approved masters are immutable. Their narration/caption inputs are hash-locked and tested against their actual words and punctuation. In particular, the approved *Meditations* master predates this contract and uses `minutes:`. Keep that historical colon intact; all productions created after this rule must use `minutes.`.

## Voice and runtime

Use the series-approved local Kokoro female voice `af_heart`, `lang_code: "a"`, speed `1.0`, with narration beginning at frame zero. Keep the total rendered duration strictly below 180 seconds, including the opening. The opening counts toward the runtime; do not append extra duration for it. Keep the verified 1080×1920, 30 FPS delivery.
