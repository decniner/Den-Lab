# All Destination Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Bring all 310 Japan destination pages to the polished field-guide presentation, with accurate place content, useful maps, and the v0.5 label.

**Architecture:** Generate the remaining page shells from a shared static builder that reads the existing HTML, photo audit, identity, location, and route data. Keep individually researched multi-stop routes; use an explicitly identified single-place map when no route sequence is supported. Preserve source and license metadata and do not synthesize factual details.

**Tech Stack:** Static HTML, CSS, JavaScript, JSON, Node.js, PowerShell, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-24-all-destination-guides-design.md`

## Global Constraints

- The catalogue contains 310 destinations.
- The finished guide version is `v0.5`.
- Keep the current fonts, colors, mobile behavior, and no-key Google Maps URL approach.
- Use only source-backed route points, phone numbers, lodging facts, and photo attribution.
- Show destination precision honestly: destination-level, nearby, or area-level.
- Keep the existing 23 researched multi-stop routes intact unless a correction is source-supported.
- Do not add or run tests; use static inspection, syntax validation, diff checks, and page/data counts only.

## Review Focus

- A single destination marker could be mistaken for a walking route: label the map as a place locator and show no route connectors.
- Area-level coordinates could be mistaken for an entrance: label approximate area references clearly.
- Unverified image credit could be mistaken as reuse permission: retain only verified attributions or explicitly avoid false attribution.
- A destination with a multi-stop route could be downgraded to a locator: preserve and link its researched route record.
- Version or asset query strings could be inconsistent: check the homepage and all 310 guides for v0.5 and current CSS/route UI references.

---

### Task 1: Catalogue audit and generation inputs

**Files:**
- Read: `SomeWhereInJapan/places/*/index.html`
- Read: `SomeWhereInJapan/data/destination-identities.json`
- Read: `SomeWhereInJapan/data/destination-map-locations.json`
- Read: `SomeWhereInJapan/data/photo-audit.json`
- Read: `SomeWhereInJapan/data/place-routes.json`
- Create: `SomeWhereInJapan/scripts/build-all-field-guides.mjs`

- [ ] Extract each existing guide's title, descriptive copy, current image and credit, location map markup, travel links, and contact/stay fields.
- [ ] Match records by canonical destination ID and emit an inventory for all 310 pages, including missing/ambiguous fields.
- [ ] Keep per-place source and credit data as supplied; never infer a phone or exact entrance from an area centroid.

**Static verification:** inventory contains 310 unique IDs and page paths; all missing fields are counted.

### Task 2: Build a reusable field-guide page for the remaining catalogue

**Files:**
- Modify: `SomeWhereInJapan/scripts/build-all-field-guides.mjs`
- Modify: `SomeWhereInJapan/places/<remaining-id>/index.html`

- [ ] Use the latest field-guide composition: small version, editorial hero, place story, visit sequence/map, getting there, contact/stay, and field notes.
- [ ] Keep existing place-specific narrative and any verified exact point or route; remove repeated generic placeholder copy.
- [ ] Render single-point map records as location references; do not imply a visit sequence where none exists.
- [ ] Provide Google Maps route/search actions, YouTube search, and directly linked available visitor sources.
- [ ] Use useful large mobile text and preserve existing image/photo credit when valid.

**Static verification:** remaining pages use the shared composition, preserve titles and canonical URLs, and contain no mojibake introduced by generation.

### Task 3: Resolve place-photo gaps

**Files:**
- Modify: `SomeWhereInJapan/data/photo-audit.json`
- Modify: `SomeWhereInJapan/places/<id>/index.html`
- Modify: `SomeWhereInJapan/scripts/build-all-field-guides.mjs`

- [ ] For each unverifiable photo, search Commons for a clearly matching image and verify file page, author, and reuse license.
- [ ] Replace only when the match and license are supported; otherwise keep the current unique image and disclose its status without calling it a verified destination photo.
- [ ] Recompute uniqueness across the full set and retain direct source-page links.

**Static verification:** photo rows and generated page image references match for all 310 places; duplicates and uncredited/unknown-license rows are explicitly reported.

### Task 4: Fill route/map coverage without overstating research

**Files:**
- Modify: `SomeWhereInJapan/data/place-routes.json`
- Modify: `SomeWhereInJapan/place-route-ui.js`
- Modify: `SomeWhereInJapan/places/<id>/index.html`

- [ ] Preserve all existing multi-stop route sequences and source notes.
- [ ] Add only source-backed named stops where trustworthy source material exists.
- [ ] Ensure every remaining destination has an interactive location map and accurate precision label; a locator is not represented as a route.
- [ ] Ensure directions buttons open Google Maps and do not exceed platform-supported waypoints when constructing a route.

**Static verification:** all 310 places resolve to a destination map; all existing multi-stop routes still have matching stop and map IDs.

### Task 5: Version, cache, and publish

**Files:**
- Modify: `SomeWhereInJapan/index.html`
- Modify: `SomeWhereInJapan/places/*/index.html`
- Modify: `SomeWhereInJapan/tools/templates/destination-guide.html`
- Modify: shared CSS/JS query versions as needed.

- [ ] Set the small visible version to `v0.5` on the home page and every destination field guide.
- [ ] Refresh stylesheet and route-script cache references on every page that loads those shared assets.
- [ ] Run static checks: `node --check` for the generator/shared scripts, JSON parse/count inspection, and `git diff --check`.
- [ ] Commit the complete catalogue update and push to `origin main`; confirm GitHub Pages serves v0.5.

**Completion criteria:** 310 destination pages share the field-guide presentation and visible version, maps resolve with honest precision, existing routes remain present, and all usable images retain unique URLs and visible source attribution.
