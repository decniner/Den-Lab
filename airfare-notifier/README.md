# NRT–MNL airfare alerts

Free Python notifier for one adult, economy, round trip NRT → MNL → NRT with both legs nonstop. Defaults: departure six to twelve **calendar months** after each Japan-local search date, stay 9–20 nights, displayed round-trip total **¥25,000 or below**. Return may fall after the departure-window end.

The latest request accepts the flight source's displayed total without independently checking additional costs. The notifier does not claim the supplier checkout amount is verified. Optional extras are not added to that displayed total. Prices are compared precisely with decimals; fractional yen above the threshold do not qualify.

## Run and configure

Python 3.12 or newer; standard library only. Keep the existing `shopping-notifier` folder alongside this folder: the airfare notifier reuses its Telegram sender, redacted GitHub transport and run lock. No existing notifier code or history is changed.

From the Den-Lab root:

```console
python -m unittest discover -s airfare-notifier/tests -v
python airfare-notifier/notifier.py --dry-run
```

`--dry-run` runs live searches and refreshes valid results, prints the checked dates and alert preview, and never sends a message or changes notification history. It does not need bot or flight-data credentials. A temporary local lock prevents concurrent CLI runs. A preview can include an above-budget fare even though normal alert-only delivery would be silent.

Edit `config.json`:

| Setting | Default | Meaning |
| --- | --- | --- |
| `departure_months_min`, `departure_months_max` | 6, 12 | Inclusive calendar-month departure window |
| `nights_min`, `nights_max` | 9, 20 | Nights from local Manila arrival to return departure |
| `threshold_jpy` | 25000 | Source-displayed round-trip total threshold |
| `samples_per_day` | 6 | Daily date pairs, spread across the window and rotating daily |
| `daily_summary` | false | Alert only at/below threshold; true restores daily summaries including above-budget fallback/no verified fare |
| `request_timeout_seconds` | 45 | Per HTTP request timeout |
| `request_attempts` | 2 | Bounded retries for read-only flight searches |

`--config PATH` chooses another configuration. `--state PATH` chooses isolated local state. Configuration rejects booleans as numeric values, reversed ranges and unbounded request settings.

## Cloud setup

Merge `airfare-notifier/` and `.github/workflows/airfare-notifier.yml` into the existing repository default branch. Use existing Actions secrets `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`; never commit or print them. No new paid service or flight API account is required. GitHub Actions must be enabled and have `contents: write` permission for the notification job's dedicated state branch. Existing Netflix/shopping workflows continue separately.

The independent workflow targets **07:00 Asia/Tokyo** using `0 22 * * *` UTC, and works with the PC off. GitHub Actions does not guarantee exact timing and can delay or drop jobs. See [GitHub's scheduling limitations](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule). Public-repository scheduled workflows may be disabled after 60 days of inactivity. GitHub plan quotas still apply; do not enable paid Actions overages. This checkout contains the workflow but scheduling is not active until it is merged into the hosted repository.

Manual Actions runs default to dry run. To enable actual delivery in a manual run, uncheck its dry-run input. Local delivery requires the two Telegram environment variables. Production Actions uses `--github-state` with its existing `GITHUB_TOKEN`, storing delivery claims on `airfare-notifier-state`, path `airfare-notifier/state.json`. State is written before Telegram, never after sending alone. No history files from another notifier are reused.

## Source and coverage

[OctoTrip's published free MCP server](https://github.com/OctoTrip/flights) supports live round-trip flight searches with JPY prices, leg details, baggage strings and affiliate seller links. No signup/key/card is needed. It is a public read-only API, not airline-webpage scraping. The notifier obeys its documented one-request-per-second limit, uses bounded retries, and stops on access restrictions. It never buys a ticket or creates a reservation.

Live research on this route returned Cebu Pacific, Philippine Airlines and connecting alternatives. That demonstrates some route coverage, **not all airlines or fares**. AirAsia coverage has not been established. Results are an aggregated subset. The source does not document a daily request quota or service-level guarantee. The default uses at most twelve logical searches/day (six discovery plus up to six rechecks), at most 24 HTTP attempts with default retries. Counts and exact checked dates appear in the run log. Most combinations in the six-month window are not checked each day. Increase the bounded sample setting only within provider limits.

The program rejects wrong routes, missing return flights, connections, intermediate stops declared by the source, invalid prices, wrong currency, member-only/from-price flags, and unavailable/incomplete fare flags. It requires exactly one leg each way and zero source-declared stops. If the upstream omits a restriction or undisclosed technical stop, the program cannot infer it; source errors must not be presented as exhaustive verification. It reruns searches for valid candidate dates before choosing the lowest refreshed fare. A refreshed source result is not a supplier reprice/checkout guarantee.

Baggage is quoted as **source-listed, unverified**. The live response included suspicious text such as `6x7kg`; it must not be treated as an assured allowance. The supplier controls baggage, refund/change rules and any extra charges. Affiliate booking links can expire in about 15 minutes; one research link returned HTTP 403, and no bypass was attempted. Alerts retain the source link and timestamp, but availability may change before booking.

The alert explicitly says **cheapest found among checked sources**, shows local JST/PHT times, both dates, nights, displayed JPY total, baggage, seller, booking link, incomplete date coverage and refresh timestamp. In alert-only mode, above-budget and successful empty searches are silent; errors are reported and exit nonzero. In daily mode, successful empty searches say “No verified fare found today.” Here “verified” means complete and filtered at the source-listed price, not supplier checkout verified. Partial failures are included in a qualifying/daily summary; failures without a fare alert generate one operational alert per Japan calendar day.

## Retry deduplication and recovery

At most one fare/daily summary is automatically attempted per Japan day, even if unchanged. Operational alerts use a separate daily key, so an error does not block a later qualifying fare. Local runs require the filesystem lock; scheduled runs use workflow concurrency plus GitHub Contents API SHA comparisons. All state failures stop delivery. A Telegram 429 may retry only when the server explicitly rejected the request; ambiguous transport failures are never blindly retried.

Delivery has an unavoidable tradeoff: Telegram has no idempotency key. A durable `claimed` state is saved before sending. A crash or ambiguous send can leave that claim without an alert; the next run skips it rather than risking duplication. A `sent` state is written only after Telegram acknowledgment. If a claim is stuck, inspect the chat and Actions logs first. Only after confirming **no message was delivered**, remove that day's claim from `summaries` (or the `DATE:search-failed` claim in `operations`) on the dedicated state branch, and run again. Never delete/reset all history to retry. If the state write failed, compare the remote history with the uploaded local recovery artifact before taking action.

Operational errors are redacted to source and exception category, not arbitrary exception text or credential-bearing URLs. Search failures are logged on every run while repeated Telegram error alerts are suppressed for the day. A state/delivery failure exits nonzero and is visible as a failed Actions run; Telegram delivery cannot be promised when its credentials or durable state are unavailable.
