# Mapped City Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each of the ten supported city origins at least one source-checked full-day route on an embedded geographic map synchronized with an accessible ordered itinerary.

**Architecture:** Keep route stops and legs in normalized JSON, validate against the city registry and destination coverage manifest, and render them through one Leaflet component over locally served, licensed, simplified street geometry. Use a static SVG fallback and external per-leg directions; do not fetch tiles or routing data at runtime.

**Tech Stack:** Existing static HTML/CSS/JavaScript, vendored Leaflet, GeoJSON/SVG map data, Node.js CommonJS tests and build scripts, current headless Edge browser review.

**Spec:** `docs/superpowers/specs/2026-10-23-complete-guides-and-mapped-routes-design.md`

## Global Constraints

- Do not claim firsthand visits, live hours, live service, or checked dates without evidence.
- Do not fabricate coordinates, route geometry, transfer times, costs, or accessibility.
- Do not request public demo tiles or routing APIs at runtime.
- Show visible attribution and preserve the applicable data license for every map dataset.
- Airport origins are access previews unless arrival/departure timing and buffers are independently supported.
- Half-day and multi-day routes require independent research; do not truncate or regroup a full-day route.
- Do not change hosting configuration or publish/push during this work.

## Review Focus

- A stop or leg lacks a sourced position/path: route validation rejects it or labels it approximate; the map never presents a guessed line as a verified route.
- An airport origin inherits a city route's time/cost: state and UI tests require an airport access preview with no inherited feasibility claim.
- Walking/transit leg totals omit transfers or double-count time: route tests sum explicit leg/visit allowances once and label remaining unknowns.
- Invalid origin/route/variant/mode/stop in a shared URL: parser tests fall back to the city's default route and retain a usable itinerary.
- Map script/data/network failure, overlapping pins, or keyboard selection: browser tests keep the ordered itinerary and directions available, expose focus, and do not jump focus or trap page scrolling.

---

## File Structure

- `city-route-model.js` validates route records, restores query state, and generates external leg directions.
- `data/city-routes.json` stores researched full-day route, stop, leg, source, and geometry-status records for the ten city IDs.
- `maps/sources/` stores source/license/date metadata and the minimal allowed source geometry; `maps/cities/*.geojson` contains generated simplified city street context and reviewed path edges.
- `tools/build-city-map-data.cjs` validates and emits route map data plus static SVG fallbacks.
- `vendor/leaflet/` contains the chosen maintained Leaflet release, CSS, and license file; no runtime CDN is used.
- `city-route-map.js` owns map rendering, marker/list selection, and script/data failure handling.
- `city-origin-ui.js` and `styles.css` integrate the shared map-and-itinerary layout with existing city/airport selectors and Tokyo planner controls.
- `tests/city-route-model.test.cjs`, `tests/city-route-map-data.test.cjs`, and `tests/city-route-ui.test.cjs` validate records, generated maps, URL state, and behavior.
- `tools/browser-review.cjs` gains all-city and viewport coverage plus screenshot records.

## Interfaces

- `validateCityRoute(route: CityRoute, origins: Origin[], manifest: CoverageManifest, routeGuides: RouteGuideIndex): ValidationIssue[]` in `city-route-model.js` validates ID links, sources, stop order, explicit endpoint, legs, and research state. A stop's optional `guideRef` is `{ type: 'destination'|'route-guide', id: string }`; when present it must resolve through the matching guide URL helper.
- `summarizeRoute(route: CityRoute): { complete: boolean; minMinutes: number|null; maxMinutes: number|null; unknownComponentIds: string[] }` sums explicit visit, leg, meal, and buffer ranges once; any required unknown component prevents a total from being presented.
- `readCityRouteState(url: URL, registry: CityRouteRegistry): RouteState` restores only supported origin, route, variant, mode, and stop IDs.
- `buildLegDirectionsUrl(origin: Origin, from: RoutePoint, to: RoutePoint, mode: 'walking'|'transit'|'driving'): string` makes one external directions link per leg.
- `buildCityMapData(cityId: string, route: CityRoute, sourceGeoJson: GeoJSON): MapBuildResult` validates license metadata, simplifies only display context, and returns viewport GeoJSON, reviewed route geometry, and static SVG fallback.
- `mountCityRouteMap(container: HTMLElement, mapData: CityMapData, onSelectStop: (stopId: string) => void): MapController` renders one selected city map and supports `selectStop(stopId)` and `destroy()`.

Plan B consumes `CoverageManifest` and `guideUrlFor` from the destination-guide plan. A small test fixture with those exact fields allows map development before all destination research batches are complete. Full route-stop links are wired after Plan A exposes the production manifest.

Execute this plan after Plan A Tasks 1–6, so all raw records have stable canonical IDs/URLs and representative pages exist. Complete Plan B before the remaining Plan A research batches; then run Plan A Task 22 after this plan's final browser review. This keeps the route UI independently verifiable while ensuring every mapped stop links to its canonical guide.

### Task 1: Route Schema and Validator

**Files:** Create `city-route-model.js`, `tests/city-route-model.test.cjs`; modify `data/city-routes.json` only to add the schema version and empty registry.

- [ ] Add failing tests `requiresAllTenCityIds`, `requiresOrderedStopsAndReturnLeg`, `requiresSourceForCoordinatesAndDurations`, `routeGuideRefsResolveWhenPresent`, `onlyVerifiedRoutesCountTowardCityCoverage`, `routeTimeSumsVisitAndLegAllowancesOnce`, `unknownComponentBlocksTotal`, `unknownLegsAreNotSummedAsZero`, and `rejectsFakeHalfDayVariants`.
- [ ] Run `node tests/city-route-model.test.cjs`; confirm missing exports and invalid fixtures fail.
- [ ] Implement `validateCityRoute(route, origins, manifest, routeGuides)`, `summarizeRoute(route)`, normalized query-state parsing, and one-leg direction URL construction. `summarizeRoute` includes sourced meal/buffer allowances, never double-counts visit/travel time, and returns null totals when a required component is unknown.
- [ ] Run `node tests/city-route-model.test.cjs`; expect invalid inputs rejected and incomplete durations retained as unknown, not numeric zero.
- [ ] Commit as `feat: define validated city route model`.

### Task 2: Locally Served Map Data and SVG Fallback

**Files:** Create `tools/build-city-map-data.cjs`, `maps/sources/README.md`, `tests/city-route-map-data.test.cjs`; add licensed, minimal source data only after terms are checked.

- [ ] Add failing tests `requiresSourceLicenseAndAttribution`, `clipsGeometryToCityViewport`, `preservesReviewedRouteEdges`, `rejectsInvalidCoordinates`, and `emitsReadableSvgFallback`.
- [ ] Run `node tests/city-route-map-data.test.cjs`; confirm missing source metadata and invalid geometry fail.
- [ ] Identify a compliant one-time source for OSM-derived city geometry; record terms, attribution, extraction date, city bounds, and applicable ODbL share-alike obligations. Do not bulk-fetch raster tiles. Stop and report a blocker if a source does not permit the extraction/distribution.
- [ ] Implement `buildCityMapData(cityId, route, sourceGeoJson)` to create compact local GeoJSON and a static SVG fallback with origin, numbered stop points, endpoint/return, leg styling, labels, and attribution.
- [ ] Run `node tests/city-route-map-data.test.cjs`; expect each selected city's generated GeoJSON to be at most 1 MiB, all map data plus bundled renderer to be at most 12 MiB, and every output to carry attribution.
- [ ] Commit as `feat: build local city route map data`.

### Task 3: Accessible Map Renderer

**Files:** Create `vendor/leaflet/` from a stable official Leaflet release with its license, `city-route-map.js`, `tests/city-route-ui.test.cjs`; modify `index.html` and `styles.css` for local assets.

- [ ] Add failing tests `loadsBundledRendererWithoutCdn`, `mapAndListSelectionStaySynchronized`, `selectionDoesNotMoveFocus`, `keyboardCanSelectStops`, and `failedMapKeepsFallbackAndList`.
- [ ] Run `node tests/city-route-ui.test.cjs`; confirm expected map-controller failures.
- [ ] Implement `mountCityRouteMap(container, mapData, onSelectStop)` with local GeoJSON only, mode-distinct geometry, numbered origin/stops/endpoint, persistent attribution, keyboard-operable selection, reduced-motion respect, and teardown before the next city loads.
- [ ] Run map UI tests and inspect vendor license/asset provenance; expect no external tile, routing, or script request.
- [ ] Commit as `feat: add accessible local route map renderer`.

### Task 4: Shared Map-and-Itinerary City Layout

**Files:** Modify `city-origin-ui.js`, `index.html`, `styles.css`, `tests/city-route-ui.test.cjs`.

- [ ] Add failing tests `eachCityDisplaysMapAndOrderedItinerary`, `mobileKeepsListAndPageScrollAvailable`, `airportShowsAccessPreviewOnly`, `unplannedExtraDaysAreNotAdvertisedAsRoutes`, and `tokyoToolsRemainFunctional`.
- [ ] Run `node tests/city-route-ui.test.cjs`; confirm the old stop-card-only layout fails these checks.
- [ ] Replace the primary city route grid with a shared map-and-itinerary composition. Keep stop photos in selected/detail cards; synchronize selection without calling focus/scroll APIs. Add one directions link for every researched leg and a distinct return leg.
- [ ] For airport selections show the airport-to-city access preview and direct city-plan link; do not start the full-day city itinerary at an airport or show city route totals as airport feasibility.
- [ ] Run city route UI, city-origin, homepage, and day-trip tests; expect Tokyo's existing cost/filter/save/share/compare/print tools to remain available and airport limits to be explicit.
- [ ] Commit as `feat: show city routes with synchronized maps`.

### Task 5: Sapporo Full-Day Route

**Files:** Modify `data/city-routes.json`; add `maps/sources/sapporo.*`; record checked sources; test `tests/city-route-model.test.cjs` and `tests/city-route-map-data.test.cjs`.

- [ ] Research one realistic Sapporo city-only full-day sequence from official city/venue and transit sources; verify entrance points, operating constraints, ordered visits, return point, and duration assumptions.
- [ ] Add the route with sourced stop positions, mode-specific leg records, supported planning-duration ranges, individual directions links, and path geometry states. Any unknown required leg keeps the route partial and out of verified city-route coverage.
- [ ] Run both route/model and map-data tests; expect Sapporo passes route validation with no unsupported precision.
- [ ] Commit as `content: add researched Sapporo city route`.

### Task 6: Sendai Full-Day Route

**Files:** Modify `data/city-routes.json`; add `maps/sources/sendai.*`; test route/model and map-data tests.

- [ ] Research Sendai's city-centre full-day route independently; keep Matsushima/out-of-city excursions separate.
- [ ] Add sourced ordered stops, origin/return, transit/walking legs, visit allowances, and geometry statuses. Any unknown required leg keeps the route partial and out of verified city-route coverage.
- [ ] Run route/model and map-data tests; expect Sendai passes without inheriting Tokyo data or unsupported fares.
- [ ] Commit as `content: add researched Sendai city route`.

### Task 7: Tokyo Full-Day City Route

**Files:** Modify `data/city-routes.json`; add `maps/sources/tokyo-city.*`; test route/model and map-data tests.

- [ ] Research the city-centre route independently from Tokyo's existing five out-of-city day trips; verify the named origin, access, time allowances, and return.
- [ ] Add the sourced route without replacing the five Tokyo day-trip planner routes. Any unknown required leg keeps the route partial and out of verified city-route coverage.
- [ ] Run route/model and map-data tests; expect city route and Tokyo excursions remain distinct and individually linkable.
- [ ] Commit as `content: add researched Tokyo city route`.

### Task 8: Nagoya Full-Day Route

**Files:** Modify `data/city-routes.json`; add `maps/sources/nagoya.*`; test route/model and map-data tests.

- [ ] Research a Nagoya city-only day; check venue calendars and transit/provider evidence for each leg.
- [ ] Add sourced route points, durations/statuses, legs, and return endpoint. Any unknown required leg keeps the route partial and out of verified city-route coverage.
- [ ] Run route/model and map-data tests; expect Nagoya passes and unverified legs remain labeled.
- [ ] Commit as `content: add researched Nagoya city route`.

### Task 9: Kyoto Full-Day Route

**Files:** Modify `data/city-routes.json`; add `maps/sources/kyoto.*`; test route/model and map-data tests.

- [ ] Research a geographically coherent Kyoto city route and verify access, closures/booking conditions, and return legs from official sources.
- [ ] Add sourced stops/legs; keep distant excursions separate. Any unknown required leg keeps the route partial and out of verified city-route coverage.
- [ ] Run route/model and map-data tests; expect Kyoto passes without treating regional transfers as neighborhood walks.
- [ ] Commit as `content: add researched Kyoto city route`.

### Task 10: Osaka Full-Day Route

**Files:** Modify `data/city-routes.json`; add `maps/sources/osaka.*`; test route/model and map-data tests.

- [ ] Research a city-only Osaka route with source-backed stop windows, mode transitions, and a return point.
- [ ] Add its route record and sourced geometry statuses; mark transit direction lines schematic unless official path geometry is available. Any unknown required leg keeps the route partial and out of verified city-route coverage.
- [ ] Run route/model and map-data tests; expect Osaka passes without claiming a precise railway alignment.
- [ ] Commit as `content: add researched Osaka city route`.

### Task 11: Hiroshima Full-Day Route

**Files:** Modify `data/city-routes.json`; add `maps/sources/hiroshima.*`; test route/model and map-data tests.

- [ ] Research a Hiroshima city route; treat Miyajima as an out-of-city excursion unless its ferry and transfer schedule are explicitly included and verified.
- [ ] Add sourced city stops, transit/walking legs, duration status, and return endpoint. Any unknown required leg keeps the route partial and out of verified city-route coverage.
- [ ] Run route/model and map-data tests; expect the city route is not presented as a guaranteed Miyajima connection.
- [ ] Commit as `content: add researched Hiroshima city route`.

### Task 12: Takamatsu Full-Day Route

**Files:** Modify `data/city-routes.json`; add `maps/sources/takamatsu.*`; test route/model and map-data tests.

- [ ] Research Takamatsu's city route and verify whether any island visit is genuinely feasible before including it; keep Naoshima separate unless ferry timing is fully supported.
- [ ] Add sourced stops, access legs, return endpoint, and geometry statuses. Any unknown required leg keeps the route partial and out of verified city-route coverage.
- [ ] Run route/model and map-data tests; expect the city route does not imply a ferry excursion without checked service evidence.
- [ ] Commit as `content: add researched Takamatsu city route`.

### Task 13: Fukuoka Full-Day Route

**Files:** Modify `data/city-routes.json`; add `maps/sources/fukuoka.*`; test route/model and map-data tests.

- [ ] Research a Fukuoka city route; verify market and evening stall operating caveats through current primary sources.
- [ ] Add sourced stops, station origin/return, walking/transit segments, and supported planning-duration ranges. Any unknown required leg keeps the route partial and out of verified city-route coverage.
- [ ] Run route/model and map-data tests; expect operating uncertainty remains visible.
- [ ] Commit as `content: add researched Fukuoka city route`.

### Task 14: Naha Full-Day Route

**Files:** Modify `data/city-routes.json`; add `maps/sources/naha.*`; test route/model and map-data tests.

- [ ] Research a Naha city route with Shuri access, hill/stair effort, monorail/walking transitions, and source-backed current reconstruction/access conditions.
- [ ] Add sourced route and return legs; avoid labeling Naha Airport as a station where it is not one. Any unknown required leg keeps the route partial and out of verified city-route coverage.
- [ ] Run route/model and map-data tests; expect airport preview is distinct from Naha city itinerary.
- [ ] Commit as `content: add researched Naha city route`.

### Task 15: URL State, Guide Links, and Airport Preview Rules

**Files:** Modify `city-route-model.js`, `city-origin-ui.js`, `guide-links.js`; test `tests/city-route-model.test.cjs` and `tests/city-route-ui.test.cjs`.

- [ ] Add failing tests `restoresSupportedRouteVariantModeAndStop`, `invalidRouteStateFallsBackSafely`, `backForwardRestoresSelection`, and `airportDoesNotInheritCityTimeOrBudget`.
- [ ] Run the targeted tests; confirm invalid and airport states expose current behavior gaps.
- [ ] Implement URL parameters `origin`, `route`, `variant`, `mode`, and `stop`; keep IDs in the canonical manifest and preserve unrelated query parameters. Share links include only valid IDs.
- [ ] Run targeted tests; expect browser back/forward restores the selected stop without focus jumps and airport origins remain access previews.
- [ ] Commit as `feat: restore mapped city route state`.

### Task 16: Ten-City Browser, Accessibility, and Size Review

**Files:** Modify `tools/browser-review.cjs`, `tests/city-route-ui.test.cjs`, route/map artifacts only for observed fixes.

- [ ] Add browser assertions that visit all ten city origins at 390px, 768px, and 1440px, verify stop/list counts and attribution, and record selected-map and mobile screenshots.
- [ ] Run `node tools/browser-review.cjs`; inspect every city for missing images, marker collisions, clipped attribution, scroll trapping, console errors, wrong base-path URLs, and map failures.
- [ ] Add a network-blocked run; expect static SVG, ordered stops, guide links, and individual directions remain available with zero JavaScript runtime errors.
- [ ] Measure total generated map/vendor bytes and per-city lazy-loaded bytes; verify the published output remains comfortably under 1 GB. Report the actual size; do not infer a visitor guarantee from it.
- [ ] Run each test file individually, `node --check` on modified scripts, and `git diff --check`; fix all observed failures and rerun.
- [ ] Commit as `test: verify mapped routes across all cities`.

