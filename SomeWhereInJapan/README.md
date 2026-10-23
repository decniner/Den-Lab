# Somewhere in Japan

A responsive editorial field atlas to places across Japan's nine regions, with a day-trip planner for ten major city-centre origins. Visible counts are populated from the loaded destination catalogue.

## Preview locally

From this directory, run:

```powershell
python -m http.server 8000
```

Then open http://localhost:8000/. The project is static HTML, CSS, and JavaScript; no build step or runtime API is required.

## What is included

- An interactive map with nine regions and direct place-story picks.
- A searchable nationwide place guide with seasonal and regional filters and Local Finds.
- A station-aware trip planner for Sapporo, Sendai, Tokyo, Nagoya, Kyoto, Osaka, Hiroshima, Takamatsu, Fukuoka, and Naha.
- Every destination field guide includes an interactive OpenStreetMap preview and a numbered first stop. Fourteen guides use researched city itineraries with multiple ordered stops; other guides show a single destination or clearly labelled approximate area marker, without invented connectors.
- Five detailed Tokyo-origin pilot day-trip guides with shared planner and guide stop data, selectable route plots, source links and route-specific weather/short-day guidance.
- Nine non-Tokyo city origins have ordered, full-day plans with stop-by-stop notes, suggested visit windows, whole-route maps, and a transit or driving choice. Live routes do not claim fixed fares or travel times.
- A sitemap at /sitemap.xml.

The five Tokyo routes are a pilot set with researched time and cost ranges, not live timetables or fare quotes. Plans for other city origins are editorial day sequences; visit windows are suggestions and Google Maps supplies current route options. Check venue hours, access, prices, and conditions with destination sources.

Destination map locations are stored in `data/destination-map-locations.json`; the published guides do not send geocoding requests. OpenStreetMap data is credited in the map panels. Area and nearby-feature markers are labelled as approximate and may not identify an attraction entrance.

## Day-trip guide maintenance

The five stable guide pages are generated from `daytrips.js` plus editorial/source notes in `tools/build-daytrip-guides.cjs`. To regenerate them after editing route data:

```powershell
node tools/build-daytrip-guides.cjs
```

The route plot shows approximate geographic points and stop order. Its dashed connectors are not walking directions; each stop links to a separate map lookup and walking route. A Tokyo-origin reference estimate is used for these five pages. Other origins remain available through the nationwide city-origin selector and live directions.

Usability materials are in `docs/usability/`. The current evidence gaps and the next three improvements are in `docs/day-trip-guide-evidence-gaps.md`. No participant research is claimed.

## Photography and map

Catalogue photos are shown only when Wikimedia Commons source-page metadata confirms the named place and provides photographer and license details. The full review is in `PHOTO_AUDIT.md`; records without sufficient evidence use the patterned no-image treatment. The Japan map is generated from Natural Earth 1:10m cultural vectors; Natural Earth map data is public domain.

## Verification

From this project directory, run:

```powershell
node --check app.js
node --check city-origins.js
node --check city-origin-ui.js
node --test tests/*.test.cjs
```

