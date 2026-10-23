# Tadaima! — ただいま！

**Houses and land you'd actually say "I'm home" to.**

Tadaima! researches one city at a time from Japan's public listing portals
(SUUMO, LIFULL HOME'S, atHome, goo住宅・不動産) and ranks each property with
a transparent **worth-a-look score**, so it's easy to decide what's worth a
viewing trip. The name is deliberately not place-specific.

- **Brief for every collection:** houses (new + used) and land/lots,
  ≤ ¥5,000万, ≤ 15 minutes' walk from a station.
- **Editions:** Kawagoe · Tachikawa · Tokorozawa · Saitama City · Matsudo (all live,
  researched 2026-10-23). More cities follow only when their research is done
  to the same standard.
- **Home page:** a hub — search by city, station or district, with one card
  per city. Card counts and "from" prices are generated from each city's own
  data file (`build_registry.py`), so the hub can never contradict a city page.
- **Why no Japan map (yet)?** With a handful of cities, a drill-down map is
  three taps to learn how much of Japan isn't covered yet. The map is planned
  for when coverage reaches roughly ten cities across several prefectures;
  until then, search is faster and more honest.

## The score (out of 100)

| Part | Points | Basis |
|---|---|---|
| Value | 45 | Land: ¥/tsubo vs MLIT transaction benchmarks by station + walk band (Utinokati). Houses: ¥/m² of floor area vs the collection median for new / used. |
| Location | 30 | Station walk minutes + station tier (the city's main Tokyo-facing hubs score highest). |
| Space | 15 | Floor area (houses) or plot size (land). |
| Confidence | 10 | Facts verified on the listing detail page vs taken from a portal index page, and recency. |

A major caution (urbanisation-control area, demolition needed, renovation
project, unknown building condition…) subtracts 7 points and is always
displayed on the card.

## Files

- `index.html`, `hub.css`, `hub.js`, `cities.js` — the hub home page.
- `<city>/index.html`, `styles.css`, `app.js` — each city edition (static, no build step).
- `<city>/data.js` — the property data the edition loads (same content as the JSON).
- `<city>/data/properties.json` — the same collection as structured JSON, the
  file to edit when refreshing listings.

## Refreshing the data

Re-check each `source.url`, update price/facts/`infoDate` (and
`researchedOn`), regenerate that city's `data.js` from its JSON, then re-run
`../build_registry.py` so the hub card stays in sync. Properties that have
sold or been withdrawn should be removed rather than marked stale.
