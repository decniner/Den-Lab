# Somewhere in Japan

A cinematic, responsive field guide to memorable places across Japan's nine regions, with a Tokyo-based day-trip field desk and five detailed pilot routes.

## Preview

Open `index.html` in a modern browser. If your browser restricts local files, run a static server from this folder, such as `npx serve .`.

## Content and imagery

The destination collection is in `destinations.js`; search, region filters, device-local saved places, and shareable region links render from that data. Destination and experience photography is served from Unsplash using image IDs. The Kyoto Fushimi Inari and Miyajima Itsukushima images are verified against their pictured landmarks. The hero image is `photo-1743731852847-044ec22a00bc`; destination records list Unsplash as source. Image availability and licensing terms are governed by the source provider. Replace with licensed local assets before redistribution if your publishing policy requires it. Image cards retain a styled fallback when a remote image cannot load.

Planning links point to Japan National Tourism Organization guides. No live schedules, prices, reservations, or booking claims are provided.

## Japan map

The regional map uses coastlines from Natural Earth 10m cultural vectors. Natural Earth map data is public domain; see [Natural Earth's terms](https://www.naturalearthdata.com/about/terms-of-use/). `map-builder.mjs` documents the small projection and SVG generation step; no runtime data download is required.

## Published site

https://decniner.github.io/Den-Lab/SomeWhereInJapan/index.html

## Month-by-month planning

The destination guide offers month-specific place suggestions and flexible trip-length guidance. Seasonal windows can shift by region and year; confirm current conditions and forecasts before travel.

## Tokyo day-trip field desk

The day-trip finder starts estimates at Tokyo Station and filters five locally stored pilot routes (Kawagoe, Sawara, Mount Mitake, Narita and Odawara) by month, half/full-day time window, public transport/car availability, yen budget and interest. It presents ranges, not live fares or schedules. Estimates include listed transport, planned admission and a ¥1,500–¥2,500 meal allowance; they exclude lodging and optional purchases. Route sources and check dates are on each field note. Confirm current fares, opening days, trail/weather conditions and return service with the linked operators before leaving.

Compare two or three routes, save the current choices in this browser, share a link that restores the choices, or use browser print. Saved plans stay on the current device. Unsupported car routes are intentionally omitted from matching rather than priced without research. Some route pages use CSS editorial artwork instead of unverified destination photography; verified photo credits appear on the specific record.

Focused checks: `node --test-isolation=none --test tests/daytrip-core.test.cjs` and `node --check daytrip-core.js`, `node --check daytrips.js`, `node --check daytrip-app.js`.
