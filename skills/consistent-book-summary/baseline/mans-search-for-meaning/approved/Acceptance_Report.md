# Final Acceptance Report — `consistent-book-summary`

**Production:** Rendered and privately uploaded. **Automated checks:** PASS. **Final-player check:** PARTIAL / UNVERIFIED. **Windows execution:** NOT TESTED.

This final revision changes only the expressions in 14 approved scene illustrations. It preserves the approved compositions, Kokoro female narration, timing, hook cover, caption implementation and caption fixtures. User approved the before/after artwork sheet before the render.

## References and branch

- Repository: `decniner/Den-Lab`, branch `feat/book-summary-reproducibility`; PR #40 was not merged.
- Reference files were present and their SHA-256 hashes matched the locked manifest: `Dracula_Hook_Cover.png` (`2f1f7801f6908c62ca75c8b30b454397499bbae465eee21de05e9e322f162100`), `Dracula_YouTube_Short_Painterly.mp4` (`1c1744612f4d9aebbe37e2b450d843f825fc29ff1650684eba8fe30df3b32a9b`), and `A Room of One’s Own Legacy.png` (`5a3c4fc5d24ab85e28b909f6247a4116d22e9c53faab4163bbdbfd7fe7f944e0`).

## Production and reuse

- Final file: H.264 1080×1920, 30 FPS, 4,293 frames, 143.100 seconds; AAC 48 kHz stereo.
- Revised/generated: expression-only edits for scenes 03, 04, 05, 06, 07, 08, 09, 10, 11, 14, 16, 19, 20 and 21. Scene compositions, poses, clothing and setting were retained. Final frame-review samples show solemn, worried or exhausted expressions in hardship scenes and restrained compassion in care scenes.
- Reused unchanged: the approved 1080×1920 hook cover, other 18 scene illustrations, Kokoro `af_heart` female narration (`lang_code="a"`), audio timing, caption implementation and visual design, and golden caption fixtures. No paid external service was called.
- The rendered cover frame matches the approved cover. Captions remain fixed at baseline 1368 px, use the approved word-by-word highlight, and have no separate background plate. Characters remain still.

## Validation

| Check | Result | Evidence |
|---|---|---|
| User visual gate | PASS | User approved expression-only edits for 14 scenes. |
| Caption/reference validators | PASS | Both validators passed; production manifest preflight passed after integration. |
| Regression tests | PASS | All 19 skill tests passed via `unittest`; `pytest` is not installed in this environment. |
| Render/decode | PASS | Full MP4 decoded without errors; 4,293 frames at 30 FPS, 1080×1920; duration 143.100 s. |
| Cover | PASS | Approved cover reused unchanged; first rendered frame inspected. |
| Caption style/highlighting | PASS | Shared caption contract and golden tests passed; rendered frame shows active-word color highlight at the fixed line position and no plate. |
| Scene/expression review | PASS | All 14 revised-scene output samples inspected; final artwork sheets rebuilt from the final 32 scene assets. |
| Black/missing frames | PASS | Full decode and frame count passed; black-frame scan found no black intervals. Still-image holds intentionally repeat frames; sampled revised scenes are distinct. |
| Audio gaps/clipping | PASS with limits | AAC decoded; peak −6.89 dBFS (no clipping headroom concern). At −50 dB, longest detected quiet interval was 0.861 s vs 0.846 s in source narration, consistent with source pauses. |
| End-to-end player playback | UNVERIFIED | QuickTime was opened on the output path but showed imagery inconsistent with direct extraction from the new MP4, likely a stale open file instance. Mac then locked, preventing a fresh player check. Direct MP4 decode and extracted-frame review passed; this report does not claim full subjective listening or phonetic alignment. |
| Windows PowerShell | **NOT TESTED** | This host is macOS; Windows is unavailable. Code inspection is not counted as execution. |

## YouTube review upload

- URL: https://www.youtube.com/watch?v=IAmhZeU_1GI
- Channel: Denver Sanchez (`UCcxnWEDK-VAuLEJCozxRHRA`)
- Visibility: **private**; YouTube upload status: **processed**; processing status: **succeeded**; YouTube duration: `PT2M24S`.
- Approved hook-cover thumbnail was applied; API readback returned `default`, `medium`, `high`, `standard`, `maxres`, and `shortsAspectRatio` variants.
- Earlier private editions remain unchanged.

## Deliverables

- MP4: `outputs/Mans_Search_for_Meaning.mp4` — SHA-256 `50119c570eba6ff0099b56f7ec3aeb47e072a5d12e71d4b21b080a37c48efd14`
- Hook-cover PNG: `outputs/Mans_Search_for_Meaning_Hook_Cover.png` — 1080×1920
- Final artwork contact sheet: `outputs/Artwork_Contact_Sheet.png` and readable parts 1–3
- Before/after expression review: `outputs/Expression_Correction_Contact_Sheet_Part1.png` through `Part3.png`
- Rendered-frame review: `outputs/Rendered_Frame_Review_Sheet.png`
- Video verification metadata: `outputs/Mans_Search_for_Meaning.verification.json`
- This report: `outputs/Acceptance_Report.md`
