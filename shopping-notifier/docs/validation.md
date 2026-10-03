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


## Tenfold catalog expansion — 2026-10-03

Live dry run started 18:18:10 JST and scanned **59,038 catalog entries**, versus the previous **4,506**: **13.10× catalog coverage**. These are catalog entries across stores, including entries subsequently excluded by brand/price/stock filters; they are not 59,038 qualifying deals or guaranteed unique products across retailers. Enabled distinct stores increased **9 → 58 (6.44×)** and configured established brand identities **87 → 189**. The initial target of 90 working stores was not met: unavailable or restricted catalogs and insufficient policy/price evidence prevented counting additional candidates. No categories, access restrictions, or verification requirements were relaxed to inflate counts.

All 58 configured catalogs were accessible: **46 complete source scans, 12 partial, zero wholly failed**. Partial sources were A&F (missing Offer evidence plus verification cap), Rimba (missing HTML variant evidence), Kinetics/Mita (catalog caps), Saucony/Brooks/Champion/Phenix/Levi's/Cotopaxi (verification caps), Orange (catalog and verification caps), and Boardriders (catalog and verification caps, including expired candidate offers rejected). Limits are explicit in Telegram and per-source reports.

**102 products passed strict live verification** before seven-day sent-history filtering; ten were selected for two safe mobile chunks. Actual deal-producing sources included Merrell, Saucony, Brooks, Phenix, A&F, Orange, Toffy, Cotopaxi, côte&ciel, and existing EcoFlow. Electronics additions SwitchBot, Kitcut, cado, and Ulanzi all had accessible catalogs and no source errors, but none produced an eligible offer in this run. Existing sent EcoFlow deals remain subject to suppression during real scheduled/manual execution. Search does not guarantee new electronics deals every day.

Final local verification: **57 shopping tests passed**, including 90-source capacity, unique-origin enforcement, concurrent overlap/order, client/deadline isolation, large incomplete-coverage mobile formatting, and fresh shipping-rate changes/boundaries. **14 existing LLM Prompt Radar tests passed**; shopping Python modules compiled. Read-only review found no Critical/Important issue; an inactive Paago Works alias target was added explicitly. Existing Netflix/LLM/news implementations and state were not changed. Shopping source provenance is in [source-register.md](source-register.md).

Final edits added narrowly scoped Japanese official-store vendor aliases and fresh Toffy/Phenix standard shipping rules. A targeted follow-up live dry run checks those edits; normal Actions delivery also performs fresh verification of the complete final configuration. Local dry runs made no Telegram requests and did not create or alter sent state.

The final focused review caught substring matching of increased shipping thresholds (15,500 versus 5,500; 110,000 versus 10,000). Numeric boundaries and regressions now reject these changed policies. Final fresh Toffy guide verification confirmed JPY 550 below JPY 5,500 and JPY 0 above it; Phenix standard rates and individual-item/island exceptions were confirmed in the targeted live scan.
