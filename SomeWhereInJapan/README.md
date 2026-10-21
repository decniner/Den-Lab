# Somewhere in Japan

A responsive editorial field atlas to 180 places across Japan's nine regions, with a day-trip planner for ten major city-centre origins.

## Preview locally

From this directory, run:

```powershell
python -m http.server 8000
```

Then open http://localhost:8000/. The project is static HTML, CSS, and JavaScript; no build step or runtime API is required.

## What is included

- An interactive map with nine regions and direct place-story picks.
- A searchable guide to 180 places, seasonal and regional filters, and local-find selections.
- A station-aware trip planner for Sapporo, Sendai, Tokyo, Nagoya, Kyoto, Osaka, Hiroshima, Takamatsu, Fukuoka, and Naha.
- Five detailed Tokyo-origin pilot day-trip guides with shared planner and guide stop data, selectable route plots, source links and route-specific weather/short-day guidance.
- For other origins, place suggestions with live Google Maps transit and driving directions. Those live routes do not claim fixed fares or travel times.
- A sitemap at /sitemap.xml.

The five researched routes are a pilot set, not live timetables, fares, or reservations. Current hours, access, prices, and conditions should be checked with destination sources.

## Day-trip guide maintenance

The five stable guide pages are generated from `daytrips.js` plus editorial/source notes in `tools/build-daytrip-guides.cjs`. To regenerate them after editing route data:

```powershell
node tools/build-daytrip-guides.cjs
```

The route plot shows approximate geographic points and stop order. Its dashed connectors are not walking directions; each stop links to a separate map lookup and walking route. A Tokyo-origin reference estimate is used for these five pages. Other origins remain available through the nationwide city-origin selector and live directions.

Usability materials are in `docs/usability/`. The current evidence gaps and the next three improvements are in `docs/day-trip-guide-evidence-gaps.md`. No participant research is claimed.

## Photography and map

The 30 newest place cards each use a different Wikimedia Commons photograph. Photo links open the source page with the contributor and license information. Other destination records retain the project's existing image treatments. The Japan map is generated from Natural Earth 1:10m cultural vectors; Natural Earth map data is public domain.

## Verification

From this project directory, run:

```powershell
node --check app.js
node --check city-origins.js
node --check city-origin-ui.js
node --test tests/*.test.cjs
```

