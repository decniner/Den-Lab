# Japan shopping discount notifier

Checks curated public Japan storefront catalogs and verifies each reported variant against its fresh public product page. Sends up to ten deals with **at least 50% discount before rounding** using the existing Telegram bot/destination. It never purchases products or creates accounts.

## Running it

Python 3.12+; standard library only, no paid services or API keys needed for shopping sources.

```sh
# Live scan, no Telegram or history changes, no credentials required
python shopping-notifier/notifier.py --dry-run

# Offline tests
python -m unittest discover -s shopping-notifier/tests -v

# Local normal execution: requires existing Telegram environment configuration
python shopping-notifier/notifier.py
```

In **GitHub Actions → Japan shopping discount notifier → Run workflow**, select:

- **electronics_and_shoes**: for this manual run, include the electronics stores and all enabled footwear sources; clothing is excluded. Exact available sizes are shown.
- **electronics_only**: for this manual run, scan enabled stores whose configured coverage includes electronics, computer accessories, audio, gaming, or appliances; the daily schedule keeps its full coverage.
- **dry_run**: live verification report and preview, no delivery/history changes.
- **test_digest**: one clearly labeled live digest, possibly multiple Telegram messages, history unchanged.
- Neither: normal delivery, using isolated persistent history.

Do not select both modes. Actions injects the repository's already-configured `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. No new bot, destination, shopping account, or credential is needed. Never print environment variables or bot request URLs. GitHub secrets cannot be retrieved as plaintext through the API; the workflow uses them internally.

## Schedule and isolation

`0 22 * * *` runs daily at **07:00 Asia/Tokyo** (22:00 UTC on the previous date). Scheduled GitHub Actions can queue/start late; exact delivery time is not guaranteed. Workflow dispatch provides manual execution. Pushes affecting this subsystem run tests only, never send messages.

Actions concurrency group `japan-shopping-discount-notifier` prevents overlapping runs. Local invocations use an exclusive `.run.lock`. This subsystem does not modify Netflix, Prompt Radar, or news workflows, Telegram destinations, or their history.

Shopping history lives at `shopping-notifier/state.json` on a **separate `shopping-notifier-state` branch**. The scheduled workflow uses its short-lived `GITHUB_TOKEN` with `contents: write`. It does not push history to `main`, avoiding races with existing notifiers. The branch/file is initialized on first normal execution; initial empty history contains no sent deals. A preflight validates write access before sending. After each acknowledged Telegram chunk, save only that chunk's deals, with an atomic local backup and a GitHub Contents API update. Dry runs and test digests never write history. Local normal runs use a local file; use Actions for shared scheduled/manual history, rather than mixing independent local sends.

## Supported public sources

| Source | Catalog | Main coverage | Price basis when verified |
| --- | --- | --- | --- |
| [Classical Elf](https://classicalelf.shop) | `/products.json` | Clothing, footwear, accessories | Retailer displayed original/list comparison (定価), exact variant compare-at; not independently proven manufacturer MSRP or transaction history |
| [Anker Japan](https://www.ankerjapan.com) | `/products.json` | Electronics, batteries, portable power, appliances, computer accessories | Retailer displayed previous/list comparison; historical transaction price not independently established |
| [Keychron Japan](https://keychron.jp) | `/products.json` | Keyboards and computer accessories | Retailer comparison, only with explicit reference and tax evidence |
| [KINTO Japan](https://kinto.co.jp) | `/products.json` | Household/kitchen goods, drinkware | Retailer comparison, when displayed |
| [UGREEN Japan](https://store.ugreen.jp) | `/products.json` | Electronics, NAS, chargers and accessories | Retailer comparison, when displayed |

| [Edifier Japan](https://www.edifier.jp) | `/products.json` | Electronics, audio | Retailer displayed comparison, when documented |
| [SOUNDPEATS Japan](https://jp.soundpeats.com) | `/products.json` | Earbuds, headphones | Retailer displayed comparison, when documented |
| [SHAKA Japan](https://shaka-jp.com) | `/products.json` (50 per page) | Shoes, sneaker sandals, sandals | Retailer displayed original/list comparison; exact size and color |

| [KEEN Japan](https://www.keenfootwear.jp) | `/products.json` | Footwear, outdoor clothing | Exact variant retailer comparison; fresh Japan terms and non-member shipping |
| [EcoFlow Japan](https://jp.ecoflow.com) | `/products.json` (50 per page) | Portable power, solar panels, appliances | Retailer comparison, when documented on the page |
| [Jackery Japan](https://www.jackery.jp) | `/products.json` (50 per page) | Portable power, solar panels, accessories | Retailer comparison; refurbished listings excluded |

These are catalog sources, not a claim that every store has a qualifying deal daily. Fresh `.js` variant data and HTML offers must agree for any deal to appear. The initial live scan and deployment evidence are in [docs/validation.md](docs/validation.md).

**Coverage is bounded, not exhaustive:** up to twenty pages × 250 catalog products and twenty candidate products checked per store. The public feed's sort order determines which products fall inside the catalog window. Within that window, prioritize unsent/meaningfully cheaper candidates, then evidence, discount, and savings. Pick one exact variant per product; other colors/sizes may have different prices or stock. Limits are reported as incomplete coverage, including on no-result days. No general-web search snippets are used as evidence.

Naturehike Japan's public product-feed URL redirected to HTML in discovery. Allbirds Japan migrated away from its former Shopify endpoint. Neither is supported initially. Amazon requires an authorized suitable API for reliable automated coverage; Rakuten/Yahoo APIs require configured application access, and unrestricted scraping is not substituted. No paid feeds, CAPTCHA workarounds, proxy rotation, or account creation. Dedicated footwear and outdoor stores are now enabled; see the expanded source register below. Add other stores only after validating their public feed/pages, robots permissions, Japan delivery, tax-inclusive price evidence, and exact variants.

## Verification and digest

Prices are positive integer, tax-inclusive **JPY**. Shopify product `.js` integer amounts are divided by 100, even for JPY; catalog JSON and HTML offers use major JPY units. Match the exact variant ID, SKU, color/size, titled retail quantity, new retail condition, and price. The product must be published, physically shipped, in stock in both fresh variant JSON and HTML offers, with a live Japan-delivery policy. The default excludes used/refurbished/open-box, preorders, subscriptions, trade-ins, financing-only, conditional memberships/coupons, digital goods, and quantity conditions. These conservative filters can discard legitimate offers containing restriction keywords.

```
discount_percent = (reference_price - sale_price) / reference_price * 100
```

The 50% cutoff uses exact integer cross multiplication **before rounding**. Displayed percentages have two decimals; savings exclude shipping and payment fees. Loyalty points are never subtracted. Missing, nonfinite, fractional/ambiguous reference prices, mismatched variants, tax uncertainty, expired offers, and unavailable stock are excluded. Manufacturer MSRP and retailer previous/list comparisons are labeled; **neither proves savings versus the usual market price**. This release does not fabricate independent historical prices or use market averages. Retailer comparisons are displayed claims, not evidence of a previously completed transaction at that price.

Shipping comes from freshly checked policy evidence when unambiguous. Classical Elf's free-shipping campaign has Okinawa/island exceptions; policy pages can contain differing standard tariffs. The notifier only states the current explicit campaign when the product and policy support it, otherwise says unknown. Other method/address-dependent costs are explicit. Japan delivery means the retailer publicly serves Japan; address-specific availability/fees cannot be confirmed without a destination and checkout. The notifier never enters checkout or guarantees nationwide delivery.

Digest fields: product/variant, store, new retail condition, reference/basis, tax-inclusive sale, calculated discount/yen savings, shipping, JST verification timestamp, and direct variant URL. Rank verified evidence first (explicit manufacturer list comparison above unverified retailer history), then discount and savings. Mobile plain-text chunks retain product boundaries and stay below 3,800 UTF-16 units.

No-deal messages distinguish a complete scan from partial/failed coverage. A failed scan never becomes a successful “no deals” search. Suppressed verified deals receive a separate explanation. Exact variants are suppressed for seven days after successful delivery; notify earlier only when the sale drops at least **5% AND JPY 100** versus its last notified price. Same-day repeats without new deals/coverage changes are suppressed. Unsaved, unsuccessful deliveries remain eligible.

## Configuration

Edit [config.json](config.json), or use `--config PATH`. No credentials belong in it.

| Setting | Meaning/default |
| --- | --- |
| `stores[].enabled` | Toggle each supported source |
| `categories` | Empty = all physical categories; common groups `electronics`, `computer accessories`, `household`, `appliances`, `clothing`, `outdoor`, `other`, or retailer product-type substrings. Keyword classification is conservative; mixed stores do not automatically include every advertised category |
| `excluded_keywords` | Additional product/variant/description/tag exclusions; safety defaults remain enabled |
| `min_price_jpy`, `max_price_jpy` | Inclusive sale-price range; default 0/no upper limit |
| `max_deals` | 1–10; default 10 |
| `dedup_days` | 7–30; default 7 |
| `meaningful_drop_percent`, `meaningful_drop_jpy` | Both must pass; default 5/100 |
| `max_pages_per_store` | 1–20; default 8; 250 products/page |
| `max_products_verified_per_store` | 1–100; default 20 |
| `request_timeout_seconds` | 1–30; default 15 |
| `request_attempts` | 1–3; default 3 total GET attempts |
| `request_interval_seconds` | 1–10 seconds/origin; default 1; respects larger robots crawl delays |
| `source_budget_seconds` | 30–300; default 120 elapsed seconds/store; expiration is explicit incomplete coverage |
| `scan_budget_seconds` | 60–1200; default 600 elapsed seconds overall; remaining time reserved for delivery/history |

`stores` also contains source category metadata, reference/tax/delivery evidence patterns, and policy paths. These are verifier definitions, not permission to relax evidence requirements just to include a deal. Add a tested adapter when a storefront differs from the supported Shopify format. The fixed threshold is 50%; it cannot be lowered through configuration.

## Troubleshooting and recovery

- **Coverage incomplete:** inspect `SCAN` summaries and `run-report.json` in the Actions artifact. Limits are intentional; HTTP 403/429, denied robots paths, schema changes, and policy failures are explicit. Other stores continue independently. Increase caps only within permitted rate limits and workflow duration. If all stores fail, send the incomplete-scan notice and fail the workflow.
- **Telegram failure:** errors never contain the token/chat ID. Check the existing bot and destination through the existing notifier. Explicit 429 responses allow at most two retries, each at most 30 seconds. A timeout/network error may follow an accepted POST; no blind retry occurs. Inspect Telegram before manually retrying an ambiguous send.
- **History save failed after delivery:** download the workflow artifact's `state.json` before retrying. Compare with the state branch and restore the acknowledged entries through a normal authenticated commit/API update to that branch. Do not reset history or retry until repaired. The artifact is retained for 30 days and contains product/history data, never Telegram secrets.
- **Remote state missing/corrupt:** an absent branch on first use is initialized; an existing branch with a missing/corrupt state file fails closed. Restore it from a known good artifact/commit. SHA conflicts fail visibly; never overwrite unknown newer history.
- **Local lock:** check whether the recorded PID still runs. Only delete a stale `.run.lock` after confirming no shopping run is active. Keep existing notifier lock/state paths separate.
- **Schedule late/missing:** verify workflow state is active and inspect Actions queue/run history. GitHub may disable long-inactive scheduled workflows; re-enable the existing shopping workflow when needed. UTC cron does not observe daylight saving; Japan is UTC+9 year-round.

Run reports include discovered counts, exclusions, limits/failures, exact selected evidence, delivery mode/status, and acknowledged message count. Reports and local history are gitignored; deployment acceptance evidence is documented separately.

### Expanded coverage (2026-10-03)

Live verification found 11 SHAKA footwear products at exactly 50% off; Edifier (50 products) and SOUNDPEATS (38 products) had no qualifying variants. SHAKA uses `catalog_page_size: 50` to remain below the bounded response limit; pagination still continues and caps remain explicit. Its current nationwide free-shipping policy is rechecked each run. No shoe size is assumed: alerts show the exact verified size.

Additional probes: AUKEY and Focal public feeds returned 404; KEEN shipping policy was robots-restricted; several other domains redirected across origins and were not enabled. SwitchBot catalog includes promotional gift clones, so it was not enabled pending an adapter that proves unconditional purchase eligibility. Old event pages and search snippets were never used as deal evidence.

### Brand preference

`allowed_brands` now restricts every scheduled/manual run to the configured established-brand list. Matching uses an exact, case-insensitive product vendor, rechecked on fresh product data. A brand mentioned in a compatible accessory title or description does not qualify. Missing or unrecognized vendor fields fail closed. Edit the list to add verified vendor spelling aliases; an empty list disables this filter. This is a user preference, not an independent authenticity certification.

SHAKA, Classical Elf/JaVa, and other vendors outside the list are now excluded. KEEN now provides an enabled established-brand shoe catalog. Nike/Adidas/ASICS/New Balance stores are still unsupported. An allowlisted brand does not mean its store is supported. Existing catalog sources and failures are still reported honestly. Previous Telegram messages remain historical; this preference applies to future runs.

### Broader brand and category coverage

The watchlist now contains 87 brands. Actual enabled sources are Anker, Keychron, UGREEN, Edifier, SOUNDPEATS, KINTO, KEEN, EcoFlow, and Jackery. Classical Elf and SHAKA remain configured but disabled to respect the established-brand preference. Brand-watchlist entries such as Samsonite, Nike, and Dyson do not imply working store coverage.

Recognized configurable category names: electronics, computer accessories, audio, gaming, household, appliances, outdoor, shoes, clothing, sportswear, luggage, personal care, home office, tools, and other. The default empty category list includes all otherwise eligible physical products. Audio/accessories, KINTO household goods, and KEEN/EcoFlow/Jackery footwear and outdoor/power products have actual catalog coverage; luggage, personal care, home-office furniture, tools, and many listed brands remain watchlist-only until a permitted source is verified.

Official-store vendor fields sometimes contain regional names or product-series names. `vendor_brand_aliases` is an explicit exact alias-to-brand map per store, based on public official catalog evidence. An alias is never applied to another source, and its mapped brand must still be allowed. KINTO series aliases exclude the ambiguous HERBAL TEA vendor; Keychron aliases exclude generic Others and switches from other manufacturers. Missing/unmapped vendors remain excluded.

KEEN's robots-restricted shipping-policy endpoint is not accessed: its permitted terms-of-sale and legal-notice pages independently document Japan delivery, tax, and standard non-member shipping. Member shipping benefits are never assumed. EcoFlow and Jackery free shipping must appear in freshly checked policy text. Gift clones, refurbished items, and conditional offers remain excluded.

Additional probes found no compatible public catalog at Coleman/Gregory (404), American Tourister (connection failure), Merrell (cross-origin redirect), and Birkenstock (robots-restricted redirect). These sources are not enabled. No access restrictions were bypassed.

Live expansion validation scanned 4,506 products across the nine enabled stores without source failures or catalog caps. EcoFlow produced qualifying power-station, charging, and solar-bundle variants. A newsletter-only offer was excluded and has a regression test. Jackery candidates without an explicit comparison-price basis remained excluded. Product-label evidence now starts at the exact fresh product title rather than the navigation heading, with a test that rejects reference labels found only in navigation.


## Expanded scan (October 2026)

The configuration now enables **58 distinct stores** and **189 established brand identities**, up from nine stores and 87 brands. This is 6.44× the store count. The live scan covered 59,038 catalog entries, **13.10×** the previous 4,506; entries include products rejected by subsequent filters and may overlap across retailers. This does not mean 90 working stores or ten times as many qualifying deals. Discovery investigated hundreds of additional origins; inaccessible catalogs, robots restrictions, missing Japan delivery/tax evidence, and ambiguous comparison prices prevented a supported 90-store configuration. No restricted endpoints are substituted or counted.

See [the complete source register](docs/source-register.md) for every enabled store and its primary public policy URLs. All use permitted public `/products.json` catalogs and fresh product-page/variant checks. Sources without a current unconditional 50% offer remain useful catalog coverage, not guaranteed deals. Generic retailer vendor fields and private labels are rejected unless independently supported by an explicit established-brand alias. Cosmetics/personal care, stationery, luggage, tools, cookware, outdoor clothing, footwear, and photography accessories now have additional source coverage.

Four distinct stores run concurrently, each with its own client, one-second minimum request interval, timeout/retry limits, and 180-second source budget. One source per origin is enforced. The shared scan budget is 1,200 seconds; queued sources that cannot start before it expires are explicitly reported failed. Existing 25-minute Actions job limit remains. Catalog caps, verification caps, and timeouts all mean incomplete coverage. Large Telegram digests summarize totals and show up to five incomplete sources, with the Actions run/report link for the full list. Sending and state persistence remain serial, after successful delivery acknowledgment.

`max_parallel_sources` supports 1–4, and up to 100 distinct enabled source origins may be configured. `max_pages_per_store` remains capped at 20; increasing source count or catalog limits never weakens product verification, brand filtering, discount threshold, or seven-day deduplication. Scheduled delivery remains 07:00 JST and can start late on GitHub Actions.
