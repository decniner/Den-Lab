"""Conservative physical-product validation and exact JPY calculations."""
from __future__ import annotations

import html
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation
from urllib.parse import quote

DEFAULT_EXCLUSIONS = [
    "中古", "再生品", "整備済", "リファービッシュ", "used", "refurbished", "renewed",
    "subscription", "定期便", "定期購入", "下取り", "trade-in", "会員限定", "メンバー限定",
    "ログイン限定", "クーポン適用", "クーポン利用", "クーポンコード", "coupon",
    "特別ご優待", "-shahan", "予約販売", "予約商品", "pre-order", "preorder", "レンタル",
    "gift card", "ギフトカード", "月額", "financing", "分割払い限定", "展示品", "開封品",
]
BASIS_LABELS = {
    "manufacturer_suggested_price": "Manufacturer list price / MSRP (store-displayed)",
    "retailer_previous_price": "Retailer previous/list comparison price (store-displayed; history unverified)",
}

CATEGORY_PATTERNS = {
    "clothing": r"clothing|\bcoat\b|shirt|dress|jacket|pants|knit|ニット|スカート|ワンピース|パンツ|ジャケット|トップス|カーディガン|服|シューズ",
    "computer accessories": r"keyboard|keycap|mouse|usb.?hub|docking|nas\b|キーボード|キーキャップ|マウス|ドッキング|ハブ|パソコン",
    "household": r"household|kitchen|glass|mug|cup|bottle|tableware|cookware|dish|カップ|マグ|グラス|食器|鍋|キッチン",
    "appliances": r"appliance|robot vacuum|robovac|projector|掃除機|家電|炊飯|洗濯|プロジェクター",
    "outdoor": r"outdoor|camping|portable power station|portable solar|solix|trail.?tumbler|キャンプ|アウトドア|登山|寝袋|トレッキング",
}


def product_categories(product, store):
    text = clean(" ".join(str(product.get(k, "")) for k in ("title", "product_type", "type", "tags")), 10000).casefold()
    categories = {name for name, pattern in CATEGORY_PATTERNS.items() if re.search(pattern, text)}
    # These curated stores have narrow verified physical catalogs. Mixed stores such as
    # Anker do NOT gain every category merely from the store's advertised coverage.
    if store["id"] in ("anker", "keychron", "ugreen"):
        categories.add("electronics")
    if store["id"] == "keychron":
        categories.add("computer accessories")
    if store["id"] == "kinto":
        categories.add("household")
    if store["id"] == "classicalelf" or store.get("category") == "clothing":
        categories.add("clothing")
    return categories or {"other"}


class Rejected(ValueError):
    """Expected exclusion, with a short safe diagnostic code."""


def yen(value) -> Decimal:
    if value is None or isinstance(value, bool):
        raise Rejected("missing_or_invalid_price")
    try:
        amount = Decimal(str(value))
    except InvalidOperation:
        raise Rejected("missing_or_invalid_price") from None
    if not amount.is_finite() or amount <= 0 or amount != amount.to_integral_value():
        raise Rejected("missing_or_invalid_price")
    return amount


def clean(value, limit=180) -> str:
    text = html.unescape(re.sub(r"<[^>]*>", " ", str(value or "")))
    text = re.sub(r"[\x00-\x1f\x7f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]", " ", text)
    return " ".join(text.split())[:limit]


@dataclass(frozen=True)
class Deal:
    store_id: str
    store: str
    product_id: str
    variant_id: str
    name: str
    variant: str
    sku: str
    category: str
    reference_price: Decimal
    sale_price: Decimal
    reference_basis: str
    url: str
    verified_at: str
    condition: str = "New (retail listing)"
    quantity: str = "1 retail unit / pack as titled"
    shipping: str = "Unknown; confirm at checkout"
    shipping_policy_url: str = ""
    tax_evidence_url: str = ""
    price_evidence_url: str = ""
    evidence_quality: int = 0

    @property
    def key(self) -> str:
        return f"{self.store_id}:{self.product_id}:{self.variant_id}"

    @property
    def savings(self) -> Decimal:
        return self.reference_price - self.sale_price

    @property
    def discount_percent(self) -> Decimal:
        return self.savings / self.reference_price * 100

    def record(self) -> dict:
        result = asdict(self)
        for key in ("reference_price", "sale_price"):
            result[key] = str(result[key])
        result.update(discount_percent=str(self.discount_percent), savings_jpy=str(self.savings))
        return result


def validate_variant(product: dict, variant: dict, store: dict, config: dict, now: datetime) -> Deal:
    reference = yen(variant.get("compare_at_price"))
    sale = yen(variant.get("price"))
    # Integer-price cross multiplication applies the threshold before any rounding/division.
    if (reference - sale) * 100 < reference * 50:
        raise Rejected("below_50_percent")
    if variant.get("available") is not True:
        raise Rejected("unavailable")
    if variant.get("requires_shipping") is not True:
        raise Rejected("not_physical")
    if variant.get("requires_selling_plan") or product.get("requires_selling_plan"):
        raise Rejected("subscription")
    rule = variant.get("quantity_rule") or {"min": 1, "increment": 1}
    if rule.get("min", 1) != 1 or rule.get("increment", 1) != 1 or rule.get("max") == 0:
        raise Rejected("conditional_quantity")
    if not product.get("id") or not variant.get("id") or not product.get("handle") or not product.get("title"):
        raise Rejected("missing_variant_identity")
    if store.get("reference_basis") not in BASIS_LABELS:
        raise Rejected("ambiguous_reference_basis")
    published = product.get("published_at")
    if not published:
        raise Rejected("not_published")
    try:
        published_time = datetime.fromisoformat(published.replace("Z", "+00:00"))
        if published_time.tzinfo is None or published_time > now:
            raise Rejected("not_yet_published")
    except (ValueError, TypeError):
        raise Rejected("not_yet_published") from None
    tags = product.get("tags") or []
    corpus = clean(" ".join(str(value) for value in (
        product.get("title"), product.get("handle"), product.get("body_html", product.get("description")),
        tags, variant.get("title"),
    )), limit=100000).casefold()
    for keyword in DEFAULT_EXCLUSIONS + config.get("excluded_keywords", []):
        keyword = keyword.casefold()
        # English words need boundaries: a 'used for...' description is conservatively excluded,
        # but words such as 'unused' and 'focused' should not match 'used'.
        matches = re.search(r"\b" + re.escape(keyword) + r"\b", corpus) if keyword.isascii() and keyword.isalpha() else keyword in corpus
        if keyword and matches:
            raise Rejected("excluded_keyword")
    category = product.get("product_type", product.get("type", ""))
    categories = config.get("categories", [])
    classified = product_categories(product, store)
    if categories and not any(c.casefold().replace("_", " ") in classified or
                              c.casefold() in str(category).casefold() for c in categories):
        raise Rejected("excluded_category")
    if sale < Decimal(str(config.get("min_price_jpy", 0))):
        raise Rejected("below_price_limit")
    maximum = config.get("max_price_jpy")
    if maximum is not None and sale > Decimal(str(maximum)):
        raise Rejected("above_price_limit")
    base = store["base_url"].rstrip("/")
    handle = quote(str(product["handle"]), safe="")
    return Deal(
        store_id=store["id"], store=store["name"], product_id=str(product["id"]),
        variant_id=str(variant["id"]), name=clean(product["title"]),
        variant=clean(variant.get("title") or "Default variant"), sku=clean(variant.get("sku"), 100),
        category=clean(category), reference_price=reference, sale_price=sale,
        reference_basis=store["reference_basis"], url=f"{base}/products/{handle}?variant={variant['id']}",
        verified_at=now.isoformat(timespec="seconds"),
        evidence_quality=2 if store["reference_basis"] == "manufacturer_suggested_price" else 1,
    )


def eligible(deal: Deal, history: dict, now: datetime, config: dict) -> bool:
    entry = history.get("sent", {}).get(deal.key)
    if not entry:
        return True
    sent_at = datetime.fromisoformat(entry["sent_at"])
    if now - sent_at >= timedelta(days=config.get("dedup_days", 7)):
        return True
    previous = yen(entry["sale_price"])
    drop = previous - deal.sale_price
    return (drop >= Decimal(str(config.get("meaningful_drop_jpy", 100))) and
            drop * 100 >= previous * Decimal(str(config.get("meaningful_drop_percent", 5))))


def rank(deals: list[Deal]) -> list[Deal]:
    return sorted(deals, key=lambda d: (-d.evidence_quality, -d.discount_percent, -d.savings, d.key))
