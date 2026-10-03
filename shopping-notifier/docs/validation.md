# Acceptance evidence — 2026-10-03

## Local verification

- Shopping notifier: **42 tests passed**, covering exact prices/discount threshold, missing/ambiguous prices, stock, variants/quantity, restrictions, categories/price limits, deduplication/drop boundaries and actual acknowledgement timestamps, independent failures and missing structured offers, robots, request/body deadlines, formatting/splitting, partial delivery, corrupt/local/remote state, lock, manual modes, and same-day repeats.
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

Example verified exact variant: [Classical Elf mi1019074, beige/M](https://classicalelf.shop/products/mi1019074?variant=46119014662365), JPY 539 versus retailer displayed list reference JPY 4,998, unrounded discount 89.215686...%, displayed 89.22%, savings JPY 4,459. Verification at 15:47:44 JST. This retailer comparison does not prove usual-market savings. Prices/availability may change after verification.

## Unsupported discovery candidates

- Naturehike Japan: public product-feed URL redirected to homepage HTML; no verified adapter added.
- Allbirds Japan: former feed redirects to Goldwin storefront HTML; no verified adapter added.
- Amazon/Rakuten/Yahoo: no suitable configured public API application access reused; no scraping workaround, paid access, CAPTCHA bypass, purchase, or account creation used.

## Deployment acceptance

Implementation pushed to `decniner/Den-Lab` default branch `main` (initial implementation commit `be0b158`). The newer existing Prompt Radar history commit was preserved by rebasing before the push; existing notifier files remain untouched.

- [Initial automatic CI](https://github.com/decniner/Den-Lab/actions/runs/37104489535): successful, shopping tests and existing notifier regressions passed; push event sent no digest.
- [Live Telegram test run](https://github.com/decniner/Den-Lab/actions/runs/37104534964): **successful**. Scan started **15:54:03 JST**. Fresh GitHub-runner results matched the table above: 4,874 catalog products, twenty verified qualifying deals, ten selected. Telegram acknowledged **two** messages, both labeled `TEST DIGEST`; report status `test_digest_sent`.
- Verification artifact: `shopping-verification-37104534964`, artifact ID `11267221942`. Downloaded and inspected the actual `run-report.json`, including exact product evidence, source outcomes, selected variants, and acknowledged-message count. No tokens or chat IDs are in the report.
- Dedicated `shopping-notifier-state` branch initialized with empty version-1 history. After the test, state-file SHA matched the pre-test SHA **byte-for-byte**, with zero sent entries. Test delivery did not prime or suppress tomorrow's normal digest.
- [Shopping workflow](https://github.com/decniner/Den-Lab/actions/workflows/shopping-notifier.yml): GitHub API readback **active**; deployed cron confirmed **`0 22 * * *`**, corresponding to **07:00 Asia/Tokyo daily**. First scheduled delivery after setup is expected October 4, subject to Actions queue/start delays. Exact delivery is not promised.
- History persistence/readback and acknowledged-only partial-delivery behavior are covered offline; state branch creation/file-write access were verified through existing GitHub authorization. The live test intentionally did not send a normal digest or mutate sent history.

Final reliability refinements have passing regression tests: deduplication timestamps use Telegram acknowledgement time, and absent structured price offers are reported as source-verification failure rather than a successful empty search. Final follow-up commit includes these and this evidence. Local report remains gitignored at `shopping-notifier/run-report.json`; fresh Actions artifacts are retained for 30 days.
