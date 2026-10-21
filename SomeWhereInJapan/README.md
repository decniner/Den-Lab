# Somewhere in Japan

A cinematic, responsive field guide to 67 memorable places across Japan's nine regions.

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
