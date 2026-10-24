---
name: japan-city-brochure
description: Build or refresh a photo-first city route guide for Somewhere in Japan. Use when applying the Tokyo brochure presentation to another Japanese city, especially pages that need simple photo browsing, clear stop order, compact maps, live directions, and optional detailed planning notes.
---

# Japan city brochure

Apply the Tokyo brochure’s simple, photo-led presentation to a city while using that city’s own route data and visitor needs.

## Before editing

- Inspect the Tokyo brochure at `SomeWhereInJapan/places/tokyo-in-layers/index.html`, `tokyo-brochure.css`, and `tokyo-brochure.js` for the current presentation and accessible photo viewer.
- Inspect the target city’s record in `data/city-routes.json`, its GeoJSON in `maps/cities/<city>.geojson`, relevant place pages, and repository instructions.
- Reuse verified photo URLs, alt text, credits, licenses, and route coordinates from the records. Check new facts with official visitor sources when research is needed, but do not add a source bibliography by default.
- Treat community posts and traveler itineraries as self-selected examples. Describe recurring itinerary choices as signals, not a representative vote, rating, or universal “best” ranking.

## Build the guide

- Keep the first view easy to scan: a short city title and description, one normal rectangular hero photo, route choices, stop photos, short captions, numbered stop order, a compact route map, and one obvious Google Maps directions action.
- Put practical planning details inside a clearly labeled **More details** disclosure when they help travelers. Research notes, source lists, citations, and community-feedback context are optional; omit them when they add clutter or were not requested. Always keep required photo credits and license links with their images.
- Group stops into coherent route(s). Never imply unknown durations are verified. Keep route order, photo labels, map pins, and live directions consistent.
- Label schematic map connectors as stop order only. Send travelers to live directions for navigation. Keep maps short enough on phones and links large enough to tap.
- On mobile, present multiple photos as a horizontal snap gallery with a visible swipe cue. Let each photo open a keyboard-accessible lightbox with close button, Escape support, backdrop close, descriptive alt text, and focus restoration.
- Give each stop a useful photo where available. Preserve source, creator, license, and useful alt text for every image, including the hero.
- Add a simple way to reach the brochure from the existing city page or destination navigation. Avoid adding long promotional copy to navigation.

## Review

- Check that the page works with JavaScript disabled: its route sequence, photo captions, and Google Maps link must remain in the HTML.
- Check relative asset paths, canonical URL, page title/description, cache-busting versions for changed CSS/JS, mobile gallery behavior, keyboard controls, route/map stop order, optional source links when included, and attribution.
- Keep generated copy compact and specific to the target city. Do not copy Tokyo facts or destinations into another city.
