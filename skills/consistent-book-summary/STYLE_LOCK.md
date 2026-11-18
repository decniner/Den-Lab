# Style lock v0.1 (pending reference calibration)

Status: **UNVERIFIED**. This document is deliberately not a claim that the Dracula reference has been inspected.

## Mandatory reference gate
Before any scene generation, locate the approved full Dracula video and approved cover. Record paths, hashes, and five or more timestamped frame samples in `reference-manifest.json`. If absent, STOP. Do not hallucinate palette, character proportions, transitions, or fonts.

## Established constraints from SKILL.md
- Vertical 1080x1920, 30 fps unless requested otherwise.
- Captions: heavy black bold text, warm-ivory thick outline, dark soft shadow, burgundy active word; left aligned below illustration.
- Maximum two caption lines; prefer one short phrase. Position within lower safe area and clear of platform UI.
- Story-specific scenes every ~4–5 seconds, with continuity of rendering style.
- Kokoro voice, female by default unless overridden.
- No paid service substitution without permission.

## Values to calibrate from footage
Fill and approve before marking LOCKED: exact color HEX values; font file and SHA256; font size and weight; outline width; shadow offset and blur; caption anchor x/y; line height; illustration bounding box; scene transition duration; character reference sheets; texture reference; narration voice and speed.

## Drift policy
Every production logs a style-lock version and reference hashes. If a value is unknown, do not fabricate it. Visual checks require human review of generated artwork even if geometry checks pass.
