# Somewhere in Japan fixes — report

## Mobile tab layout fix

**Root cause:** the active tab itself was not scaled and the HTML viewport is correctly set to `width=device-width, initial-scale=1`. The squeezed content came from nested gutters: `.field-atlas-section` and its `.atlas-panel` children both added horizontal padding, then `.city-origin-results`, `.city-origin-plan`, and `.city-route-shared` each added another inset. In `styles.css`, the existing small-screen rules did not remove those inner insets or reflow the route heading/map controls and stop-card article layout. The hidden-panel MapLibre map also needed a resize when its tab becomes visible. The photo fallback text was hidden in the markup but the mobile CSS changed its `display`, overriding the browser's `[hidden]` behavior.

**Changes:** `styles.css` now gives the atlas one consistent 20px phone gutter, removes redundant panel padding, stacks the route banner, expand button, map, stop cards, and day-trip form, and restores native hidden behavior for the photo error message. `city-route-map.js` refits/resizes after the tab is shown, keeps mobile map attribution compact, and fans nearby markers apart. `city-route-ui.js`, `city-origin-ui.js`, and `atlas-ui.js` connect resize handling to tab activation. Cache versions were advanced in `index.html`. Desktop rules were left in place.

**Real mobile viewport measurements:** Edge DevTools Protocol device emulation (`mobile: true`, DPR 1, 844px height), measured after render. “Main column” is the visible tab panel; the city plan's route/map/story widths are also noted where useful.

| Viewport | Explore Japan column | Explore overflow | Plan from a city column | Plan overflow |
|---:|---:|:---:|---:|:---:|
| 360px | 320px | No | 320px (route 320px; map/story 288px) | No |
| 390px | 350px | No | 350px (route 350px; map/story 318px) | No |
| 412px | 372px | No | 372px (route 372px; map/story 340px) | No |
| 430px | 390px | No | 390px (route 390px; map/story 358px) | No |

The tabs are side by side, fully visible, and 56px high at each width. The day-trip form is one column with full-width controls; the route expand button is 48px high. At 390px, the route order remains on one line, and the five route markers are 30px circles; the overlapping start/01/02 cluster is shown with 38px vertical spacing. A successfully loaded Tokyo Station photo has no visible failure message; the credit remains below the photo.

**Regression checks (Edge, locally served page):**

- **PASS** — direct `#daytrips` load selects Plan from a city; both tabs switch in both directions.
- **PASS** — Tokyo starts at one day; entering three days produces three separately headed daily plans. Kyoto and Naha each render their city plan and set `?origin=kyoto` / `?origin=naha`.
- **PASS** — MapLibre canvas and five markers load; attribution is compact; Expand/Close map updates its state and restores the page; zoom control exists; five per-leg Open directions links are present.
- **PASS** — route and photo stop-card screenshots were captured at 390px after the fix. The stop image fills the card and the loaded image's fallback is hidden.
- **PASS** — full-page overflow scan at 360px and 390px in both tabs: document width equals viewport and no visible child extends beyond it.
- **PASS** — desktop comparison at 1280px: `width=device-width` viewport, mobile media query inactive, route map and stop list retain the existing side-by-side layout (434px map, 355px stop card). No desktop-specific CSS was changed.
- **NOT RECHECKED IN THIS LAYOUT PASS** — nationwide search, mood/region filters, Save/Share state, and the Tokyo finder filtering logic were not changed by this layout patch; their regression flows were not replayed in this browser pass.

**Screenshots:** [Before: route](docs/fix-evidence/mobile-before-route-390.png) · [After: route](docs/fix-evidence/mobile-after-route-390.png) · [Before: stop](docs/fix-evidence/mobile-before-stop-390.png) · [After: stop](docs/fix-evidence/mobile-after-stop-390.png).

**Known limit:** Map street labels and the OpenFreeMap attribution naturally remain dense on a phone-sized street map; the attribution stays compact in the lower corner. The site uses a schematic visit-order line and explicitly labels it as not a verified walking or transit alignment.

**Result:** The encoding, icon, count, provisional-guide, origin-scope, map-pin, carousel, modal, accessibility and responsive defects are fixed and checked. All 310 destinations retain their photos. 149 images have source pages that identify the destination; the other 161 remain as clearly labeled illustrative photography, with existing source and credit metadata preserved. Seasonal month picks are safely withheld because none of the 310 records has structured month-specific rationale. The complete photo and guide research gaps remain visible below.

## Issue status

| Issue | Status | Changes and verification |
|---|---|---|
| P0 — text encoding corruption | **FIXED** | Repaired the five numeric ranges in `index.html`; corrected the damaged Inuyama and apostrophe strings in `destination-photo-expansion.js`; added integrity checks in `tests/fix-brief-integrity.test.cjs`. UTF-8 is declared by the HTML. The source/output scan finds zero digit-quote-digit and word-internal question-mark patterns. |
| P0 — question-mark icon placeholders | **FIXED** | Removed the meaningless placeholder from `app.js`; repaired the city-highlight separator in `city-origins.js`; fixed the Inuyama copy. Icons used decoratively are hidden from assistive technology. The known placeholder patterns have zero matches. |
| P0 — mismatched destination photography | **PARTIALLY FIXED** | Audited every record and added the reproducible source-page audit in `tools/audit-place-photos.cjs`, full `PHOTO_AUDIT.md`, `data/photo-audit.json` and generated `destination-photo-audit.js`. All 310 destination photos remain visible. 149 images have source-page evidence matching the destination and show photographer, license, and source attribution; the other 161 remain clearly labeled as illustrative, location unverified. Existing photo source and credit metadata are preserved. No source page positively proved a wrong place, so none is labelled WRONG. The remaining limitation is that source metadata was checked programmatically; every image was not visually inspected. |
| P1 — 180 vs 310 count contradiction | **FIXED** | The catalogue has 310 unique destinations in nine regions. `app.js` now fills displayed counts from `DESTINATIONS.length`; the stale “180” copy is gone. Catalogue result counts remain computed from the filtered data. |
| P1 — provisional guides presented as complete | **FIXED** | `tools/build-destination-guides.cjs` now emits `complete` or `provisional`, creates `destination-guide-status.js`, and updates `guide-links.js`, the cards and dialogs to show the honest state. Current status: **0 complete, 310 provisional**. The stub-page disclaimers remain. |
| P1 — seasonal shortlist recommends unsupported months | **PARTIALLY FIXED** | `seasonal-eligibility.js` requires both the selected month and a month-specific rationale; `app.js` no longer uses generic season copy as a substitute. The all-month checks pass, with **0 eligible picks in each month** because no destination currently has structured `monthReasons`. The UI explains why picks are withheld. Source-backed month research is still needed to populate this feature. |
| P1 — Tokyo tools leak into other origins | **FIXED** | `city-origin-ui.js` removes the Tokyo-only comparison details for other origins and restores them for Tokyo. Browser checks: Kyoto, Sapporo and Haneda Terminal 3 showed no Tokyo tools; Tokyo showed them. |
| P2 — map pins overlap | **FIXED** | Southwest and central pins in `index.html` are spaced with leader lines; `styles.css` gives every target a 46×46 px hit area and visible keyboard focus. Browser checks at 360, 390 and 768 px found no pin overlap; closest centers were 50 px apart at 360 px. Natural Earth public-domain credit remains. Clicking Okinawa updated the panel to “28 places in this region.” |
| P2 — hero carousel has no controls | **FIXED** | Added labelled carousel slides and previous/next/start/pause controls in `index.html` and `app.js`. It uses up to nine verified, credited destination photos; it does not rotate until requested, pauses on hover/focus and disables rotation for reduced-motion settings. |
| P2 — place-story defects | **FIXED** | Gallery requests use one request ID and one loading-to-result/error state; opening another story or closing invalidates an old request. Contact text is no longer clamped. Native dialog keyboard checks confirmed focus remains inside on Tab and Shift+Tab, Escape and the close button close it, and focus returns to its trigger. |
| P3 — headings, keyboard, focus, contrast and responsive behavior | **FIXED** | Seasonal route stop headings use h5; the slash shortcut ignores input, textarea, select and editable controls; the skip link and global focus styles remain. Muted atlas copy was darkened: on cream, atlas intro text improved from 4.03:1 to 4.96:1, map deck text from 4.05:1 to 5.25:1, and eyebrow labels from 3.58:1 to 5.46:1. At 360/390/768 px the document had no horizontal overflow; the 390 px hero and atlas were visually inspected. |

## Encoding and placeholder proof

- Before: five numeric ranges used U+201C in place of a dash; Inuyama copy included `Inuyama ? Aichi` and `Japan?s oldest`; the city-highlights heading used a bare question mark as a separator.
- After: the automated source/data checks report **0** digit + quote + digit matches, **0** word-internal question marks in destination text, and **0** matches for those three known placeholder strings.
- HTML declares `<meta charset="utf-8">`. No additional HTTP encoding layer exists for this static GitHub Pages project.

## Catalogue and guide coverage

- True catalogue size: **310 unique places**, across nine regions.
- Count source of truth: `DESTINATIONS.length` in the browser app; visible count nodes use `data-place-count`.
- Guides: **0 complete / 310 provisional**. Current guide manifest: `data/coverage-manifest.json`.

## Photo audit totals

| Verdict | Count | Display action |
|---|---:|---|
| CORRECT | 149 | Keep with Commons source, photographer, license and alt text |
| WRONG | 0 | No source page positively identified another place |
| UNVERIFIABLE | 161 | Keep photo as illustrative and label the location as unverified |

“CORRECT” is based on place identification in source-page title, caption or categories. This is source evidence, not a visual inspection of image pixels. See `PHOTO_AUDIT.md` for all 310 rows.

## Seasonal checks

| Month | Automated result |
|---|---|
| January | PASS — 0 eligible picks |
| February | PASS — 0 eligible picks |
| March | PASS — 0 eligible picks |
| April | PASS — 0 eligible picks |
| May | PASS — 0 eligible picks |
| June | PASS — 0 eligible picks |
| July | PASS — 0 eligible picks |
| August | PASS — 0 eligible picks |
| September | PASS — 0 eligible picks |
| October | PASS — 0 eligible picks |
| November | PASS — 0 eligible picks |
| December | PASS — 0 eligible picks |

The check enforces month membership and a non-empty rationale for every returned pick. It does not treat an empty result as seasonal research.

## Browser and regression QA

- Responsive widths: **360, 390 and 768 px**. No document horizontal overflow. Nine map targets were 46×46 px at each width. 390 px hero and map screenshots were captured during inspection.
- Tokyo-only scope: **Kyoto, Sapporo, Haneda Terminal 3 and Tokyo**; Tokyo tools absent in the first three and present in Tokyo.
- Search: “onsen” returned 10 places; an impossible query showed “No places match that search here”.
- Food mood filter showed 45 matches. Local Finds turned on and cleared. “Discover more places” increased visible cards from 12 to 24.
- Save: header count became 1, saved view showed 1 place, and it remained after reload.
- Share: copied `?month=9&days=week&region=all&style=balanced` and announced “Link copied”.
- Tokyo budget: the shared `budget=1000` state showed “No verified time and budget match.” The share URL kept its selected query values.
- Modal: focus containment, Escape, close button and focus restoration were checked in Edge.
- Existing route, city-origin, guide-link and external-destination tests passed; full direct test-file suite: **all 15 test files passed**. Tests were run one file at a time because this environment blocks Node's parallel test workers with `EPERM`.

## Remaining work / limits

1. **Photo visual review:** the audit verifies source-page text and attribution, but cannot establish that every pixel depicts the caption. Unverifiable photos remain visible as illustrative imagery with their location status disclosed.
2. **Seasonal research:** all month-specific picks are withheld until supported rationale is added to destination data.
3. **Field-guide depth:** no guide meets the generated completeness schema yet, so all 310 correctly display provisional status. This change does not invent missing costs, contacts, access details or other research.

The map, carousel and corrected Share button were browser-checked locally. The site is published at [Somewhere in Japan](https://decniner.github.io/Den-Lab/SomeWhereInJapan/index.html); the page and both new overlays returned HTTP 200 after the GitHub Pages workflow succeeded for commit `7fb352c`.
