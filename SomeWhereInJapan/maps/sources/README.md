# Local city map source policy

## Selected dataset and license

Use OpenStreetMap vector data for city street context. OSM data is published under the Open Database License 1.0 (ODbL). Published maps must display `© OpenStreetMap contributors` and link to https://www.openstreetmap.org/copyright. OSM-derived database data and improvements retain the ODbL share-alike obligations. Keep this attribution visible beside each interactive map and within each static SVG fallback.

Official references checked 2026-10-23:

- OSM copyright and license: https://www.openstreetmap.org/copyright
- OSM API use policy and data-provider alternatives: https://operations.osmfoundation.org/policies/api/
- Overpass API reference and public instance cautions: https://wiki.openstreetmap.org/wiki/Overpass_API
- OSM standard tile policy: https://operations.osmfoundation.org/policies/tiles/

## Extraction protocol

- Obtain only the bounded vector street context needed by one selected city map. Prefer a single cached extract per city from an approved OSM data source; record the query/bounds, provider, extraction date, and response size before transformation.
- Keep total extraction traffic below the selected provider's published limits. Do not request raster tiles, do not repeat unchanged downloads, and do not use the OSM editing API as a read-only bulk service.
- Reduce the source to a local GeoJSON FeatureCollection with a `metadata` block: `cityId`, `sourceUrl`, `license: ODbL-1.0`, exact attribution, extraction date, and WGS84 bounds.
- Simplify only background street context. Preserve separately reviewed route edges without simplification. Store only data required for the selected map viewport.
- Keep derived OpenStreetMap data under ODbL, add an `ODbL-1.0` license file/notice for each distributed data collection, and retain visible map attribution.
- Do not mark a route, leg, coordinate, or city as verified merely because OSM geometry exists. Route facts need their own source and human review.

## Current status

No real city street extract has been downloaded or bundled yet. `build-city-map-data.cjs` is tested against synthetic fixtures only. City bounds, route coordinates, and per-city output sizes remain unverified; do not count any city as mapped until source-backed route data and its local GeoJSON/SVG outputs exist.
