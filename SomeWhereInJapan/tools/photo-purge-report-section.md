
## Photo purge

### Audit result

- **359 photo placements/slots audited:** 310 catalogue destinations, 44 city-route stop records, and 5 day-trip guide heroes.
- **196 kept, 13 replaced, 150 removed.** In the 310-place catalogue, 163 photos remain (150 kept and 13 verified replacements); 147 destinations now show no photo because no destination-specific image with complete, matching source, credit, license, and alt text could be established. Three of five day-trip heroes are also photo-free for the same reason.
- Every retained catalogue and guide photo carries an explicit verified: true record with source page, credit, license, and image-specific alt text. The runtime renders it only when the record is complete and internally consistent. Removed records have no current image URL and are not emitted into the rendered photo catalog.
- Existing photo-less cards use the site's abstract CSS treatment; no new place-like artwork was added. The map illustrations are non-photographic SVGs and the visual pattern claims no real location.
- Audit detail: PHOTO_AUDIT.md. It records each catalogue surface, prior URL for replacements/removals, current URL, source page, credit, license, verdict, and alt text, plus city-route and day-trip records.

### Confirmed offenders from this prompt

- **Shiretoko's wild edge — REPLACED:** a view identified by its source page as Shiretoko National Park, credited to Trengarasu (public domain), with alt text naming Mount Io, Mount Shiretoko, and the Sea of Okhotsk.
- **Furano in bloom — REPLACED:** Farm Tomita lavender in Nakafurano, by Kentagon (CC BY-SA 4.0).
- **Kamakura, temple to tide — REMOVED:** the Asakusa Kaminarimon image was removed; no destination-specific Kamakura replacement met the source standard in this pass.
- **Edo-Tokyo Open Air Architectural Museum — REMOVED:** the dialog's repeated Kaminarimon image was removed.
- **Kawagoe, the little Edo — REPLACED:** Kurazukuri Street in Kawagoe, by Dandy1022 (CC BY-SA 4.0).
- **Shuri, Ryukyu memory — REMOVED:** the photo and alt-text mismatch was removed rather than guessed at.
- **Great Buddha of Kamakura — KEPT:** the actual Kotoku-in Daibutsu image remains, with its verified Commons source, ProtoplasmaKid credit, CC BY 4.0 license, and photo-specific alt text. The false unverified badge is gone.

The earlier-review offenders were rechecked too: Tottori Sand Dunes, Yamadera, Kiso Valley, Hakodate from above, and Hirosaki in blossom were removed; Otaru Canal, Hiraizumi, Lake Toya, and the Blue Pond of Biei were replaced with destination-specific Commons photos; Nikko's Shinkyo Bridge photo remains verified. Their exact source records and old URLs are in PHOTO_AUDIT.md.

### Regression guard and verification

- **PASS** — node tests/photo-purge.test.cjs: 6 tests passed, 0 failed. Checks complete records and unique URLs across catalogue places, all 44 city-route records, static guide/day-trip markup, confirmed offenders, empty frames, and forbidden labels.
- **PASS** — node tests/photo-purge-browser.cjs against the active checkout: catalogue count is 310; all 207 unique current destination, city-route, and day-trip photo URLs loaded; no JavaScript runtime errors; Furano photo and source attribution render in card and dialog; Kamakura's card/dialog render photo-free; saved-place toggling persists and filters; region/mood filters, Share feedback, month results, tab switching, Tokyo route plan, and Nikko field guide work.
- **PASS** — No horizontal overflow at 360, 390, 412, or 430 CSS pixels. Desktop interaction checks ran at 1280 pixels.
- **PASS** — Repository scan found no "Illustrative image; location not verified", "ILLUSTRATIVE IMAGE", "IMAGE / UNVERIFIED", or "Photo could not be loaded" treatment in rendered place/photo surfaces. The photo verification gate cannot emit an unverified photo.
- **PASS** — Exact mojibake sentinel scan for U+00C3 U+0192 and U+00E2 U+201A U+00AC returned zero matches. Place names, stories, guide statuses, and route data were not edited by the photo-only static-page transformer.
- **PASS** — Node syntax checks passed for edited JavaScript modules and audit utilities.
- **LIMIT** — Browser layout/interaction checks used local headless Chromium, not physical devices. Image availability was checked from this environment; a visitor's network or Commons availability can still vary. Runtime error handlers remove the image and its frame cleanly if an image later fails to load.
- **LIMIT** — The catalogue still contains existing non-photographic CSS patterns when a photo is absent; these are deliberately abstract and do not depict or claim to depict a destination.
