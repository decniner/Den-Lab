# Somewhere in Japan

A responsive, editorial field atlas to 150 memorable places across Japan?s nine regions, with a separate, practical Tokyo day-trip planner.

## Preview locally

From this directory, run:

```powershell
python -m http.server 8000
```

Then open http://localhost:8000/SomeWhereInJapan/ (or serve this directory directly and open /). The project is static HTML, CSS, and JavaScript; no build step or runtime API is required.

## What is included

- An editorial introduction and interactive map with all nine regions and direct story picks.
- A Tokyo day-trip planner with month, budget, pace, transport preference, route comparison, linked field notes, save/share, and deep-link support.
- A searchable 150-place destination archive with region and experience filters, month-aware recommendations, and local-find selections.
- Five expanded Tokyo-area day-trip guides with specific stops, access notes, locator diagrams, sourced facts, and more reading.
- A sitemap at /sitemap.xml.

The five day-trip guides are a curated pilot set; their route cards use sourced estimates for one adult departing Tokyo Station. They are not live timetables, fares, or reservations. Nationwide destination stories include visitor-planning links, but do not claim a verified complete travel itinerary for all 150 places. Current hours, access and conditions should be confirmed with the linked destination sources.

## Content and imagery

Destination records are in `destinations.js`. The experience uses Unsplash image IDs from the existing project data; each image is remotely hosted and can fail to load. Story pages use credited Wikimedia Commons photographs where available and labeled schematic illustrations elsewhere. Confirm the applicable source and reuse terms before distributing image assets outside the hosted page. The Japan region map is generated from Natural Earth 10m cultural vectors; Natural Earth map data is public domain. The small projection/build script is `map-builder.mjs`.

## Verification

Run the focused local checks from this project folder:

```powershell
node --check app.js
node --check atlas-ui.js
node --check daytrip-app.js
node --check daytrip-core.js
node --test tests/*.test.cjs
```

The contest redesign was assessed against the project brief?s own editorial, usefulness, originality, accessibility, and completeness criteria. No official competition judging rubric or outcome is represented here.

Published address (current hosted version): https://decniner.github.io/Den-Lab/SomeWhereInJapan/index.html
