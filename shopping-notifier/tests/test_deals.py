import sys
import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from deals import Rejected, eligible, rank, validate_variant, product_categories

NOW = datetime(2026, 10, 3, 7, tzinfo=timezone(timedelta(hours=9)))
STORE = {"id": "shop", "name": "Shop", "base_url": "https://shop.example",
         "reference_basis": "manufacturer_suggested_price", "category": "clothing"}
CONFIG = {"min_price_jpy": 0, "max_price_jpy": None, "categories": [],
          "excluded_keywords": ["used", "coupon", "subscription"],
          "dedup_days": 7, "meaningful_drop_percent": 5, "meaningful_drop_jpy": 100}


def product(**kwargs):
    return {"id": 11, "handle": "coat", "title": "Coat", "product_type": "Coats",
            "tags": [], "body_html": "New jacket", "published_at": NOW.isoformat(), **kwargs}


def variant(**kwargs):
    return {"id": 22, "title": "Blue / M", "sku": "COAT-BM", "price": "5000",
            "compare_at_price": "10000", "available": True, "requires_shipping": True,
            "quantity_rule": {"min": 1, "increment": 1, "max": None}, **kwargs}


def deal(**kwargs):
    return validate_variant(product(), variant(**kwargs), STORE, CONFIG, NOW)


class DealsTests(unittest.TestCase):
    def test_docking_clothing_is_not_computer_accessory(self):
        selected = dict(CONFIG, categories=["electronics", "computer accessories", "appliances", "shoes"])
        for title in ["ドッキングロングワンピース", "ドッキングヘンリートップス", "docking dress", "秋冬のマストハブ！ショルダーバッグ"]:
            with self.assertRaisesRegex(Rejected, "excluded_category"):
                validate_variant(product(title=title), variant(), STORE, selected, NOW)
        self.assertIn("computer accessories", product_categories(product(title="USB ドッキングステーション"), STORE))

    def test_footwear_filter_excludes_clothing_and_preserves_shoe_variants(self):
        selected = dict(CONFIG, categories=["shoes"])
        self.assertIn("shoes", product_categories(product(title="Sneaker sandal", product_type="Footwear"), STORE))
        footwear = validate_variant(product(title="Sneaker sandal", product_type="Footwear"), variant(title="BLACK / 26cm"), STORE, selected, NOW)
        self.assertEqual(footwear.variant, "BLACK / 26cm")
        with self.assertRaisesRegex(Rejected, "excluded_category"):
            validate_variant(product(), variant(), STORE, selected, NOW)

    def test_calculation_uses_exact_prices_and_keeps_variant_identity(self):
        d = deal(price="4999", compare_at_price="10000")
        self.assertEqual(d.discount_percent, Decimal("50.01"))
        self.assertEqual(d.savings, Decimal("5001"))
        self.assertEqual(d.variant, "Blue / M")
        self.assertEqual(d.url, "https://shop.example/products/coat?variant=22")

    def test_threshold_before_rounding(self):
        self.assertEqual(deal().discount_percent, 50)
        with self.assertRaises(Rejected):
            deal(price="5001", compare_at_price="10001")  # 49.995%, rounds to 50.00

    def test_missing_zero_negative_nonfinite_or_ambiguous_prices_rejected(self):
        for value in [None, "", "0", "-1", "NaN", "Infinity", "10000-12000", True, "9999.5"]:
            with self.subTest(value=value), self.assertRaises(Rejected):
                deal(compare_at_price=value)
        for value in [None, 0, -1, "NaN", "Infinity", True]:
            with self.subTest(value=value), self.assertRaises(Rejected):
                deal(price=value)

    def test_unavailable_and_nonphysical_are_rejected(self):
        for kwargs in [{"available": False}, {"available": None}, {"requires_shipping": False},
                       {"requires_selling_plan": True}, {"quantity_rule": {"min": 2, "increment": 1}}]:
            with self.subTest(kwargs=kwargs), self.assertRaises(Rejected):
                deal(**kwargs)

    def test_missing_variant_and_condition_restrictions(self):
        with self.assertRaises(Rejected):
            deal(id=None)
        for p in [product(title="Used coat"), product(tags=["coupon"]), product(body_html="Subscription only")]:
            with self.assertRaises(Rejected):
                validate_variant(p, variant(), STORE, CONFIG, NOW)

    def test_categories_and_price_limits(self):
        for cfg in [{**CONFIG, "categories": ["electronics"]}, {**CONFIG, "min_price_jpy": 5001},
                    {**CONFIG, "max_price_jpy": 4999}]:
            with self.assertRaises(Rejected):
                validate_variant(product(), variant(), STORE, cfg, NOW)
        d = validate_variant(product(), variant(), STORE, {**CONFIG, "categories": ["coats"]}, NOW)
        self.assertEqual(d.sale_price, 5000)

    def test_category_filter_does_not_accept_every_item_in_a_mixed_store(self):
        mixed_store = {**STORE, "id": "anker", "category": "electronics appliances outdoor computer accessories"}
        cfg = {**CONFIG, "categories": ["outdoor"]}
        with self.assertRaises(Rejected):
            validate_variant(product(title="USB computer mouse", product_type="Anker"), variant(), mixed_store, cfg, NOW)
        power = validate_variant(product(title="Anker Solix Portable Power Station", product_type="Anker"), variant(), mixed_store, cfg, NOW)
        self.assertEqual(power.sale_price, 5000)

    def test_future_published_products_rejected(self):
        with self.assertRaises(Rejected):
            validate_variant(product(published_at=(NOW + timedelta(days=1)).isoformat()), variant(), STORE, CONFIG, NOW)

    def test_seven_day_dedup_and_meaningful_drop_boundaries(self):
        d = deal()
        state = {"sent": {d.key: {"sent_at": (NOW - timedelta(days=6)).isoformat(), "sale_price": "5000"}}}
        self.assertFalse(eligible(d, state, NOW, CONFIG))
        self.assertFalse(eligible(deal(price="4800"), state, NOW, CONFIG))
        self.assertTrue(eligible(deal(price="4750"), state, NOW, CONFIG))
        state["sent"][d.key]["sent_at"] = (NOW - timedelta(days=7)).isoformat()
        self.assertTrue(eligible(d, state, NOW, CONFIG))
        self.assertTrue(eligible(deal(id=23), state, NOW, CONFIG))

    def test_small_yen_drop_does_not_trigger_even_if_percent_is_large(self):
        d = deal(price="1000", compare_at_price="2000")
        state = {"sent": {d.key: {"sent_at": NOW.isoformat(), "sale_price": "1050"}}}
        self.assertFalse(eligible(d, state, NOW, CONFIG))

    def test_evidence_quality_ranks_before_discount_and_savings(self):
        high = deal()
        low = validate_variant(product(), variant(id=23, price="1000"),
                               {**STORE, "reference_basis": "retailer_previous_price"}, CONFIG, NOW)
        self.assertEqual(rank([low, high])[0], high)


if __name__ == "__main__":
    unittest.main()
