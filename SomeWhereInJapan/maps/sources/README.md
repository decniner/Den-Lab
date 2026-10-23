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

Sapporo has one bounded Overpass street extract, fetched 2026-10-23 from `https://overpass-api.de/api/interpreter`. The exact query and OSM base timestamp are recorded in `sapporo.geojson`; `sapporo.overpass.json` preserves the source response. The prepared source contains 3,651 selected road and pedestrian ways. The generated map is 795,398 bytes and the SVG fallback is 366,556 bytes. Both show local street context under ODbL attribution. Route connectors remain schematic stop-order illustrations, and one transfer/return time remains unknown.

Sendai has source-backed place points and schematic connectors but no locally bundled street geometry. The page renders OpenStreetMap-derived street tiles from OpenFreeMap with the route stops and numbered visit-order connectors overlaid in the same interactive map. The numbered route sequence and connector disclaimer are shown directly above the map; actual point-to-point directions remain linked separately. The map requires an internet connection and includes visible OpenStreetMap/OpenMapTiles attribution. OpenFreeMap describes its public service as free, without view limits or API keys, but does not provide an SLA. A public Overpass request returned coordinates from the wrong city, so that response was discarded. The SVG fallback remains a locally generated stop-order overview and explicitly notes that no street geometry is bundled.

The other eight city maps do not yet have bundled map sources.

### Sendai source notice

The Sendai route points derived from OpenStreetMap are distributed under ODbL 1.0 with visible `© OpenStreetMap contributors` attribution. The bundled `sendai.geojson` source intentionally contains no background streets; the page uses OpenFreeMap's OpenStreetMap-derived street tiles and overlays all route stops and dashed stop-order connectors. Dashed connectors are not route navigation. Coordinate precision and the evidence for each point are recorded separately in `data/city-routes.json`.

### Sapporo source notice

The Sapporo street-context dataset is derived from OpenStreetMap and licensed under ODbL 1.0. Attribution is displayed in both the interactive map and SVG fallback. Share-alike terms and the source are documented at https://www.openstreetmap.org/copyright. Route points have separate source IDs in `data/city-routes.json`; this street extract does not independently verify a route, entrance, transfer, or travel time.
