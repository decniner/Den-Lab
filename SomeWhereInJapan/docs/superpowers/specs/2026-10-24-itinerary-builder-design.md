# Somewhere in Japan Itinerary Builder — Design

## Intent
Let visitors turn destination discovery into an editable multi-day itinerary using the existing static destination catalog.

## Goals
- Choose trip dates, a starting point, an optional end point, trip pace, and travel interests.
- Generate a day-by-day draft from matching catalog places and month-specific ideas.
- Let visitors add/remove/reorder stops, save the draft in local storage, and print or download/share a link when supported.
- Keep unsupported travel facts explicit: no invented transit time, fare, opening time, event date, or optimization claim.

## Non-goals
- Live booking, live schedule or fare searches, backend accounts, paid APIs, or automatic route optimization.
- Claiming that seasonal or event content is guaranteed on a selected date.

## Approach
Add a dedicated planner section and focused scripts to the existing static page. A pure planning module will score places from existing region, tag, description, and month metadata; the UI will turn the draft into editable days. Per-stop external map directions and existing guide/source links remain the verification path. Itineraries are saved locally and can be printed.

## Constraints
- Preserve the current editorial design and GitHub Pages compatibility.
- Reuse destination and guide data; omit unsupported fields.
- Clearly label suggested stop order and require visitors to check current access and inter-city connections.
- Preserve all current discovery and city-day-trip flows.
