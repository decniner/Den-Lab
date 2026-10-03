"""Curated Japan storefronts. Feed candidates are never final deal evidence."""
from __future__ import annotations

import json
import re
from collections import Counter
from dataclasses import dataclass, field, replace
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from html.parser import HTMLParser
from urllib.parse import parse_qs, quote, urlsplit

from deals import Deal, Rejected, clean, eligible, rank, validate_variant
from network import SourceError


@dataclass
class SourceResult:
    store: str
    status: str = "ok"
    products_scanned: int = 0
    products_verified: int = 0
    deals: list[Deal] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    limits: list[str] = field(default_factory=list)
    exclusions: dict = field(default_factory=dict)

    def record(self):
        return {"store": self.store, "status": self.status, "products_scanned": self.products_scanned,
                "products_verified": self.products_verified, "verified_deals": len(self.deals),
                "errors": self.errors, "limits": self.limits, "exclusions": self.exclusions}


class Page(HTMLParser):
    def __init__(self, page):
        super().__init__(convert_charrefs=True)
        self.parts, self.main_parts, self.scripts = [], [], []
        self.script = None
        self.script_type = ""
        self.skip = 0
        self.in_main = False
        self.feed(page)

    def handle_starttag(self, tag, attrs):
        if tag == "h1":
            self.in_main = True
        if tag in ("script", "style"):
            self.skip += 1
        if tag == "script":
            self.script = []
            self.script_type = dict(attrs).get("type", "")

    def handle_endtag(self, tag):
        if tag == "script" and self.script is not None:
            self.scripts.append((self.script_type, "".join(self.script)))
            self.script = None
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)

    def handle_data(self, data):
        if self.script is not None:
            self.script.append(data)
        if not self.skip:
            self.parts.append(data)
            if self.in_main:
                self.main_parts.append(data)

    @property
    def text(self):
        return " ".join(" ".join(self.parts).split())

    @property
    def main_text(self):
        return " ".join(" ".join(self.main_parts).split())[:3000]


def _major_variant(v):
    result = dict(v)
    for key in ("price", "compare_at_price"):
        value = v.get(key)
        if value is not None and not isinstance(value, bool):
            try:
                result[key] = Decimal(str(value)) / 100
            except InvalidOperation:
                raise Rejected("missing_or_invalid_price") from None
    return result


def _page_products(page: Page, product_id):
    decoder = json.JSONDecoder()
    for _, script in page.scripts:
        for match in re.finditer(r'\{\s*"id"\s*:\s*' + re.escape(str(product_id)) + r'\s*[,}]', script):
            try:
                value, _ = decoder.raw_decode(script[match.start():])
                if isinstance(value, dict) and isinstance(value.get("variants"), list):
                    yield value
            except json.JSONDecodeError:
                continue


def _offers(value):
    if isinstance(value, list):
        for child in value:
            yield from _offers(child)
    elif isinstance(value, dict):
        if value.get("@type") == "Offer":
            yield value
        for child in value.values():
            if isinstance(child, (dict, list)):
                yield from _offers(child)


def _shipping(store, policy_text, sale):
    rule = store.get("shipping_rule", "unknown")
    if rule == "toffy" and re.search(r"(?<![\d,])5,500円[（(]税込[）)]以上.*送料無料.*送料は全国一律550円", policy_text):
        return "JPY 0 (item >=JPY 5,500)" if sale >= 5500 else "JPY 550 (order <JPY 5,500)"
    if rule == "phenix" and re.search(r"全国一律[（(]沖縄、離島を除く[）)]\s*490円.*沖縄県\s*990円", policy_text) and re.search(r"(?<![\d,])10,000\(税込\)以上.*送料無料", policy_text):
        base = "JPY 0 for standard items >=JPY 10,000" if sale >= 10000 else "JPY 490; Okinawa JPY 990"
        return base + "; individual-item shipping/island exceptions unknown"
    if rule == "keen" and re.search(r"2,999円以下：300円.*3,000円～13,999円：600円.*14,000円以上：送料無料", policy_text):
        if sale >= 14000:
            return "JPY 0 (item >=JPY 14,000; non-member)"
        return ("JPY 300; Hokkaido/Okinawa JPY 400 (non-member)" if sale < 3000
                else "JPY 600; Hokkaido/Okinawa JPY 800 (non-member)")
    if (rule == "ecoflow" and re.search(r"送料：\s*無料", policy_text)) or (rule == "jackery" and re.search(r"全ての商品が送料無料", policy_text)):
        return "JPY 0 (Japan; current published policy)"
    if rule == "shaka" and re.search(r"全国一律：送料無料", policy_text):
        return "JPY 0 (Japan; current published policy)"
    if rule == "classicalelf" and re.search(r"全品\s*送料無料キャンペーン実施中", policy_text):
        if re.search(r"沖縄県.*離島.*1,390円", policy_text):
            return "JPY 0 campaign; Okinawa/island parcel delivery +JPY 1,390; confirm destination"
    if rule == "anker" and re.search(r"4000円未満.*送料540円.*4000円以上.*送料無料", policy_text):
        return ("JPY 0 (item >=JPY 4,000)" if sale >= 4000 else "JPY 540 (order <JPY 4,000)") + "; some Okinawa addresses excluded"
    if rule == "keychron" and re.search(r"5,000円以上.*国内送料無料.*5,000円未満.*660円", policy_text):
        return "JPY 0 (item >=JPY 5,000)" if sale >= 5000 else "JPY 660 (order <JPY 5,000)"
    if rule == "kinto" and re.search(r"5,500円.*送料無料", policy_text):
        return "JPY 0 (item >=JPY 5,500)" if sale >= 5500 else "JPY 550; eligible mail parcels JPY 275; method unknown"
    return "Unknown; confirm at checkout"


def verify_product(product, variant, html_page, store, config, now, policy_text):
    page = Page(html_page)
    deal = validate_variant(product, _major_variant(variant), store, config, now)
    # Start at the exact fresh product title, never the site's navigation heading.
    text = page.text
    title_start = text.find(clean(product.get("title") or "", 1000))
    if title_start < 0:
        raise Rejected("product_title_evidence_missing")
    product_text = text[title_start:title_start + 3000]
    if not re.search(store["japan_delivery_pattern"], policy_text):
        raise Rejected("japan_delivery_not_confirmed")
    if not re.search(store["tax_pattern"], product_text + " " + policy_text):
        raise Rejected("tax_inclusive_not_confirmed")
    if not re.search(store["reference_pattern"], product_text):
        raise Rejected("ambiguous_reference_basis")
    matching = []
    for embedded in _page_products(page, product["id"]):
        if embedded.get("handle") != product.get("handle"):
            continue
        matching.extend(v for v in embedded["variants"]
                        if str(v.get("id")) == deal.variant_id and
                        {"available", "title", "requires_shipping", "compare_at_price"}.issubset(v))
    if not matching:
        raise SourceError("page_variant_evidence_missing")
    # Any conflicting embedded variant is ambiguous, even if a second copy looks favorable.
    for v in matching:
        other = validate_variant(product, _major_variant(v), store, config, now)
        if (other.sale_price, other.reference_price, other.variant, other.sku) != (
                deal.sale_price, deal.reference_price, deal.variant, deal.sku):
            raise Rejected("html_variant_disagrees")
    offers = []
    structured_offers_seen = 0
    expected = urlsplit(deal.url)
    for kind, script in page.scripts:
        if kind != "application/ld+json":
            continue
        try:
            candidates = list(_offers(json.loads(script)))
        except json.JSONDecodeError:
            continue
        structured_offers_seen += len(candidates)
        for offer in candidates:
            parts = urlsplit(str(offer.get("url", "")))
            ids = parse_qs(parts.query).get("variant", [])
            if parts.netloc and parts.netloc != expected.netloc:
                continue
            if parts.path and parts.path != expected.path:
                continue
            if ids:
                if ids == [deal.variant_id] and (not offer.get("sku") or offer["sku"] == deal.sku):
                    offers.append(offer)
            elif deal.sku and offer.get("sku") == deal.sku:
                offers.append(offer)
    if not structured_offers_seen:
        raise SourceError("page_offer_evidence_missing")
    if not offers:
        raise Rejected("matching_variant_offer_missing")
    for offer in offers:
        if offer.get("priceCurrency") != "JPY":
            raise Rejected("not_jpy")
        try:
            if Decimal(str(offer.get("price"))) != deal.sale_price:
                raise Rejected("html_price_disagrees")
        except InvalidOperation:
            raise Rejected("html_price_invalid") from None
        if str(offer.get("availability", "")).rsplit("/", 1)[-1] != "InStock":
            raise Rejected("html_unavailable")
        if offer.get("itemCondition") and str(offer["itemCondition"]).rsplit("/", 1)[-1] != "NewCondition":
            raise Rejected("not_new_condition")
        expiry = offer.get("priceValidUntil")
        if expiry:
            try:
                if "T" in expiry:
                    expiry_time = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
                    if expiry_time.tzinfo is None or expiry_time < now:
                        raise Rejected("expired_offer")
                elif date.fromisoformat(expiry) < now.date():
                    raise Rejected("expired_offer")
            except (ValueError, TypeError):
                raise Rejected("expired_or_invalid_offer_date") from None
    return replace(deal, shipping=_shipping(store, policy_text, deal.sale_price),
                   shipping_policy_url=store["base_url"] + store["policy_paths"][0],
                   tax_evidence_url=deal.url, price_evidence_url=deal.url,
                   evidence_quality=deal.evidence_quality + 10)


def scan_store(store: dict, config: dict, client, now: datetime, *, history=None, clock=None) -> SourceResult:
    result = SourceResult(store["name"])
    exclusions = Counter()
    base = store["base_url"].rstrip("/")
    try:
        policies = [Page(client.get(base + path)).text for path in store["policy_paths"]]
        policy_text = " ".join(policies)
        if not re.search(store["japan_delivery_pattern"], policy_text):
            raise SourceError("japan_shipping_policy_not_confirmed")
        candidates = {}
        page_size = store.get("catalog_page_size", 250)
        for page_number in range(1, config.get("max_pages_per_store", 8) + 1):
            data = json.loads(client.get(f"{base}/products.json?limit={page_size}&page={page_number}"))
            products = data.get("products") if isinstance(data, dict) else None
            if not isinstance(products, list) or (page_number == 1 and not products):
                raise SourceError("catalog_schema_missing_or_empty")
            result.products_scanned += len(products)
            for product in products:
                if not isinstance(product, dict) or not isinstance(product.get("variants"), list):
                    raise SourceError("catalog_variant_schema_missing")
                good = []
                for v in product["variants"]:
                    try:
                        good.append(validate_variant(product, v, store, config, now))
                    except Rejected as exc:
                        exclusions[str(exc)] += 1
                if good:
                    chosen = rank(good)[0]
                    candidates[chosen.product_id] = (chosen, product)
            if len(products) < page_size:
                break
        else:
            result.limits.append("catalog_page_limit")
        ordered = sorted(candidates.values(), key=lambda item: (
            not eligible(item[0], history or {"sent": {}}, now, config),
            -item[0].evidence_quality, -item[0].discount_percent, -item[0].savings, item[0].key))
        cap = config.get("max_products_verified_per_store", 20)
        if len(ordered) > cap:
            result.limits.append("product_verification_limit")
        for preliminary, discovery in ordered[:cap]:
            try:
                handle = quote(discovery["handle"], safe="")
                fresh = json.loads(client.get(f"{base}/products/{handle}.js"))
                if fresh.get("id") != discovery["id"] or fresh.get("handle") != discovery["handle"]:
                    raise SourceError("product_identity_changed")
                variants = [v for v in fresh.get("variants", []) if str(v.get("id")) == preliminary.variant_id]
                if len(variants) != 1:
                    raise Rejected("variant_missing")
                # Revalidate even before fetching the page, so a sold-out/expired feed entry is never sent.
                validate_variant(fresh, _major_variant(variants[0]), store, config, now)
                page = client.get(preliminary.url)
                deal = verify_product(fresh, variants[0], page, store, config, clock() if clock else now, policy_text)
                result.deals.append(deal)
                result.products_verified += 1
            except Rejected as exc:
                exclusions[str(exc)] += 1
            except SourceError as exc:
                if str(exc) in ("HTTP 404", "HTTP 410"):
                    exclusions["product_removed"] += 1
                else:
                    result.errors.append(str(exc))
            except (ValueError, TypeError, KeyError, AttributeError):
                result.errors.append("invalid_product_page_data")
        if result.errors or result.limits:
            result.status = "partial"
    except SourceError as exc:
        result.status = "partial" if result.deals else "failed"
        result.errors.append(str(exc))
    except (ValueError, TypeError, KeyError, AttributeError):
        result.status = "partial" if result.deals else "failed"
        result.errors.append("invalid_catalog_or_policy_data")
    result.errors = sorted(set(result.errors))
    result.exclusions = dict(exclusions)
    return result
