# Tokyo Brochure: Three District Routes

**Status:** Awaiting user approval  
**Date:** 2026-10-24  
**Repository:** `decniner/Den-Lab`, `SomeWhereInJapan/`  
**Work branch:** `codex/tokyo-brochure`

## Intent

Evolve the existing SomeWhere in Japan site into a digital travel guide with brochure-level presentation, beginning with the Tokyo destination guide. Help a visitor feel the character of Tokyo, choose a coherent neighborhood route, and open practical directions without implying that an unverified map or itinerary is confirmed navigation.

The visible site name remains **Somewhere in Japan**. The current public Tokyo guide URL remains stable.

## Current state

The existing flagship candidate is `places/tokyo-in-layers/index.html`. Its editorial copy correctly describes Tokyo as neighborhoods and warns against repeatedly crossing town. However, its “thoughtful order” currently lists Asakusa, Tokyo Station/Marunouchi, Meiji Jingu/Harajuku, and Shibuya in one sequence. Its map is an approximate single-place marker, not a route map.

The Tokyo route in `data/city-routes.json` is a separate station-origin route with Tokyo Station/Marunouchi, Imperial Palace East Gardens, Asakusa, and Ueno/Ameyoko stops. It is marked `in-progress`, and stop-visit and leg durations are unknown. The guide content and route data therefore need to be reconciled before the brochure presents specific routes as dependable.

## Goals

- Make the existing Tokyo guide the flagship Tokyo brochure while preserving its canonical URL and connection to the wider atlas.
- Present three distinct, geographically coherent route choices:
  1. **East Tokyo:** Asakusa + Ueno and Ameyoko.
  2. **Central Tokyo:** Tokyo Station and Marunouchi + the Imperial Palace area.
  3. **West Tokyo:** Meiji Jingu and Harajuku + Shibuya.
- Give each route its own route-specific premium imagery, ordered stop cards, route map, and Google Maps directions action.
- Keep Tokyo's editorial introduction and practical travel notes, but remove any implication that the three routes form one continuous day.
- Reuse the existing site's responsive visual system, route/map components, attribution practices, static hosting model, and accessibility patterns.

## Non-goals and constraints

- Do not redesign the entire site, the national atlas, or the trip planner.
- Do not change the SomeWhere in Japan brand or rename the repository/path.
- Do not include unrelated `sijdev` material.
- Do not invent opening hours, transit schedules, visit durations, route geometry, accessibility, or costs. Unknowns remain visibly unknown or are omitted.
- Do not label schematic stop connectors as verified walking directions.
- Do not introduce paid APIs, API keys, accounts, backend services, or a new runtime dependency.
- Keep the existing Tokyo guide URL and avoid breaking current inbound links.
- Do not publish or merge this branch as part of the design/implementation work.

## Approaches considered

### A. Broad homepage redesign

Redesign the main homepage and navigation around the brochure concept. This changes more of the site than the Tokyo-first scope needs and raises unnecessary regression risk. Rejected for this phase.

### B. Evolve the existing Tokyo guide — selected

Upgrade `tokyo-in-layers` in place as the flagship guide. Present the three route clusters as separate editorial sections, each with its own images, ordered stops, map, and directions action. Preserve the page URL, site identity, and unrelated atlas/planner behavior. This directly matches the agreed scope and avoids a duplicate Tokyo product.

### C. Create a parallel Tokyo microsite

Build another Tokyo page beside the existing guide. That would duplicate content, split internal links, and leave the known mismatch in the current page unresolved. Rejected.

## Experience outline

1. **Tokyo opening:** A premium editorial hero, concise Tokyo point of view, and a clear prompt to choose a district route.
2. **Route choice:** Three clearly differentiated route sections for East, Central, and West Tokyo. Each section has a distinct visual and states its intended scope.
3. **Route detail:** An ordered stop sequence paired with its own map. The map and stop list identify the same places and preserve the same order.
4. **Directions:** A prominent Google Maps action for the full route. If a route exceeds supported waypoint limits, split it into contiguous numbered segments without dropping stops; explain the segment sequence.
5. **Practical notes:** Official source links and concise access/season notes. Distinguish editorial planning guidance from live directions or date-specific schedules.
6. **Fallback:** If a route map or image cannot load, the complete stop list and directions links remain usable.

The exact section order, responsive details, and use of existing components are builder decisions so long as the route choices remain easy to compare and each map stays paired with its route.

## Research and map integrity

Before adding or changing route data, review suitable primary sources for stop identity/order, access, and visitor constraints. Reuse known coordinates and photo provenance only when they correspond to the named stop. Record unresolved items rather than filling them with estimates.

Use the existing map and directions implementation where it supports the requirement. A route preview may show verified pedestrian geometry only when supported by suitable sourced data. Otherwise label connectors as a schematic stop-order preview. Google Maps receives the full ordered stop list and remains the source for current directions.

## Acceptance criteria

- The Tokyo guide remains available at its current canonical URL and continues to identify the site as Somewhere in Japan.
- The page presents East, Central, and West Tokyo as three separate route choices, not a single cross-city itinerary.
- Each route has distinct, correctly attributed premium imagery, ordered stop names, a route-specific map, and a working Google Maps directions link.
- Map markers and the stop list agree on route membership and stop order; no stops disappear when directions URLs are segmented.
- The page does not imply unsourced exact travel times, opening hours, admission costs, accessibility, or verified pedestrian paths.
- Existing non-Tokyo atlas/planner features and the six other destination pages are outside the change scope.
- Responsive layout, readable controls, visible keyboard focus, and reduced-motion behavior follow existing site conventions.

## Decisions already made

- Brand: **Somewhere in Japan**.
- Scope: evolve the existing site in place.
- First destination: Tokyo.
- Tokyo structure: separate East, Central, and West route clusters as listed above.
- Per-route requirements: premium imagery, ordered stops, route map, Google Maps action.

## Left to the builder

- Trace the existing Tokyo guide generation/source-of-truth path before editing so generated output is not overwritten.
- Resolve how the three route records fit the current static route schema and shared map/directions UI.
- Research or flag route stop/order evidence gaps before presenting routes as production-ready.
- Make the smallest change that delivers the accepted brochure experience while preserving unrelated functionality.
