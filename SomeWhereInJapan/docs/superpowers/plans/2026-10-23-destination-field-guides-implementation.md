# Destination Field Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve every raw catalogue entry to a documented canonical guide or alias page, and complete a sourced, type-appropriate guide for each canonical destination.

**Architecture:** Keep the existing short-form catalogue as the base source, add stable identity and researched guide enrichment keyed by ID, and merge through one inventory loader consumed by the atlas and static guide generator. Generate initial HTML and explicit research-gap status for all inputs; only the evidence validator can mark a canonical guide complete.

**Tech Stack:** Existing static HTML/CSS/JavaScript, Node.js CommonJS build/test scripts, JSON data, GitHub Pages relative URLs.

**Spec:** `docs/superpowers/specs/2026-10-23-complete-guides-and-mapped-routes-design.md`

## Global Constraints

- Do not add destinations or inflate the count.
- Do not claim firsthand visits, local feedback, live hours, live service, live reviews, or checked dates without evidence.
- Do not make a generated page count as a complete guide.
- Do not fabricate zero costs, coordinates, accessibility, route geometry, transfer times, or opening information.
- Do not change hosting configuration or publish/push during this work.
- Preserve existing public guide URLs; do not silently merge distinct experiences.

## Review Focus

- Two different raw records map to one identity or collide on a slug: inventory tests require explicit alias evidence and exactly one canonical target.
- A generated or partially researched guide appears complete: completion tests require all type-specific fields and claim sources; otherwise the page and manifest remain incomplete.
- Missing prices or durations become zero/feasible: schema tests require explicit `unknown` status and exclude incomplete cost from totals and budget matches.
- Existing `/day-trips/` or project-base URLs break: link tests resolve all legacy URLs and canonical paths below `/Den-Lab/SomeWhereInJapan/`.
- A script or photo fails: generated HTML tests require readable guide content, source attribution, and a non-deceptive fallback without JavaScript or the remote image.

---

## File Structure

- `tools/destination-inventory.cjs` loads the exact destination script order and builds/validates identities and URLs.
- `data/destination-identities.json` stores stable IDs, types, alias decisions, and preserved paths.
- `data/route-guide-urls.json` inventories the five existing `/day-trips/` route guides separately from the 310-place catalogue, preserving their IDs, URLs, and destination links where applicable.
- `data/destination-guide-details.json` stores researched destination-specific guide enrichment keyed by stable ID.
- `data/coverage-manifest.json` is deterministic generated coverage output; it records raw inputs, canonical IDs, aliases, source/image/map status, and page paths.
- `tools/build-destination-guides.cjs` and `tools/templates/destination-guide.html` generate initial-HTML guide pages and sitemap entries.
- `guide-links.js` resolves destination/stop IDs to canonical page URLs for existing UI code.
- `tests/destination-inventory.test.cjs`, `tests/destination-guide-schema.test.cjs`, `tests/destination-guide-generation.test.cjs`, `tests/destination-guide-links.test.cjs` cover the interfaces and output.
- `research/batches/NN.json` records stable IDs and source/review status for resumable research batches.

## Interfaces

- `loadRawDestinations(siteDir: string): RawDestination[]` in `tools/destination-inventory.cjs` executes source scripts in the active `index.html` order in an isolated VM.
- `buildInventory(raw: RawDestination[], identities: IdentityRecord[], siteBase: string): Inventory` assigns stable IDs, canonical URLs, aliases, and gaps.
- `validateInventory(inventory: Inventory): ValidationIssue[]` reports collisions, unresolved aliases, malformed paths/coordinates, and missing identity decisions.
- `evaluateGuideCompletion(record: GuideRecord): { complete: boolean; missing: string[] }` validates type-specific evidence and completeness; no caller writes `complete` directly.
- `guideUrlFor(id: string, manifest: CoverageManifest, basePath: string): string | null` resolves canonical and alias IDs without inventing a URL.
- `routeGuideUrlFor(id: string, routeGuides: RouteGuideIndex, basePath: string): string | null` resolves one of the existing standalone Tokyo route guides without counting it as a new destination.
- `buildDestinationPages(siteDir: string): BuildReport` writes pages for all raw records as canonical pages or explicit alias pages, plus coverage output and sitemap entries.

## Cross-Plan Execution Order

To match the approved spec, execute Plan A Tasks 1–6 first (inventory, identities, validator, initial pages, links, and type representatives); then execute Plan B Tasks 1–16 (shared city map and all ten researched routes); then resume Plan A Tasks 7–21 for the remaining destination research batches; finish with Plan A Task 22 after Plan B Task 16 has passed. This allows map stops to resolve to stable guide URLs before the long research batches, while keeping city routes and destination research independently testable.

### Task 1: Ordered Inventory Loader and Raw Coverage

**Files:** Create `tools/destination-inventory.cjs`, `tests/destination-inventory.test.cjs`; modify `tests/destination-catalogue.test.cjs` to exercise the full source order; modify `index.html` only if its data script order needs an explicit machine-readable marker.

- [ ] Add failing `loadRawDestinationsUsesIndexScriptOrderAndCounts310Records` and `validateInventoryRejectsDuplicateIdsAndInvalidCoordinates` tests. Assert nine allowed regions, 310 raw inputs, 310 distinct current display names, and that missing coordinates remain absent rather than defaulting to `0,0`.
- [ ] Run `node tests/destination-inventory.test.cjs`; confirm both tests fail because the loader/validator are absent.
- [ ] Implement `loadRawDestinations(siteDir)` by reading destination data script order from `index.html`, running those scripts in a VM context, and returning cloned raw records. Implement `validateInventory(inventory)` with stable issue codes.
- [ ] Run `node tests/destination-inventory.test.cjs`; expect all assertions to pass and the raw count to be derived from execution, not display copy.
- [ ] Commit as `feat: add destination inventory loader`.

### Task 2: Identity, Type, Alias, and URL Audit

**Files:** Create `data/destination-identities.json`; modify `tools/destination-inventory.cjs`; test `tests/destination-inventory.test.cjs`.

- [ ] Add failing tests `everyRawRecordHasStableIdentityAndType` and `aliasesPreserveOldUrlsAndRequireEvidence`. Require one record per raw ID, valid type enum, region, stable slug, recorded existing URL list, and a non-empty evidence note for each alias.
- [ ] Run `node tests/destination-inventory.test.cjs`; confirm missing identity/type/alias decisions fail.
- [ ] Review all raw records for type and same-place overlaps. Record stable IDs and aliases in `data/destination-identities.json`. Record the five existing `/day-trips/{slug}/` route-guide URLs in `data/route-guide-urls.json`; link to a destination guide only when one exists, and do not count route-only guides as added catalogue destinations. Preserve every old URL.
- [ ] Implement `buildInventory(raw, identities, siteBase)` and its deterministic collision rules. Leave uncertain overlaps as distinct entries with a review gap.
- [ ] Run `node tests/destination-inventory.test.cjs`; expect all 310 raw records to resolve once and report the post-review canonical count and alias count from data, with all five route-guide URLs separately present.
- [ ] Commit as `feat: audit destination identities and guide URLs`.

### Task 3: Guide Enrichment Schema and Evidence Validator

**Files:** Create `data/destination-guide-details.json`, `tools/destination-guide-schema.cjs`, `tests/destination-guide-schema.test.cjs`.

- [ ] Add failing tests `requiresTypeSpecificGuideEvidence`, `unknownRequiredCostNeverCountsAsZero`, `materialClaimsRequireCheckedSources`, and `checkedOnMustBeAnActualDate`. Fixtures cover city, neighborhood, attraction, island, walking-route, hiking-route, and region types.
- [ ] Run `node tests/destination-guide-schema.test.cjs`; confirm missing evidence and type-specific fields fail.
- [ ] Implement `evaluateGuideCompletion(record)` and `validateGuideRecord(record)`. Cost entries use `{status: 'known'|'unknown'|'not-applicable', amount?, currency?, sourceIds[]}`; only `known` values enter totals. Every material claim links to a source record with a real `checkedOn` date.
- [ ] Run `node tests/destination-guide-schema.test.cjs`; expect complete fixtures to pass and incomplete/unknown fixtures to remain incomplete with named gaps.
- [ ] Commit as `feat: validate evidence-backed destination guides`.

### Task 4: Initial HTML, Canonical Pages, and Legacy Aliases

**Files:** Create `tools/build-destination-guides.cjs`, `tools/templates/destination-guide.html`, `tests/destination-guide-generation.test.cjs`; generate `places/*/index.html` and alias pages for actual identity aliases. Preserve the existing `/day-trips/*/index.html` route guides through `tools/build-daytrip-guides.cjs`.

- [ ] Add failing tests `generatesOneDirectPageForEveryRawRecord`, `pagesUseUniqueMetadataAndInitialContent`, `aliasesRetainOldPaths`, `existingRouteGuidesKeepTheirURLs`, and `incompleteGuidesAreNotPresentedAsComplete`.
- [ ] Run `node tests/destination-guide-generation.test.cjs`; confirm the expected missing-page failures.
- [ ] Implement `buildDestinationPages(siteDir)`. Generate accessible HTML with unique title/description/canonical URL, known destination-specific source text, visible guide status/gaps, a clearly labeled photo fallback when no verified image exists, relevant internal links, and no repeated filler presented as researched copy. Keep core content and navigation in HTML; JavaScript only enhances the page.
- [ ] Run both generators, then `node tests/destination-guide-generation.test.cjs`; expect exactly one `/places/` canonical page per canonical ID, a visible alias page for each identity alias, and all five `/day-trips/` route guides still generated at their old paths.
- [ ] Commit as `feat: generate permanent destination guide pages`.

### Task 5: Guide Links, Sitemap, and Existing Site Flows

**Files:** Create `guide-links.js`, `tests/destination-guide-links.test.cjs`; modify `index.html`, `app.js`, `atlas-ui.js`, `city-origin-ui.js`, `daytrip-app.js`, and sitemap generation.

- [ ] Add failing tests `allDestinationCardsAndSearchResultsLinkToGuide`, `routeStopsResolveByCanonicalId`, `basePathIsPreserved`, and `sitemapContainsAllCanonicalAndLegacyGuidePaths`.
- [ ] Run `node tests/destination-guide-links.test.cjs`; confirm missing links/manifest integration fail.
- [ ] Implement `guideUrlFor(id, manifest, basePath)` and `routeGuideUrlFor(id, routeGuides, basePath)`; use them for destination cards, search/month results, route stops, map previews, comparisons, and related guides. Preserve existing save/share/print and Tokyo planner event behavior.
- [ ] Regenerate all destination pages, route guides, and sitemap; run guide-link and existing homepage/day-trip tests. Expect all raw IDs to resolve to canonical or alias pages, all five old route-guide URLs to stay valid, and no orphan links.
- [ ] Commit as `feat: link atlas and route stops to field guides`.

### Task 6: Research Batch Builder and Representative Type Guides

**Files:** Create `research/batches/index.json`, `research/batches/01.json`, `research/batch-report.json`; modify `data/destination-guide-details.json`; test `tests/destination-guide-schema.test.cjs`.

- [ ] Add failing `firstResearchBatchCoversEveryApplicableTypeAndHasSourceLedger` test. Require at most 20 canonical IDs, every applicable type represented, source claims and actual checked dates, and a resumable status per ID.
- [ ] Run `node tests/destination-guide-schema.test.cjs`; confirm the batch ledger is missing.
- [ ] Select and research one real representative per type using appropriate primary sources. Add destination-specific evidence-backed guides; label editorial judgments, cost gaps, image status, coordinates, access, accessibility, weather, and type-specific visit structure honestly.
- [ ] Run the guide validator for each batch ID; expect only records meeting all applicable evidence rules to become complete. Write exact gaps and next IDs to the batch report.
- [ ] Commit as `content: research representative destination guides`.

### Task 7: Resumable Destination Research Batch 02

### Task 8: Resumable Destination Research Batch 03

### Task 9: Resumable Destination Research Batch 04

### Task 10: Resumable Destination Research Batch 05

### Task 11: Resumable Destination Research Batch 06

### Task 12: Resumable Destination Research Batch 07

### Task 13: Resumable Destination Research Batch 08

### Task 14: Resumable Destination Research Batch 09

### Task 15: Resumable Destination Research Batch 10

### Task 16: Resumable Destination Research Batch 11

### Task 17: Resumable Destination Research Batch 12

### Task 18: Resumable Destination Research Batch 13

### Task 19: Resumable Destination Research Batch 14

### Task 20: Resumable Destination Research Batch 15

### Task 21: Resumable Destination Research Batch 16

Each task is an independent content batch capped at 20 canonical IDs. `research/batches/index.json` fixes deterministic membership after identity review. Batch 01 contains one representative for every applicable destination type and any remaining slots; Batches 02–16 take the next unprocessed IDs. A final batch may be shorter or empty if documented aliases reduce the canonical count.

**Files for each task:** `research/batches/NN.json`, corresponding `data/destination-guide-details.json` records, and `research/batch-report.json`; test `tests/destination-guide-schema.test.cjs`.

- [ ] Read this task's ID/source ledger and open primary sources that directly support each material claim.
- [ ] Add researched records for this batch's IDs only; preserve unknowns as unknown, include type-specific details, and record checked dates only for pages actually reviewed.
- [ ] Run `node tools/build-destination-guides.cjs --batch NN`, `node tests/destination-guide-schema.test.cjs`, and `node tests/destination-guide-generation.test.cjs`. Expect each ID to resolve to a page and completion state; no missing-source record may be marked complete.
- [ ] Record completed IDs, remaining evidence gaps, and next batch IDs; commit as `content: research destination guide batch NN`.

### Task 22: Nationwide Coverage and Failure Audit

**Files:** Modify `tools/build-destination-guides.cjs`, `tests/destination-guide-generation.test.cjs`, `tests/destination-guide-links.test.cjs`, and `research/batch-report.json`.

- [ ] Add failing `finalCoverageHasNoUnresolvedRawRecordOrOrphanPage` and `imageAndScriptFailuresKeepGuideReadable` tests across all raw records and representative guide types.
- [ ] Run the targeted guide tests; confirm incomplete entries and broken aliases are reported.
- [ ] Run the generator with `--check`; correct only verified inventory, URL, source, and page mismatches. Do not downgrade guide completeness to make the check pass.
- [ ] Run each `tests/*.test.cjs` file individually, browser review at 390px, 768px, and 1440px, and `git diff --check`. Report raw count, canonical count, aliases, complete guides, incomplete IDs, source/photo/coordinate gaps, sitemap count, and screenshots.
- [ ] Commit as `test: verify nationwide guide coverage`.

