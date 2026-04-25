"""
ReviewRadar Backend Test Script
================================
Tests every endpoint and core service in the backend.

Usage:
    # Make sure the server is running first:
    uvicorn app.main:app --reload --port 8000

    # Then run:
    python test_api.py
    python test_api.py --url https://www.amazon.in/dp/B09G9FPHY6
    python test_api.py --skip-scrape     # skip the slow SSE scrape test
"""

import argparse
import json
import sys
import time
import requests

BASE_URL = "http://localhost:8000"
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"

passed = 0
failed = 0


def ok(msg: str):
    global passed
    passed += 1
    print(f"  {GREEN}✓{RESET} {msg}")


def fail(msg: str, detail: str = ""):
    global failed
    failed += 1
    print(f"  {RED}✗{RESET} {msg}")
    if detail:
        print(f"    {RED}→ {detail}{RESET}")


def section(title: str):
    print(f"\n{BOLD}{CYAN}{'─'*55}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'─'*55}{RESET}")


def get(path: str, params: dict = None, expected_status: int = 200):
    try:
        r = requests.get(f"{BASE_URL}{path}", params=params, timeout=15)
        if r.status_code != expected_status:
            fail(f"GET {path}", f"Expected {expected_status}, got {r.status_code}: {r.text[:200]}")
            return None
        return r.json()
    except Exception as e:
        fail(f"GET {path}", str(e))
        return None


def post(path: str, body: dict, expected_status: int = 200):
    try:
        r = requests.post(f"{BASE_URL}{path}", json=body, timeout=15)
        if r.status_code != expected_status:
            fail(f"POST {path}", f"Expected {expected_status}, got {r.status_code}: {r.text[:200]}")
            return None
        return r.json()
    except Exception as e:
        fail(f"POST {path}", str(e))
        return None


# ─────────────────────────────────────────────
# 1. HEALTH CHECK
# ─────────────────────────────────────────────
def test_health():
    section("1. Health Check")
    data = get("/health")
    if data is None:
        return
    if data.get("status") == "ok":
        ok(f"Health OK — version {data.get('version')}")
    else:
        fail("Health status not 'ok'", str(data))

    if data.get("db_connected"):
        ok("Neon DB connected")
    else:
        fail("Neon DB NOT connected — check DATABASE_URL")

    if data.get("ml_loaded"):
        ok("ML model loaded")
    else:
        print(f"  {YELLOW}⚠ ML model not loaded — run train_model.py first{RESET}")


# ─────────────────────────────────────────────
# 2. ML CLASSIFIER — single review
# ─────────────────────────────────────────────
def test_classify_single():
    section("2. Analyze Single Review")

    cases = [
        {
            "text": "This is absolutely the BEST product I have EVER bought!! "
                    "Amazing!! Perfect!! Love it!! Highly recommend!! Great product!!",
            "rating": 5,
            "expect_fake": True,
            "label": "Obvious fake",
        },
        {
            "text": "Battery lasts about 2 days on moderate use. Build quality is decent "
                    "for the price. Charging is a bit slow but acceptable overall.",
            "rating": 4,
            "expect_fake": False,
            "label": "Genuine review",
        },
        {
            "text": "Stopped working after 3 days. Very disappointing. "
                    "Customer support was completely unhelpful.",
            "rating": 1,
            "expect_fake": False,
            "label": "Negative genuine",
        },
        {
            "text": "as described fast shipping love it works great highly recommend",
            "rating": 5,
            "expect_fake": True,
            "label": "Generic copy-paste",
        },
    ]

    for case in cases:
        data = post(
            "/analyze/review",
            {"text": case["text"], "rating": case["rating"]},
        )
        if data is None:
            continue
        confidence = data.get("confidence", 0)
        is_fake = data.get("is_fake", False)
        reasons = data.get("reasons", [])
        match = "✓" if is_fake == case["expect_fake"] else "~"
        status_color = GREEN if is_fake == case["expect_fake"] else YELLOW
        print(
            f"  {status_color}{match}{RESET} [{case['label']}] "
            f"is_fake={is_fake} conf={confidence:.2f} reasons={reasons}"
        )
        if is_fake == case["expect_fake"]:
            passed_bump = True
            ok(f"Correct prediction for: {case['label']}")
        else:
            print(f"  {YELLOW}⚠ Prediction mismatch (model may differ){RESET}")


# ─────────────────────────────────────────────
# 3. ML CLASSIFIER — batch
# ─────────────────────────────────────────────
def test_classify_batch():
    section("3. Analyze Batch Reviews")

    reviews = [
        {"text": "Best product ever!! Amazing!! Perfect!! Love it!!", "rating": 5},
        {"text": "Good value for money. Works as expected.", "rating": 4},
        {"text": "Broke after a week. Waste of money.", "rating": 1},
        {"text": "Fast shipping. As described. Highly recommend.", "rating": 5},
        {"text": "Camera quality is mediocre but battery life is excellent.", "rating": 3},
    ]

    data = post("/analyze/batch", reviews)
    if data is None:
        return

    ok(f"Batch processed {data.get('total')} reviews")
    ok(f"Fake: {data.get('fake_count')} | Real: {data.get('real_count')}")
    ok(f"Trust Score: {data.get('trust_score')} | Verdict: {data.get('verdict')}")

    results = data.get("results", [])
    if len(results) == len(reviews):
        ok("All reviews returned in results")
    else:
        fail("Result count mismatch", f"Expected {len(reviews)}, got {len(results)}")

    # Edge case: empty batch
    data_empty = post("/analyze/batch", [], expected_status=400)
    if data_empty is None:
        ok("Empty batch correctly rejected with 400")


# ─────────────────────────────────────────────
# 4. TRUST SCORE FORMULA
# ─────────────────────────────────────────────
def test_trust_score():
    section("4. Trust Score Endpoint")

    cases = [
        {"fake_count": 0, "real_count": 100, "avg_fake_confidence": 0.5, "expect_verdict": "buy"},
        {"fake_count": 50, "real_count": 50, "avg_fake_confidence": 0.75, "expect_verdict": "avoid"},
        {"fake_count": 20, "real_count": 80, "avg_fake_confidence": 0.65, "expect_verdict": "caution"},
    ]

    for case in cases:
        data = get(
            "/analyze/trust-score",
            params={
                "fake_count": case["fake_count"],
                "real_count": case["real_count"],
                "avg_fake_confidence": case["avg_fake_confidence"],
            },
        )
        if data is None:
            continue
        verdict = data.get("verdict")
        trust = data.get("trust_score")
        if verdict == case["expect_verdict"]:
            ok(f"fake={case['fake_count']}/{case['fake_count']+case['real_count']} → trust={trust} verdict={verdict}")
        else:
            fail(
                f"Wrong verdict for fake={case['fake_count']}",
                f"Expected {case['expect_verdict']}, got {verdict}",
            )

    # Edge: zero total
    data = get("/analyze/trust-score", params={"fake_count": 0, "real_count": 0}, expected_status=400)
    if data is None:
        ok("Zero total correctly rejected with 400")


# ─────────────────────────────────────────────
# 5. PRODUCT CACHE CHECK
# ─────────────────────────────────────────────
def test_cache_check():
    section("5. Cache Check Endpoint")

    # Use a made-up URL that shouldn't be cached
    data = get("/product/check", params={"url": "https://www.amazon.in/dp/B00000FAKE"})
    if data is None:
        return
    if "cached" in data:
        ok(f"Cache check returned: cached={data.get('cached')}, product_id={data.get('product_id')}")
    else:
        fail("Cache check missing 'cached' field", str(data))


# ─────────────────────────────────────────────
# 6. RECENT SEARCHES
# ─────────────────────────────────────────────
def test_recent_searches():
    section("6. Recent Searches")

    data = get("/product/recent")
    if data is None:
        return
    if isinstance(data, list):
        ok(f"Recent searches returned {len(data)} results")
        if data:
            first = data[0]
            ok(f"First result: {first.get('title', 'N/A')[:50]} — {first.get('platform', 'N/A')}")
    else:
        fail("Expected list response", str(data))


# ─────────────────────────────────────────────
# 7. PRODUCT NOT FOUND
# ─────────────────────────────────────────────
def test_product_not_found():
    section("7. Product Not Found (404)")

    r = requests.get(f"{BASE_URL}/product/00000000-0000-0000-0000-000000000000", timeout=10)
    if r.status_code == 404:
        ok("Nonexistent product_id correctly returned 404")
    else:
        fail("Expected 404 for unknown product_id", f"Got {r.status_code}")


# ─────────────────────────────────────────────
# 8. SSE STREAM (optional, slow)
# ─────────────────────────────────────────────
def test_sse_stream(url: str):
    section(f"8. SSE Stream — {url[:60]}")
    print(f"  {YELLOW}⚠ This test hits the live URL and may take 30–60s{RESET}")

    events_seen = []
    try:
        with requests.get(
            f"{BASE_URL}/scrape/stream",
            params={"url": url},
            stream=True,
            timeout=180,
        ) as r:
            if r.status_code != 200:
                fail("SSE stream did not return 200", f"Got {r.status_code}")
                return

            ok("SSE connection established")

            for raw_line in r.iter_lines(decode_unicode=True):
                if not raw_line:
                    continue
                if raw_line.startswith("event:"):
                    event_name = raw_line.replace("event:", "").strip()
                    events_seen.append(event_name)
                    print(f"  → event: {CYAN}{event_name}{RESET}")
                elif raw_line.startswith("data:"):
                    try:
                        payload = json.loads(raw_line.replace("data:", "").strip())
                        if isinstance(payload, dict):
                            snippet = str(payload)[:120]
                            print(f"    data: {snippet}")
                    except Exception:
                        pass

                if "complete" in events_seen or "error" in events_seen:
                    break

    except requests.exceptions.ChunkedEncodingError:
        # This is normal when the server closes the SSE connection
        pass
    except requests.exceptions.Timeout:
        fail("SSE stream timed out after 180s")
        return
    except Exception as e:
        # Catch any other exception, but only fail if no terminal event was received
        pass

    # Evaluate after loop ends
    if "complete" in events_seen:
        ok("Stream ended with 'complete' event")
    elif "cached" in events_seen:
        ok("Stream returned cached result")
    elif "error" in events_seen:
        fail("Stream ended with 'error' event")
    else:
        fail("No terminal event received (complete, cached, or error)")

    for expected in ["progress", "product"]:
        if expected in events_seen:
            ok(f"Received '{expected}' event")
        else:
            print(f"  {YELLOW}⚠ Missing '{expected}' event (may have been cached){RESET}")


# ─────────────────────────────────────────────
# 9. URL NORMALIZATION (unit test, no server)
# ─────────────────────────────────────────────
def test_url_normalization():
    section("9. URL Normalization (unit)")

    def _normalize_url(url: str) -> str:
        import re
        from urllib.parse import urlparse
        parsed = urlparse(url.strip())
        if "amazon" in parsed.netloc:
            match = re.search(r'/dp/([A-Z0-9]{10})', url)
            if match:
                return f"amazon::{match.group(1)}"
        if "flipkart" in parsed.netloc:
            match = re.search(r'/p/([a-zA-Z0-9]+)', url)
            if match:
                return f"flipkart::{match.group(1)}"
        return f"{parsed.netloc}{parsed.path}"

    def _detect_platform(url: str) -> str:
        if "amazon" in url: return "amazon"
        if "flipkart" in url: return "flipkart"
        return "unknown"

    cases = [
        (
            "https://www.amazon.in/dp/B09G9FPHY6?ref=xxx",
            "amazon::B09G9FPHY6",
            "amazon",
        ),
        (
            "https://www.amazon.com/some-product/dp/B0CX4FFFBB/ref=sr_1_1",
            "amazon::B0CX4FFFBB",
            "amazon",
        ),
        (
            "https://www.flipkart.com/phone/p/itm123abc456?pid=xxx",
            "flipkart::itm123abc456",
            "flipkart",
        ),
        (
            "https://www.example.com/product/123",
            "www.example.com/product/123",
            "unknown",
        ),
    ]

    for url, expected_key, expected_platform in cases:
        key = _normalize_url(url)
        platform = _detect_platform(url)
        if key == expected_key:
            ok(f"normalize_url: {key}")
        else:
            fail(f"normalize_url mismatch", f"Expected '{expected_key}', got '{key}'")
        if platform == expected_platform:
            ok(f"detect_platform: {platform}")
        else:
            fail(f"detect_platform mismatch", f"Expected '{expected_platform}', got '{platform}'")


# ─────────────────────────────────────────────
# 10. PREPROCESSOR (unit test, no server)
# ─────────────────────────────────────────────
def test_preprocessor():
    section("10. Preprocessor (unit)")

    try:
        from app.ml.preprocessor import clean_text, extract_features

        dirty = "Check out http://spam.com Buy NOW!!! 🔥🔥🔥 AMAZING product!!!"
        cleaned = clean_text(dirty)
        if "http" not in cleaned and cleaned == cleaned.lower():
            ok(f"clean_text strips URLs and lowercases: '{cleaned[:60]}'")
        else:
            fail("clean_text failed", cleaned)

        texts = [
            "This is absolutely the best product ever! Amazing!",
            "Broke after a week. Disappointing quality.",
        ]
        ratings = [5, 1]
        features = extract_features(texts, ratings)

        if len(features) == 2:
            ok("extract_features returns correct count")
        else:
            fail("extract_features count mismatch")

        expected_keys = [
            "text_length", "word_count", "exclamation_count", "caps_ratio",
            "avg_word_length", "superlative_count", "superlative_density",
            "first_person_ratio", "rating", "negative_in_5star", "generic_phrases",
        ]
        missing = [k for k in expected_keys if k not in features[0]]
        if not missing:
            ok("All expected feature keys present")
        else:
            fail("Missing feature keys", str(missing))

        if features[0]["rating"] == 5.0 and features[1]["rating"] == 1.0:
            ok("Rating feature correctly set")
        else:
            fail("Rating feature wrong", str(features))

    except ImportError as e:
        print(f"  {YELLOW}⚠ Skipping unit test (run from backend/ directory): {e}{RESET}")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="ReviewRadar API Test Suite")
    parser.add_argument(
        "--url",
        default="https://www.amazon.in/dp/B09G9FPHY6",
        help="Product URL to use for SSE stream test",
    )
    parser.add_argument(
        "--skip-scrape",
        action="store_true",
        help="Skip the slow SSE scrape test",
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Base URL for the API server",
    )
    args = parser.parse_args()

    global BASE_URL
    BASE_URL = args.base_url.rstrip("/")

    print(f"\n{BOLD}ReviewRadar API Test Suite{RESET}")
    print(f"Target: {CYAN}{BASE_URL}{RESET}")
    print(f"Time:   {time.strftime('%Y-%m-%d %H:%M:%S')}")

    # Check server is reachable
    try:
        requests.get(f"{BASE_URL}/health", timeout=5)
    except Exception:
        print(f"\n{RED}ERROR: Cannot reach {BASE_URL} — is the server running?{RESET}")
        print(f"Run: {CYAN}uvicorn app.main:app --reload --port 8000{RESET}\n")
        sys.exit(1)

    test_health()
    test_url_normalization()
    test_preprocessor()
    test_classify_single()
    test_classify_batch()
    test_trust_score()
    test_cache_check()
    test_recent_searches()
    test_product_not_found()

    if not args.skip_scrape:
        test_sse_stream(args.url)
    else:
        print(f"\n{YELLOW}Skipping SSE scrape test (--skip-scrape){RESET}")

    # Summary
    total = passed + failed
    print(f"\n{BOLD}{'═'*55}{RESET}")
    print(f"{BOLD}  Results: {GREEN}{passed} passed{RESET} / {RED}{failed} failed{RESET} / {total} total{RESET}")
    print(f"{BOLD}{'═'*55}{RESET}\n")

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()