"""Mobile-sized plain-text Telegram digests and acknowledged-only history."""
from __future__ import annotations

import hashlib
import json
import os
import time
from dataclasses import dataclass
from datetime import datetime
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from deals import BASIS_LABELS, Deal, clean


@dataclass
class Chunk:
    text: str
    deals: list[Deal]


def utf16_length(text):
    return len(text.encode("utf-16-le")) // 2


def format_digest(deals, results, now, *, test=False, suppressed=0):
    heading = ("TEST DIGEST — Japan shopping (history unchanged)" if test else "Japan shopping — verified 50%+ deals")
    lines = [heading, now.date().isoformat() + " · Japan / JST"]
    incomplete = [r for r in results if r.status != "ok"]
    if incomplete:
        lines.append("Coverage incomplete — failed or bounded sources:")
        for r in incomplete[:5] if len(results) > 12 else incomplete:
            details = ", ".join(r.errors + r.limits) or r.status
            lines.append(f"• {clean(r.store, 60)}: {clean(details, 180)}")
        if len(results) > 12 and len(incomplete) > 5:
            lines.append(f"• {len(incomplete) - 5} more incomplete sources; see full verification report.")
    if len(results) > 12:
        lines.append(f"Coverage: {len(results)} sources ({len(results) - len(incomplete)} complete, {len(incomplete)} incomplete); "
                     f"{sum(r.products_scanned for r in results):,} products scanned.")
        repo, run_id = os.environ.get("GITHUB_REPOSITORY", ""), os.environ.get("GITHUB_RUN_ID", "")
        import re
        if re.fullmatch(r"[\w.-]+/[\w.-]+", repo) and run_id.isdigit():
            lines.append(f"Full source report: https://github.com/{repo}/actions/runs/{run_id}")
    else:
        lines.append("Coverage: " + "; ".join(f"{clean(r.store, 50)} {r.products_scanned} products" for r in results))
    if deals:
        lines.append("Reference comparisons are not usual market-price savings. Shipping excluded from discount.")
    elif any(r.errors or r.status == "failed" for r in results):
        lines.append("No verified deals could be reported; the scan failed for some/all sources.")
    elif suppressed:
        lines.append(f"No newly reportable deals today; {suppressed} unchanged verified deals suppressed for seven days.")
    else:
        lines.append("No verified qualifying deals today" + (" within the scan limits." if incomplete else "."))
    if suppressed and deals:
        lines.append(f"{suppressed} unchanged deals suppressed (seven-day history).")
    header = "\n".join(lines)
    chunks = []
    text, contained = header, []
    for index, d in enumerate(deals, 1):
        verified = datetime.fromisoformat(d.verified_at).astimezone(now.tzinfo).strftime("%Y-%m-%d %H:%M:%S JST")
        block = "\n".join((
            f"{index}. {clean(d.name)}", f"Variant: {clean(d.variant)} · {d.quantity}",
            f"{clean(d.store, 80)} · {d.condition}",
            f"Reference: JPY {d.reference_price:,.0f} — {BASIS_LABELS[d.reference_basis]}",
            f"Sale: JPY {d.sale_price:,.0f} (tax included)",
            f"Discount: {d.discount_percent:.2f}% · Savings: JPY {d.savings:,.0f}",
            f"Shipping: {clean(d.shipping, 220)}", f"Verified: {verified}", d.url,
        ))
        if utf16_length(block) > 3500:
            raise RuntimeError("Product block exceeds safe Telegram size; no truncated product URL sent")
        if utf16_length(text + "\n\n" + block) > 3600:
            chunks.append(Chunk(text, contained))
            text, contained = heading + " (continued)", []
        text += "\n\n" + block
        contained.append(d)
    chunks.append(Chunk(text, contained))
    if len(chunks) > 1:
        for index, chunk in enumerate(chunks, 1):
            chunk.text = f"[{index}/{len(chunks)}] " + chunk.text
    if any(utf16_length(c.text) > 3800 for c in chunks):
        raise RuntimeError("Coverage/message exceeds safe Telegram size")
    return chunks


def send_telegram(text, *, opener=urlopen, sleep=time.sleep):
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat:
        raise RuntimeError("Existing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID Actions secrets are unavailable")
    if utf16_length(text) > 3800:
        raise RuntimeError("Telegram message exceeds safe length")
    payload = json.dumps({"chat_id": chat, "text": text, "disable_web_page_preview": True}).encode("utf-8")
    request = Request(f"https://api.telegram.org/bot{token}/sendMessage", data=payload,
                      headers={"Content-Type": "application/json"}, method="POST")
    for attempt in range(3):
        try:
            with opener(request, timeout=20) as response:
                result = json.loads(response.read(1024 * 1024))
            if result.get("ok") is not True or not result.get("result", {}).get("message_id"):
                raise RuntimeError("Telegram rejected or did not acknowledge the message; sent state unchanged")
            return result["result"]["message_id"]
        except HTTPError as exc:
            status = exc.code
            retry = None
            if status == 429:
                try:
                    retry = int(json.loads(exc.read(16384)).get("parameters", {}).get("retry_after", 1))
                except (ValueError, TypeError, AttributeError):
                    pass
            exc.close()
            if status == 429 and retry is not None and 0 <= retry <= 30 and attempt < 2:
                sleep(retry)
                continue
            raise RuntimeError(f"Telegram HTTP {status}; unacknowledged deals not marked sent") from None
        except (URLError, TimeoutError, OSError, ValueError, AttributeError) as exc:
            # POST completion is ambiguous after transport failures. Never blindly retry a send.
            raise RuntimeError(f"Telegram delivery unconfirmed ({type(exc).__name__}); inspect chat before retrying") from None
    raise RuntimeError("Telegram rate-limit retries exhausted")


def deliver(chunks, history, state, sender, now, *, test=False, dry_run=False, coverage_key="", clock=None):
    if dry_run:
        return 0
    if not test:
        state.prepare()
    for index, chunk in enumerate(chunks):
        sender(chunk.text)
        acknowledged_at = clock() if clock else now
        if test:
            continue
        for d in chunk.deals:
            history["sent"][d.key] = {"sale_price": str(d.sale_price), "reference_price": str(d.reference_price),
                                       "sent_at": acknowledged_at.isoformat(timespec="seconds"), "url": d.url}
        if index == len(chunks) - 1:
            history["last_digest"] = {"date": now.date().isoformat(), "coverage_key": coverage_key,
                                      "completed_at": acknowledged_at.isoformat(timespec="seconds"),
                                      "digest_hash": hashlib.sha256("\n".join(c.text for c in chunks).encode()).hexdigest()}
        state.save(history)
    return len(chunks)
