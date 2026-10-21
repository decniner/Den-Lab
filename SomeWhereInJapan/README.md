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
- Five detailed pilot day-trip guides with researched time and cost ranges from Tokyo Station.
- For other origins, place suggestions with live Google Maps transit and driving directions. Those live routes do not claim fixed fares or travel times.
- A sitemap at /sitemap.xml.

The five researched routes are a pilot set, not live timetables, fares, or reservations. Current hours, access, prices, and conditions should be checked with destination sources.

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

