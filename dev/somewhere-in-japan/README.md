# Somewhere in Japan — Dev Planner

An isolated, static prototype for testing a more transparent Japan itinerary flow. It is not connected to the production site and does not publish data or plans.

## Run locally

From this directory, start a static file server:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. JSON files are loaded with `fetch`, so opening `index.html` directly as a `file://` URL will not work in most browsers.

Run the deterministic planner and data tests with:

```sh
npm test
```

## What the prototype does

- Collects travel dates, starting point, optional arrival/departure times, a sample route, preferred overnight bases, pace, and must-see places.
- Builds a locality-first itinerary with a dedicated day for inter-city or inter-island transfers in its sample route data.
- Leaves late arrival and early departure days without sightseeing stops.
- Only schedules an event on a day within the event's explicit date window; shows its source and checked date.
- Labels sample and unsourced assumptions, and warns when the route needs more days than the traveler selected.
- Offers a print view.

## Data status meanings

- **Sample planning data:** illustrative route or place data. A reference link may help a traveler research further, but the record has not been verified as current.
- **Verified:** the specific claim has a source and a checked date. It is still time-sensitive and must be confirmed before travel.
- **Estimated:** a planning estimate, not a live result.
- **Stale:** a previously sourced record outside its freshness window.
- **Unverified:** no adequate source and check date are recorded.

The Sapporo Snow Festival 2027 date range is linked to the official festival announcement and was checked on 2026-10-24. Other place and route entries are sample planning data. The planner does not fetch live transport schedules, fares, weather, attraction hours, closures, or bookings. Route buffers are test assumptions and are not assurances of feasible transport.

## Scope and limitations

The prototype is a client-side experiment. It has no backend, account system, API keys, automated refresh workflow, booking features, or link to production. Its current sample catalog covers Tokyo/Kamakura, Kyoto/Osaka, a Hokkaido winter loop, and Naha/Ishigaki. It should not be used as a confirmed itinerary or as current travel guidance.
