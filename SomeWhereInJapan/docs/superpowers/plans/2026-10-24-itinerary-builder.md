# Multi-day Itinerary Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an editable, saved, day-by-day trip planner to Somewhere in Japan.

**Architecture:** Keep the site static. Add a pure planning core that scores existing destination records, a UI controller that renders editable day cards, and a section in the existing homepage. Persist plans in localStorage; use external map links only for live directions.

**Tech Stack:** HTML, CSS, vanilla JavaScript, existing Node.js built-in test patterns.

**Spec:** `SomeWhereInJapan/docs/superpowers/specs/2026-10-24-itinerary-builder-design.md`

## Global Constraints

- No backend, paid APIs, tracking, accounts, or dependencies.
- Never invent travel time, fare, opening hours, event dates, or optimized routing.
- Keep GitHub Pages relative paths and existing features working.
- Use only available destination metadata; show caveats for unverified suggestions.

## Review Focus

- Empty or malformed destination arrays produce an honest empty-state, not a crash (core test).
- Dates crossing months use each day's month when scoring seasonal metadata (core test).
- Missing origin/end or source fields do not generate broken map links (UI test).
- Local storage unavailable/corrupt does not block editing (controller test).
- Mobile-width planner retains accessible controls and readable stop order (browser proof/manual check).

---

### Task 1: Pure itinerary draft logic

**Files:**
- Create: `SomeWhereInJapan/itinerary-core.js`
- Create: `SomeWhereInJapan/tests/itinerary-core.test.cjs`

**Interfaces:**
- Consumes: destination objects already exposed as `DESTINATIONS`.
- Produces: `buildItinerary({destinations, startDate, days, regions, interests, pace, savedIds})` returning `{days:[{date, region, places:[place]}], notes:[string]}`; `moveStop(plan, placeId, fromDay, toDay, index)`; `removeStop(plan, dayIndex, placeId)`.

- [ ] Write tests for date allocation, matching tags/regions, pace-based stop counts, stable unique placement, malformed/empty data, moving and removing stops.
- [ ] Run `node --test SomeWhereInJapan/tests/itinerary-core.test.cjs` and observe expected failures.
- [ ] Implement the pure core with deterministic scoring and no route-time claims.
- [ ] Run the focused test and then all existing `node --test SomeWhereInJapan/tests/*.test.cjs` tests.

### Task 2: Planner UI and persistence

**Files:**
- Create: `SomeWhereInJapan/itinerary-planner.js`
- Modify: `SomeWhereInJapan/index.html` to add the planner form and load scripts.
- Modify: `SomeWhereInJapan/styles.css` to style planner responsively.
- Create: `SomeWhereInJapan/tests/itinerary-planner.test.cjs`

**Interfaces:**
- Consumes: `buildItinerary`, `moveStop`, `removeStop`, `DESTINATIONS`, existing saved-place storage key.
- Produces: accessible planner with date/days, origin/end, regions/interests, pace, editable day cards, map/source links, save/restore, print, and honest caveats.

- [ ] Add static tests for required labelled controls, output container, and script order; run them and observe failure.
- [ ] Implement planner UI with DOM-safe text insertion, up/down controls, add/remove, empty state, local save/load with storage error handling, print stylesheet behavior, and individual directions.
- [ ] Add responsive styles and a navigation/hero entry point without disrupting current content.
- [ ] Run focused tests and full Node test suite.
- [ ] Verify browser interaction on desktop and narrow viewport, including empty data and stored plan recovery.

### Task 3: Review and delivery

**Files:**
- Verify branch changes and test report.

- [ ] Review diff for unsupported factual claims, invalid links, broken relative paths, and existing feature regressions.
- [ ] Run the repository checks available in this environment; report any checks that cannot be run.
- [ ] Create a pull request targeting `main`, with deployment left to the normal merge/publish path.
