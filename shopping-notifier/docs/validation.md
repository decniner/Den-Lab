# Acceptance evidence — 2026-10-03

## Local verification

- Shopping notifier: **40 tests passed**, covering exact prices/discount threshold, missing/ambiguous prices, stock, variants/quantity, restrictions, categories/price limits, deduplication/drop boundaries, independent failures, robots, request/body deadlines, formatting/splitting, partial delivery, corrupt/local/remote state, lock, manual modes, and same-day repeats.
- Existing LLM Prompt Radar: **14 tests passed**. Netflix notifier and all notifier Python sources compiled. Existing code/workflows/history were not changed.
- Independent read-only review found two important issues: insufficient proof to call Classical Elf's list price manufacturer MSRP, and no elapsed-time source/scan budgets. Both were fixed. The analytics-metadata regression, mixed-category filtering, and deadline behavior also have regression tests.

## Live local dry run

Run started **2026-10-03 15:47:16 JST**. Each selected product had fresh product JSON, public HTML exact-variant price/stock evidence, and a live Japan shipping policy. No Telegram calls or sent-history writes occurred.

| Source | Catalog products scanned | Verified qualifying deals | Status |
| --- | ---: | ---: | --- |
| Classical Elf | 2,000 | 20 | Working; catalog/page-verification caps reached, disclosed as incomplete |
| Anker Japan | 1,779 | 0 | Working; missing references, sub-threshold/conditional/unavailable entries excluded |
| Keychron Japan | 387 | 0 | Working catalog; no valid reference-price candidates |
| KINTO Japan | 673 | 0 | Working catalog; no valid reference-price candidates |
| UGREEN Japan | 35 | 0 | Working; all reference comparisons below 50% |

**4,874 catalog products total; ten selected deals; two mobile-sized messages.** Actual qualifying coverage was clothing in this run; catalog coverage also spans electronics/computer accessories, household goods, appliances, and limited portable-power/drinkware outdoor products. No source request failures occurred. Scan bounds do not imply exhaustive store coverage.

Example verified exact variant: [Classical Elf mi1019074, beige/M](https://classicalelf.shop/products/mi1019074?variant=46119014662365), JPY 539 versus retailer displayed list reference JPY 4,998, unrounded discount 89.215686...%, displayed 89.22%, savings JPY 4,459. Verification at 15:47:43 JST. This retailer comparison does not prove usual-market savings. Prices/availability may change after verification.

## Unsupported discovery candidates

- Naturehike Japan: public product-feed URL redirected to homepage HTML; no verified adapter added.
- Allbirds Japan: former feed redirects to Goldwin storefront HTML; no verified adapter added.
- Amazon/Rakuten/Yahoo: no suitable configured public API application access reused; no scraping workaround, paid access, CAPTCHA bypass, purchase, or account creation used.

## Deployment acceptance

Implementation is ready for authorized push and Actions validation. Remote run URLs, Telegram acknowledgement evidence, and enabled schedule readback will be recorded after execution. Local dry-run report remains available as gitignored `shopping-notifier/run-report.json`; Actions uploads its own fresh report as an artifact.
