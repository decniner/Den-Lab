# All Destination Guides Design

## Intent

Bring all 310 destination pages to the polished, readable field-guide presentation established by the latest ten guides, so visitors receive a consistent, useful experience throughout Somewhere in Japan.

## Goals

- Give every destination a distinctive, mobile-friendly hero and readable page hierarchy.
- Retain place-specific stories, photos, attributions, and existing editorial content.
- Show a map and usable Google Maps directions for every destination; show numbered multi-stop routes only when the stops and order have source support.
- Make arrival modes, visitor contact, lodging suggestions, and official information easy to find when those facts are supported by existing or newly verified sources.
- Display a small, consistent v0.5 version label at the top of every destination guide and the home page.
- Keep UTF-8 text clean and avoid placeholder or fabricated claims.

## Non-goals

- Claiming that a route is fully surveyed when its connector geometry is schematic.
- Inventing phone numbers, community feedback, access details, or named stops where source material is absent.
- Replacing a destination photograph with unrelated stock imagery to make a page appear complete.

## Current state

- The catalog has 310 place pages; 20 currently use the newer editorial layout and 290 use the older layout.
- The photo audit has 150 place-matched Commons records and 160 photos marked unverifiable. Image URLs are currently unique.
- The cached map catalog has 310 location records: 127 destination-level, 171 area-level, and 12 nearby points.
- The route dataset contains 23 multi-stop records. Most pages do not yet have researched stop sequences.
- The site is static HTML/CSS/JavaScript hosted on GitHub Pages; map UI and place-route data are shared.

## Approaches

1. **Hand-author 290 independent pages and routes.** Highest editorial control, but impossible to keep every route/contact claim accurate without destination-specific research and creates duplicate layout maintenance.
2. **One shared data-driven template over the existing page and research records (recommended).** Reuse place-specific copy, photos, credits, and access facts already present; add a single-place map where only a point is supported and retain researched multi-stop maps where available. This yields a consistent guide for all places without inventing research.
3. **Replace each page with a generic generated guide and assumed nearby stops.** Fastest, but would fabricate visit order and weaken the site's credibility; rejected.

## Design choices

- Rebuild the remaining pages using the established premium field-guide design and each page's existing destination-specific content.
- Use source-backed information when available. For unknown information, provide a useful direct map or official-source path without inventing a value.
- Preserve unique photos and their attribution; investigate the 160 unverifiable rows and replace only with a place-matched, reusable image whose file page and license can be confirmed.
- Use precise destination map records as pins. Area-level points must be described as area references, not attraction entrances.
- Keep numbered route stops only where route data has multiple named stops. Do not present straight schematic connectors as walkable streets.
- Bump every visible guide version to v0.5 for this catalog release and refresh asset query strings.

## Constraints and risks

- No new dependencies or API keys.
- Publicly available destination data varies. Phone, lodging, airport, and route facts may remain unavailable until a source can be confirmed; fabricated completeness is worse than an honest, useful link.
- Google Maps URLs support a limited number of intermediate waypoints on mobile browsers. Individual leg links remain available for longer routes.
- The site must remain readable on mobile and retain current fonts and branding.
