# Tokyo Brochure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Tokyo destination guide into a testable three-route travel brochure without changing the published site during implementation.

**Architecture:** The existing Tokyo guide is hand-authored, not overwritten by the shared guide generator. Update that page in place; keep route facts in a Tokyo-only JSON registry, use route-specific GeoJSON, and mount the existing shared map UI once per route. Keep the city planner’s data independent.

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
- Create: `SomeWhereInJapan/maps/tokyo-brochure/east.geojson`
- Create: `SomeWhereInJapan/maps/tokyo-brochure/central.geojson`
- Create: `SomeWhereInJapan/maps/tokyo-brochure/west.geojson`

**Interfaces:**
- Produces: `{schemaVersion: 1, routes: TokyoBrochureRoute[]}`, with exactly three routes keyed `east-tokyo`, `central-tokyo`, and `west-tokyo`.
- Each route contains title, short editorial introduction, research state, ordered stops, source records, route-specific photo metadata, map-data path/status, and a Google Maps directions target. Each GeoJSON has a stable route id, sourced point features, and only appropriately labelled schematic connectors.
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
- Modify: `SomeWhereInJapan/city-route-ui.js` to make repeated map instances use unique accessible IDs.
- Create: `SomeWhereInJapan/tokyo-brochure.js` to mount the three route views from the Tokyo-only registry and map files.

**Interfaces:**
- The page contains static editorial route sections and route-map hosts so route names, stop order, fallback content, and directions remain usable without JavaScript.
- `tokyo-brochure.js` loads `data/tokyo-brochure-routes.json` and calls `CityRouteUI.mountCityRouteView(panel, route, mapData, {hideStopPhotos:true})` once per route. Route-specific GeoJSON is loaded from `mapDataPath`; each rendered map gets unique DOM and accessibility IDs.

- [ ] Add a Tokyo-only collection slot and script include through the existing guide generator; both are emitted only for the Tokyo guide.
- [ ] Add the data loader and mount each route panel through the shared route UI with its matching GeoJSON.
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

## Implementation ruling

The Tokyo guide has no `data-generated-guide=\"true\"` marker, and the shared generator intentionally skips hand-authored pages. I will update the Tokyo page in place and avoid changing the shared guide template/generator; this narrows the change and prevents effects on other guides.

## User-facing acceptance

- The existing Tokyo page has a coherent premium brochure story and three route clusters.
- East Tokyo, Central Tokyo, and West Tokyo each have unique credited imagery and a map paired with a matching ordered list.
- Each route opens its complete ordered stop sequence in Google Maps.
- The preview page is the exact page from the feature branch and can be explored before considering merge or publication.
