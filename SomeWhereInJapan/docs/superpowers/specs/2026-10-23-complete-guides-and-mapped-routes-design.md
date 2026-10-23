# Complete Destination Guides and Mapped City Routes

**Status:** Architecture approved; written design awaiting review  
**Date:** 2026-10-23  
**Repository:** `decniner/Den-Lab`, `SomeWhereInJapan/`

## Intent

Make the existing nationwide atlas useful after a traveler chooses a place: every canonical destination should eventually open a durable, researched field guide. City-origin planning should provide one researched full-day route for each supported city, with a readable map and an ordered itinerary that remain usable together on desktop and mobile.

The source brief is authoritative for product requirements and research standards. This design defines how to deliver them in a static GitHub Pages site without presenting generated structure as verified research.

## Current-state audit

The active script order in `index.html` produces **310 records with 310 unique display names** across the nine regions. This is the canonical inventory count for the implementation; counts in older README/tests are stale. It includes the base catalogue, four expansion scripts, and two photo scripts.

There are **10 city origins** and **10 corresponding city-plan records**: Sapporo, Sendai, Tokyo, Nagoya, Kyoto, Osaka, Hiroshima, Takamatsu, Fukuoka, and Naha. Their existing sequences have at least four editorial stops, but stop records do not contain coordinates or leg geometry. Eleven airport origins reuse a city plan as an access preview; they are not full airport-start itineraries.

The catalogue currently has **200 records with a structured `photo.url` and 110 without one**. Provenance completeness needs a per-record audit. No catalogue record currently contains a latitude/longitude pair. Five separate, generated Tokyo day-trip guide pages exist under `/day-trips/`; they are not a nationwide guide system. Existing destination data has no canonical type field, claim-level sources, or systematic research-completion status.

The audit does not yet establish which distinct names refer to the same real-world attraction. No entries will be merged until an identity review records the evidence and preserves aliases/old URLs.

## Goals

1. Give every canonical destination a permanent, directly loadable guide URL, with unique metadata and meaningful initial HTML.
2. Track identity, type, sources, image provenance, coordinates, map geometry, and guide completion in a machine-readable manifest.
3. Use a shared guide data model and generator; require type-appropriate content and evidence before a record can be marked complete.
4. Provide one researched full-day city route for each of the ten city origins, drawn on an embedded, attributed geographic street map with synchronized, accessible itinerary controls.
5. Link existing cards, search results, route stops, and map previews to canonical guides; preserve existing public guide URLs and the current exploration, Tokyo planner, save, share, compare, and print flows.
6. Keep all research and generation resumable, and report actual complete/incomplete counts.

## Non-goals and constraints

- Do not add destinations or inflate the count.
- Do not claim firsthand visits, local feedback, live hours, live service, live reviews, or checked dates without evidence.
- Do not make a generated page count as a complete guide.
- Do not fabricate zero costs, coordinates, accessibility, route geometry, transfer times, or opening information.
- Do not add paid map services, API keys, accounts, server dependencies, or user-triggered geolocation.
- Do not change hosting configuration or publish/push during this work.
- Do not promise contest placement, traffic, or that GitHub Pages can serve an arbitrary audience size. GitHub documents a 100 GB/month soft bandwidth limit and a 1 GB published-site maximum; asset size and the hosting choice remain material constraints ([GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)).

## Approaches considered

### A. Generate guides directly from existing card copy

This is quick but would turn brief seasonal descriptions into thin, falsely complete guides. It cannot supply precise access, evidence, costs, terrain, or map points. Rejected.

### B. Shared static guide system with evidence-gated batches — selected

Create a canonical manifest and normalized structured data, generate static HTML from shared templates, and research/complete records in resumable batches. Add city routes through the same data-driven map/itinerary component. Incomplete records still receive stable generated pages when useful, but carry an explicit research state and cannot pass the completion validator. This supports broad technical coverage without disguising the remaining research.

### C. Hosted map/routing provider

This could supply familiar streets and routing but introduces a third-party service dependency, possible account/API-key requirements, cost, and rate/availability terms. Rejected for this implementation because the brief forbids paid services/accounts without approval and warns against treating public demo services as unlimited production infrastructure.

## Architecture

### 1. Canonical inventory and identity

Add a deterministic inventory builder that loads the same destination scripts in the exact order used by `index.html`. Its manifest record will contain:

```text
id, canonicalName, aliases[], type, region, area, slug,
existingUrls[], canonicalUrl, coordinates?, coordinateSource?,
photo {url, alt, credit, license, licenseUrl, source, checkedOn?},
claimSources[], researchState, guideState, geometryState, gaps[]
```

`type` is one of city, neighborhood, attraction, island, walking-route, hiking-route, or region. Identity review may set an alias/merged state only with an evidence note and a redirect/alias page for existing URLs. Slugs are stable IDs after initial assignment; names may be corrected without silently breaking links.

The inventory generator fails on duplicate IDs/slugs, invalid region/type, malformed or out-of-range coordinates, unresolvable alias targets, or an unaccounted existing guide URL. It emits actual counts rather than hardcoded marketing numbers.

### 2. Guide records, completeness, and rendering

Use normalized static data records and a shared Node generator to emit `places/<slug>/index.html`. Existing short-form destination scripts remain the source for their current names, region, season, tags, and card descriptions; guide enrichment is keyed by stable ID and merged by one shared loader. The atlas, planner, and guide generator consume the same resolved destination/guide model instead of copying facts into separate templates. Pages contain the core text, source list, and navigation in initial HTML so they work without JavaScript. Each page gets a unique title/description, canonical URL under `/Den-Lab/SomeWhereInJapan/`, social metadata, relevant internal links, and a sitemap entry.

The guide record groups:

- identity, editorial summary, audience fit, drawbacks, and alternatives;
- nearby hub and access legs with mode, duration/cost status, and claim sources;
- ordered visit stops with address/entrance, coordinates and their source, visit duration, admission/booking/opening evidence, and terrain/access notes;
- required cost components with explicit unknown/included/excluded values;
- season/weather notes and a source-backed alternative or postponement rule;
- photo provenance; nearby guides with an explicit travel relationship;
- source records containing organization, title, URL, supported claim IDs, checked date, and evidence notes.

Research state is separate from page-generation state. Allowed research states are `unresearched`, `in-progress`, `partially-verified`, `verified`, and `identity-alias`. Guide completion is derived by a validator, not hand-entered. It requires the applicable fields for that destination type, source evidence for material claims, usable access details, explicit cost gaps, image status, and location/map status. A hiking guide additionally requires sourced trailheads, distance/elevation when available, seasonal restrictions and safety notices. A broad-region record must orient bases and transfers rather than claim a one-day cross-region route. An attraction record does not invent internal stops.

The five current `/day-trips/<slug>/` URLs remain loadable. Their guide content will be mapped to canonical destination IDs and retained at the old URLs; the manifest marks these as existing URLs for the matching guide. All other destinations use `/places/<slug>/`. If identity review establishes that two entries are one attraction, the noncanonical old URL becomes a static alias page with a visible link and redirect metadata; no old path is silently removed.

### 3. Resumable source research

Maintain research batches as data/artifact files keyed by stable IDs. Each batch covers a manageable group (initial batch: one representative of each destination type; later batches: up to 20 destinations, adjusted to source complexity). A batch is complete only after sources were opened and checked, implementation was generated, and automated/content checks pass. Sources should be primary operators, municipalities, transport providers, or tourism boards appropriate to each claim.

Checked dates are written only during actual source review. Editorial judgments are labeled as such. Each batch artifact includes IDs attempted/completed, sources checked, changes, unresolved claims, and the next IDs. Do not repeat completed research when resuming.

### 4. City route and map model

Add a route registry keyed by city ID. A route contains an explicit station origin, full-day variant, endpoint/return point, research sources, and ordered stops. Each stop has a stable ID, canonical destination/guide ID where applicable, exact entrance/meeting point when sourced, lat/lon plus coordinate source, visit-window/duration status, and optional photo. Each leg has from/to IDs, walking/transit/car mode, duration estimate and provenance, geometry source/status, and a directions URL. Airport origins remain access previews unless their own arrival/departure buffers and legs are independently researched.

Research one realistic full-day itinerary per city, keeping city sightseeing distinct from out-of-city excursions. Do not create independent half-day plans by truncating full-day routes; add a half-day variant only when independently researched. Do not claim multi-day routes without independently planned days. City route cost/time is not inherited by airport starts.

The shared client map will use a maintained lightweight open-source map renderer with **locally served, simplified city street geometry** and route data. Do not request public demo tiles or routing APIs at runtime. The geometry-generation/import step records its source, license, attribution, date, extent, and simplification. OSM-derived data uses visible `© OpenStreetMap contributors` attribution and links to the ODbL terms. OSM's standard tile service has best-effort availability, limited capacity, and explicitly prohibits bulk tile downloading; its public tiles will not be treated as an unlimited production dependency ([OSM tile policy](https://operations.osmfoundation.org/policies/tiles/), [OSM copyright and license](https://www.openstreetmap.org/copyright)).

Walking path geometry is marked verified only when it follows sourced pedestrian ways and has been reviewed against endpoints. Transit lines are marked verified only with suitable official geometry; otherwise a dashed connection is labeled as a stop-order illustration, never as rail alignment. Estimated durations are labeled with method and source; they are not live schedules. Each route shows origin, numbered stops, endpoint/return, attribution, mode-distinct legs, and an individual external directions link for every leg, including return.

The map starts from local data only for the selected city/route. A generated static SVG overview remains visible if the map script fails. A semantic ordered itinerary is always available and is the mobile interaction surface; selection synchronizes map and itinerary without moving keyboard focus. Keyboard activation, visible focus, reduced-motion support, readable contrast, touch targets, and no page-scroll trapping are required. Marker collisions are handled through clustering or carefully offset callouts with an equivalent list. Guide photography uses responsive sources and lazy loading below the lead image; image failure leaves the source credit and a designed fallback visible.

Before selecting the vector representation and bundling data, measure the 10-city asset footprint. Generated data must stay comfortably below GitHub Pages' published-site maximum, preserve cacheable versioned assets, and load only the selected city. If detailed street data cannot fit or be licensed compliantly, the team must surface that as a design blocker; it must not silently downgrade the map to an unlabelled sketch or rely on a public tile demo.

### 5. Shared navigation and state

Every destination card, search result, map preview, route stop and related-place link resolves to the manifest's canonical guide URL where one exists. Existing links are represented in the manifest and tested. Page links remain relative/base-path safe for GitHub Pages.

Route state in the URL includes supported origin, route ID, independently supported variant, travel mode, and selected stop ID. Loading or back/forward navigation restores only valid IDs. Invalid/missing state falls back to the selected city's default route without failing the page. Save/share/comparison and print continue using the same route facts; incomplete costs never qualify in budget matching. Map failure does not block guide content or route actions.

### 6. Sitemap and generation

The generator writes guide HTML, map assets, a JSON coverage manifest, a human-readable batch report, and `sitemap.xml`. Build output is deterministic. It verifies every canonical destination has exactly one page and every alias has a valid target. It also checks source URL format, image provenance fields, internal links, route/stop IDs, URL paths, coordinate ranges, and completion-state claims. A broken external URL is reported for manual review; URL syntax alone is not proof of valid source content.

## Validation

Automated tests will cover:

- exact source load order and actual destination count; unique IDs/slugs, alias mapping, and nine-region coverage;
- guide completeness rules by type; incomplete pages remain clearly incomplete; all claims flagged as material have source records;
- sitemap and direct page generation for all 310 canonical IDs, preservation of existing five day-trip URLs, and no orphan/duplicate guide pages;
- route registry coverage for all ten city IDs; explicit origin, stop order, endpoint/return, leg endpoints, valid coordinates/source, and actual full-day variant status;
- airport origins never inheriting city duration/cost claims; half-day only where independently researched;
- URL restore/back-forward, origin/route/variant/mode/stop changes, map/list synchronization, keyboard/touch behavior, and no focus jump;
- cost/time boundary behavior, incomplete costs excluded from budget matches, storage errors, comparison, share, print, and map/data/script/image network failure fallbacks;
- viewport checks around 390px, 768px, and 1440px and rendered guide/map samples for each destination type and all ten cities.

Manual review records browser screenshots, console/network failures, attribution visibility, marker collisions, scroll/focus behavior, and visual legibility. Functional checks are reported separately from source research completion.

## Delivery sequence

1. **Inventory:** create the ordered loader, stable manifest, identity/type audit, preserved URL map, and coverage validator. Report canonical count, aliases, missing source/photo/coordinate status.
2. **Guide vertical slice:** define normalized records and template, then finish one sourced representative of every type before scaling. Keep unfinished records explicitly incomplete.
3. **City route system:** implement shared route/leg/map/list component, independently research the ten full-day city routes, and validate all ten city selections, mobile/desktop layouts, and route links.
4. **Research batches:** complete remaining destination guides in resumable batches, update manifest and sitemap per batch, and run the completeness/link checks after each batch. Do not stop at generated pages and report them as complete.
5. **Final audit:** reconcile all IDs, sources, guide states, existing URLs, map geometry, sitemap, screenshots, performance footprint, accessibility, and current residual evidence gaps.

## Acceptance reporting

Report actual canonical inventory count, completed guide count, remaining count with IDs, complete city-route coverage count, independently researched variants, image/source/coordinate/geometry gaps, sitemap/page totals, tests and browser viewports checked, and links to screenshots. If session/tool limits interrupt the work, leave the manifest and batch report resumable and provide exact continuation IDs. Never claim full completion until all 310 records pass their applicable guide validator and all ten city routes pass their route validator.

## Primary references checked for this design

- [Leaflet Quick Start Guide](https://leafletjs.com/examples/quick-start/) — maintained lightweight interactive map library and basic marker/line capabilities.
- [OpenStreetMap Standard Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) — standard tiles are best-effort, have capacity constraints, and prohibit bulk downloading.
- [OpenStreetMap Copyright and License](https://www.openstreetmap.org/copyright) — ODbL data use and attribution obligations.
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) — 1 GB published-site maximum and 100 GB/month soft bandwidth limit.

