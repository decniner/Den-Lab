# Tokyo Brochure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Tokyo destination guide into a testable three-route travel brochure without changing the published site during implementation.

**Architecture:** Keep the existing Tokyo canonical page and generator. Add a separate, Tokyo-only route collection data file, render its editorial sections into the guide’s initial HTML, and mount one shared map view per route. Keep the existing city planner’s route data independent.

**Tech Stack:** Static HTML, CSS, JavaScript, Node.js guide generator, existing MapLibre/route UI, Google Maps direction URLs.

**Spec:** `SomeWhereInJapan/docs/superpowers/specs/2026-10-24-tokyo-brochure-design.md`

## Global Constraints

- Do not redesign the entire site, the national atlas, or the trip planner.
- Do not change the SomeWhere in Japan brand or rename the repository/path.
- Do not include unrelated `sijdev` material.
- Do not invent opening hours, transit schedules, visit durations, route geometry, accessibility, or costs. Unknowns remain visibly unknown or are omitted.
- Do not label schematic stop connectors as verified walking directions.
- Do not introduce paid APIs, API keys, accounts, backend services, or a new runtime dependency.
- Keep the existing Tokyo guide URL and avoid breaking current inbound links.
- Do not publish or merge this branch as part of the design/implementation work.

## Review Focus

- District routes remain separate; the page must not imply one continuous cross-city day.
- Map lines must not look like verified walking/transit paths when they only show stop order.
- Google Maps URLs must preserve every stop and segment long routes contiguously if required.
- Photo failure or missing attribution must leave a clear fallback and source credit.
- Mobile route/map layouts must remain readable and usable with keyboard and touch.

---

### Task 1: Add a Tokyo brochure route data source

**Files:**
- Create: `SomeWhereInJapan/data/tokyo-brochure-routes.json`
- Modify: `SomeWhereInJapan/docs/superpowers/plans/2026-10-24-tokyo-brochure.md` only if research changes a committed route decision.

**Interfaces:**
- Produces: `{schemaVersion: 1, routes: TokyoBrochureRoute[]}`, with exactly three routes keyed `east-tokyo`, `central-tokyo`, and `west-tokyo`.
- Each route contains title, short editorial introduction, research state, ordered stops, source records, route-specific photo metadata, map data status, and a Google Maps directions target.
- Each stop carries a stable ID, display name, map position and source, concise editorial detail, and explicit unknown duration status where no source supports an estimate.

- [ ] Review primary destination/transport sources for the three agreed clusters; record source URL and checked date for material claims.
- [ ] Add the route records with the agreed stops. Use only existing verified photo provenance or newly source-checked images; do not reuse one route's hero image for all three.
- [ ] Mark map connectors as schematic stop order unless route geometry has been verified from suitable pedestrian/transit sources.
- [ ] Check the data is internally consistent by reviewing each route’s order, photo credits, and Google Maps destination sequence.

### Task 2: Render the route brochure in the existing Tokyo guide

**Files:**
- Modify: `SomeWhereInJapan/tools/build-destination-guides.cjs`
- Modify: `SomeWhereInJapan/tools/templates/destination-guide.html`
- Modify: `SomeWhereInJapan/places/tokyo-in-layers/index.html` (generated output)
- Modify: `SomeWhereInJapan/city-route-ui.js` only if required to give each map instance unique accessible IDs.
- Create: `SomeWhereInJapan/tokyo-brochure.js` only if the existing generator/map interface requires a Tokyo-specific controller.

**Interfaces:**
- The generator adds the Tokyo route sections from the route data source to initial HTML; it must not add empty Tokyo sections to other guide pages.
- Each route section has a stable route ID, ordered stop list, map host/fallback, directions action, and associated source/photo credits.
- Existing shared route UI receives one route and its route-specific map data per section; each rendered map gets unique DOM and accessibility IDs.

- [ ] Add the Tokyo-only route collection to the generated guide after the editorial introduction and before practical arrival notes.
- [ ] Render three independently scannable route sections with dedicated route imagery, stop sequence, map, Google Maps button, and research-status notes.
- [ ] Keep the legacy Tokyo overview text consistent with the three clusters; remove the old four-stop cross-city sequence.
- [ ] Ensure map and stop list show the same stop order. Keep a semantic list and directions links available if map scripts fail.
- [ ] Add responsive styles using existing site tokens; avoid altering non-Tokyo guide appearance.
- [ ] Regenerate the Tokyo page from its actual source data so a later build does not erase the brochure.

### Task 3: Provide a testable preview

**Files:**
- Use: `SomeWhereInJapan/places/tokyo-in-layers/index.html` from the feature branch as the exact preview page.
- Modify: no production files outside the approved branch.

**Interfaces:**
- The preview is the generated Tokyo guide itself, not a separate mockup or duplicate page.
- The user can load the full branch locally so relative styles, scripts, map data, and images resolve.

- [ ] Provide a direct GitHub source link to the branch page.
- [ ] Provide checkout and local-server steps: check out `codex/tokyo-brochure`, serve from `SomeWhereInJapan` with `python -m http.server 8000`, then open `http://localhost:8000/places/tokyo-in-layers/`.
- [ ] Report unresolved evidence gaps clearly; do not imply that current schedules or navigation have been independently verified.

## User-facing acceptance

- The existing Tokyo page has a coherent premium brochure story and three route clusters.
- East Tokyo, Central Tokyo, and West Tokyo each have unique credited imagery and a map paired with a matching ordered list.
- Each route opens its complete ordered stop sequence in Google Maps.
- The preview page is the exact page from the feature branch and can be explored before considering merge or publication.
