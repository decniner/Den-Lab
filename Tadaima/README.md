# Tadaima! — ただいま！

**Houses and land you'd actually say "I'm home" to.**

Tadaima! collates properties for sale from Japan's public listing portals
(SUUMO, LIFULL HOME'S, atHome, goo住宅・不動産) and ranks each one with a
transparent **worth-a-look score**, so it's easy to decide what's worth a
viewing trip.

- **Edition 1: Kawagoe, Saitama** (埼玉県川越市) — more areas to follow.
  The name is deliberately not place-specific.
- **Brief for this collection:** houses (new + used) and land/lots,
  ≤ ¥5,000万, ≤ 15 minutes' walk from a station.
- **Researched:** 2026-10-23. Listings change and sell — every card links
  to the original listing, and each record in `data/properties.json`
  keeps its source, source URL and information date.

## The score (out of 100)

| Part | Points | Basis |
|---|---|---|
| Value | 45 | Land: ¥/tsubo vs MLIT transaction benchmarks by station + walk band (Utinokati). Houses: ¥/m² of floor area vs the collection median for new / used. |
| Location | 30 | Station walk minutes + station tier (Kawagoe / Hon-Kawagoe / Kawagoeshi are tier 1). |
| Space | 15 | Floor area (houses) or plot size (land). |
| Confidence | 10 | Facts verified on the listing detail page vs taken from a portal index page, and recency. |

A major caution (urbanisation-control area, demolition needed, renovation
project, unknown building condition…) subtracts 7 points and is always
displayed on the card.

## Files

- `index.html`, `styles.css`, `app.js` — the site (static, no build step).
- `data.js` — the property data the site loads (same content as the JSON).
- `data/properties.json` — the same collection as structured JSON, the
  file to edit when refreshing listings.

## Refreshing the data

Re-check each `source.url`, update price/facts/`infoDate` (and
`researchedOn`), and keep the two data files in sync. Properties that have
sold or been withdrawn should be removed rather than marked stale.
