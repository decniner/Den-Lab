import copy
import json
import sys
import unittest
from pathlib import Path
from urllib.error import HTTPError, URLError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from network import HttpClient, SourceError, robots_allowed
from sources import _shipping, scan_store, verify_product
from test_deals import CONFIG, NOW, STORE, product, variant

SOURCE = {**STORE, "reference_pattern": "List price", "tax_pattern": "Prices include tax",
          "policy_paths": ["/pages/shipping"], "japan_delivery_pattern": "Delivery within Japan",
          "shipping_rule": "unknown"}
SCAN_CONFIG = {**CONFIG, "max_pages_per_store": 1, "max_products_verified_per_store": 2}
POLICY = "Prices include tax. Delivery within Japan."


def js_product():
    p = product()
    p["variants"] = [variant(price=500000, compare_at_price=1000000)]
    return p


def html_page(p=None, **offer_changes):
    p = p or js_product()
    v = p["variants"][0]
    offer = {"@type": "Offer", "sku": v["sku"], "price": "5000", "priceCurrency": "JPY",
             "availability": "https://schema.org/InStock", "priceValidUntil": "2026-10-04",
             "url": f"https://shop.example/products/coat?variant={v['id']}", **offer_changes}
    return ('<h1>Coat</h1><p>List price 10,000; sale 5,000. Prices include tax.</p>'
            '<script>window.product=' + json.dumps(p) + ';</script>'
            '<script type="application/ld+json">' + json.dumps({"@type": "Product", "offers": [offer]}) + '</script>')


class SourcesTests(unittest.TestCase):
    def test_long_navigation_does_not_hide_product_price_evidence(self):
        p = js_product()
        navigation = '<h1>Navigation</h1>' + ('Menu ' * 1000)
        verify_product(p, p["variants"][0], navigation + html_page(), SOURCE, CONFIG, NOW, POLICY)
        with self.assertRaisesRegex(ValueError, "ambiguous_reference_basis"):
            verify_product(p, p["variants"][0], '<h1>Navigation List price</h1>' + html_page().replace("List price", "Cost"), SOURCE, CONFIG, NOW, POLICY)

    def test_incomplete_analytics_product_is_not_variant_price_evidence(self):
        p = js_product()
        analytics = {"id": p["id"], "handle": p["handle"],
                     "variants": [{"id": 22, "price": 500000, "sku": "COAT-BM"}]}
        page = html_page() + '<script>window.analytics=' + json.dumps(analytics) + ';</script>'
        self.assertEqual(verify_product(p, p["variants"][0], page, SOURCE, CONFIG, NOW, POLICY).sale_price, 5000)

    def test_product_page_and_variant_data_verify_exact_jpy_amounts(self):
        p = js_product()
        d = verify_product(p, p["variants"][0], html_page(), SOURCE, CONFIG, NOW, POLICY)
        self.assertEqual(d.sale_price, 5000)
        self.assertEqual(d.reference_price, 10000)
        self.assertEqual(d.shipping, "Unknown; confirm at checkout")

    def test_mismatched_variant_currency_price_stock_and_expiry_rejected(self):
        p = js_product()
        cases = [{"url": "https://shop.example/products/coat?variant=99", "sku": "OTHER"},
                 {"priceCurrency": "USD"}, {"price": "4999"},
                 {"availability": "https://schema.org/OutOfStock"},
                 {"priceValidUntil": "2026-10-02"}, {"priceValidUntil": "garbage"},
                 {"itemCondition": "https://schema.org/UsedCondition"}]
        for change in cases:
            with self.subTest(change=change), self.assertRaises(ValueError):
                verify_product(p, p["variants"][0], html_page(**change), SOURCE, CONFIG, NOW, POLICY)

    def test_html_reference_and_available_variant_must_match_fresh_product_json(self):
        p = js_product()
        for change in [{"compare_at_price": 1200000}, {"available": False}, {"title": "Red / L"}]:
            embedded = copy.deepcopy(p)
            embedded["variants"][0].update(change)
            with self.assertRaises(ValueError):
                verify_product(p, p["variants"][0], html_page(embedded), SOURCE, CONFIG, NOW, POLICY)

    def test_missing_reference_tax_and_japan_policy_are_rejected(self):
        p = js_product()
        for page, policy in [(html_page().replace("List price", "Cost"), POLICY),
                             (html_page().replace("Prices include tax", "Price"), "Delivery within Japan"),
                             (html_page(), "Prices include tax; no delivery evidence")]:
            with self.assertRaises(ValueError):
                verify_product(p, p["variants"][0], page, SOURCE, CONFIG, NOW, policy)

    def test_missing_structured_offers_is_a_source_verification_failure(self):
        p = js_product()
        page = '<h1>Coat</h1><p>List price 10,000. Prices include tax.</p><script>product=' + json.dumps(p) + ';</script>'
        with self.assertRaisesRegex(SourceError, "offer_evidence_missing"):
            verify_product(p, p["variants"][0], page, SOURCE, CONFIG, NOW, POLICY)

    def test_robots_wildcards_longest_rule_and_specific_agent(self):
        rules = "User-agent: *\nAllow: /\nDisallow: /policies/\nDisallow: /products/*-private\nAllow: /products/ok-private$\n"
        self.assertFalse(robots_allowed(rules, "https://shop.example/policies/shipping"))
        self.assertFalse(robots_allowed(rules, "https://shop.example/products/a-private"))
        self.assertTrue(robots_allowed(rules, "https://shop.example/products/ok-private"))
        self.assertTrue(robots_allowed(rules, "https://shop.example/products/a?variant=2"))
        self.assertFalse(robots_allowed("User-agent: DenLabShoppingNotifier\nDisallow: /\nUser-agent: *\nAllow: /", "https://shop.example/a"))

    def test_transient_get_retries_are_bounded_and_recover(self):
        calls = []

        class Response:
            headers = {"Content-Type": "text/plain; charset=utf-8"}
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self, *args): return b"OK"
            def geturl(self): return "https://shop.example/robots.txt"

        def opening(request, timeout):
            calls.append(timeout)
            if len(calls) < 3: raise URLError("offline")
            return Response()
        client = HttpClient(timeout=7, attempts=3, delay=0, opener=opening, sleep=lambda _: None)
        self.assertEqual(client.get("https://shop.example/robots.txt"), "OK")
        self.assertEqual(calls, [7, 7, 7])
        client = HttpClient(attempts=2, delay=0, opener=lambda *a, **k: (_ for _ in ()).throw(URLError("secret detail")), sleep=lambda _: None)
        with self.assertRaisesRegex(SourceError, "URLError") as caught:
            client.get("https://shop.example/robots.txt")
        self.assertNotIn("secret detail", str(caught.exception))

    def test_access_denial_is_not_retried_or_bypassed(self):
        calls = []
        def opening(request, timeout):
            calls.append(1)
            raise HTTPError(request.full_url, 403, "blocked", {}, None)
        with self.assertRaisesRegex(SourceError, "HTTP 403"):
            HttpClient(opener=opening, sleep=lambda _: None).get("https://shop.example/robots.txt")
        self.assertEqual(len(calls), 1)

    def test_source_deadline_bounds_retries_and_request_timeouts(self):
        current = [0.0]
        calls = []
        def opening(request, timeout):
            calls.append(timeout)
            current[0] += 2
            raise URLError("slow source")
        def sleep(seconds): current[0] += seconds
        client = HttpClient(timeout=15, attempts=3, delay=0, opener=opening,
                            sleep=sleep, clock=lambda: current[0], deadline=5)
        with self.assertRaisesRegex(SourceError, "time_budget"):
            client.get("https://shop.example/robots.txt")
        self.assertLessEqual(current[0], 5)
        self.assertEqual(calls, [5, 2])

    def test_slow_response_body_respects_total_request_deadline(self):
        current = [0.0]
        class Response:
            headers = {}
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def geturl(self): return "https://shop.example/robots.txt"
            def read1(self, size): current[0] += 2; return b"slow data"
        client = HttpClient(timeout=3, attempts=1, delay=0, opener=lambda *a, **k: Response(),
                            sleep=lambda _: None, clock=lambda: current[0], deadline=10)
        with self.assertRaisesRegex(SourceError, "TimeoutError"):
            client.get("https://shop.example/robots.txt")
        self.assertLessEqual(current[0], 4)

    def test_store_failure_and_page_limit_are_explicit(self):
        class Failed:
            def get(self, url): raise SourceError("HTTP 403")
        result = scan_store(SOURCE, SCAN_CONFIG, Failed(), NOW)
        self.assertEqual(result.status, "failed")
        self.assertIn("HTTP 403", result.errors[0])

        class Working:
            def get(self, url):
                if "products.json" in url:
                    return json.dumps({"products": [dict(product(), variants=[variant()])] * 250})
                if url.endswith(".js"): return json.dumps(js_product())
                if "/products/coat" in url: return html_page()
                return POLICY
        result = scan_store(SOURCE, SCAN_CONFIG, Working(), NOW)
        self.assertEqual(len(result.deals), 1)
        self.assertEqual(result.status, "partial")
        self.assertIn("catalog_page_limit", result.limits)

    def test_new_source_shipping_uses_standard_non_member_prices(self):
        text = "2,999円以下：300円（北海道・沖縄 400円） 3,000円～13,999円：600円（北海道・沖縄 800円） 14,000円以上：送料無料"
        self.assertEqual(_shipping({"shipping_rule": "keen"}, text, 13999), "JPY 600; Hokkaido/Okinawa JPY 800 (non-member)")
        self.assertEqual(_shipping({"shipping_rule": "keen"}, text, 14000), "JPY 0 (item >=JPY 14,000; non-member)")
        self.assertIn("JPY 300", _shipping({"shipping_rule": "keen"}, text, 2999))
        self.assertEqual(_shipping({"shipping_rule": "ecoflow"}, "送料： 無料", 5000), "JPY 0 (Japan; current published policy)")
        self.assertEqual(_shipping({"shipping_rule": "jackery"}, "全ての商品が送料無料", 5000), "JPY 0 (Japan; current published policy)")
        self.assertEqual(_shipping({"shipping_rule": "ecoflow"}, "送料未確認", 5000), "Unknown; confirm at checkout")

    def test_expanded_shipping_requires_fresh_rates_and_preserves_exceptions(self):
        toffy = "5,500円（税込）以上のお買い上げで送料無料。未満の場合、送料は全国一律550円（税込）"
        self.assertEqual(_shipping({"shipping_rule": "toffy"}, toffy, 5499), "JPY 550 (order <JPY 5,500)")
        self.assertEqual(_shipping({"shipping_rule": "toffy"}, toffy, 5500), "JPY 0 (item >=JPY 5,500)")
        self.assertEqual(_shipping({"shipping_rule": "toffy"}, toffy.replace("550円", "880円"), 5499), "Unknown; confirm at checkout")
        self.assertEqual(_shipping({"shipping_rule": "toffy"}, toffy.replace("5,500円", "15,500円"), 5500), "Unknown; confirm at checkout")
        phenix = "全国一律(沖縄、離島を除く) 490円 沖縄県 990円。1配送先につき ¥10,000(税込)以上お買い上げの場合は送料無料。送料個別商品の送料は対象となりません"
        fee = _shipping({"shipping_rule": "phenix"}, phenix, 9999)
        self.assertEqual(_shipping({"shipping_rule": "phenix"}, phenix.replace("10,000", "110,000"), 10000), "Unknown; confirm at checkout")
        self.assertIn("JPY 490", fee)
        self.assertIn("Okinawa JPY 990", fee)
        self.assertIn("individual", _shipping({"shipping_rule": "phenix"}, phenix, 10000))
        self.assertEqual(_shipping({"shipping_rule": "phenix"}, phenix.replace("490円", "600円"), 9000), "Unknown; confirm at checkout")

    def test_shaka_shipping_requires_live_explicit_free_shipping_policy(self):
        self.assertEqual(_shipping({"shipping_rule": "shaka"}, "全国一律：送料無料", 10450), "JPY 0 (Japan; current published policy)")
        self.assertEqual(_shipping({"shipping_rule": "shaka"}, "配送料はチェックアウト時に計算", 10450), "Unknown; confirm at checkout")

    def test_small_catalog_pages_continue_and_report_cap(self):
        calls = []
        class SmallPages:
            def get(self, url):
                calls.append(url)
                if "products.json" in url:
                    return json.dumps({"products": [dict(product(), variants=[variant()])] * 50})
                if url.endswith(".js"): return json.dumps(js_product())
                if "/products/coat" in url: return html_page()
                return POLICY
        result = scan_store(dict(SOURCE, catalog_page_size=50), dict(SCAN_CONFIG, max_pages_per_store=2), SmallPages(), NOW)
        self.assertEqual(result.products_scanned, 100)
        self.assertTrue(any("limit=50&page=2" in url for url in calls))
        self.assertIn("catalog_page_limit", result.limits)

    def test_malformed_feed_does_not_become_no_deals(self):
        class Bad:
            def get(self, url): return "{}" if "products.json" in url else POLICY
        result = scan_store(SOURCE, SCAN_CONFIG, Bad(), NOW)
        self.assertEqual(result.status, "failed")


if __name__ == "__main__": unittest.main()
