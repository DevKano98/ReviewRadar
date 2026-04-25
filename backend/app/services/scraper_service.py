"""
Web scraping service using ScraperAPI.
Uses the Structured Amazon Product API for Amazon URLs (returns JSON directly).
Falls back to raw HTML scraping for Flipkart and other platforms.
Streams scraping progress via Server-Sent Events.
"""

import asyncio
import json
import logging
import httpx
from urllib.parse import quote
from app.services.amazon_parser import parse_amazon_structured, parse_amazon
from app.services.flipkart_parser import parse_flipkart
from app.services.url_utils import detect_platform, extract_amazon_asin, extract_amazon_tld
from app.config import settings


logger = logging.getLogger(__name__)

# Timeout for ScraperAPI requests (structured API is usually faster)
STRUCTURED_API_TIMEOUT = 90.0
RAW_API_TIMEOUT = 60.0


async def scrape_product_stream(url: str):
    """
    Scrape product page using ScraperAPI and stream progress via SSE events.
    
    For Amazon: uses ScraperAPI Structured Amazon Product API (JSON).
    For Flipkart: uses raw HTML scraping with render=true.
    
    AsyncGenerator that yields SSE event dicts:
        {"event": "progress", "data": json_string}
        {"event": "product", "data": json_string}
        {"event": "review", "data": json_string}
        {"event": "error", "data": json_string}
    
    Args:
        url: Product URL to scrape
        
    Yields:
        SSE event dicts
    """
    try:
        if not settings.SCRAPERAPI_KEY:
            yield error("ScraperAPI key not configured")
            return
        
        platform = detect_platform(url)
        
        if platform == "amazon":
            async for event in _scrape_amazon_structured(url):
                yield event
        elif platform == "flipkart":
            async for event in _scrape_raw_html(url, platform):
                yield event
        else:
            yield error("Unsupported platform. Please use Amazon or Flipkart URLs.")
            return
    
    except Exception as e:
        logger.error(f"Scraping error: {e}")
        yield error(str(e))


async def _scrape_amazon_structured(url: str):
    """
    Scrape Amazon product using the Structured Amazon Product API.
    Returns structured JSON with product data and reviews — no HTML parsing needed.
    """
    asin = extract_amazon_asin(url)
    if not asin:
        yield error("Could not extract ASIN from URL. Please use a valid Amazon product URL (e.g. /dp/B0XXXXXXXX).")
        return
    
    tld = extract_amazon_tld(url)
    
    yield progress("Connecting to ScraperAPI...", 1)
    yield progress(f"Fetching product data (ASIN: {asin}, market: amazon.{tld})...", 2)
    
    try:
        async with httpx.AsyncClient(timeout=STRUCTURED_API_TIMEOUT) as client:
            response = await client.get(
                "https://api.scraperapi.com/structured/amazon/product",
                params={
                    "api_key": settings.SCRAPERAPI_KEY,
                    "asin": asin,
                    "tld": tld,
                    "country_code": tld if len(tld) == 2 else "",
                },
            )
            response.raise_for_status()
            data = response.json()
    
    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        logger.error(f"ScraperAPI structured API HTTP {status}")
        
        if status == 404:
            # Product not found — try raw HTML fallback
            logger.info("Structured API returned 404, trying raw HTML fallback...")
            yield progress("Product not found via quick API, trying full page scrape...", 2)
            async for event in _scrape_raw_html(url, "amazon"):
                yield event
            return
        elif status == 403:
            yield error("ScraperAPI access denied. Check your API key or plan limits.")
        elif status == 429:
            yield error("ScraperAPI rate limit exceeded. Please try again in a minute.")
        else:
            yield error(f"ScraperAPI error (HTTP {status}). Please try again.")
        return
    
    except httpx.TimeoutException:
        logger.error("ScraperAPI structured API timed out")
        yield error("Request timed out. The product page took too long to load. Please try again.")
        return
    
    except httpx.RequestError as e:
        logger.error(f"ScraperAPI request error: {e}")
        yield error(f"Failed to connect to ScraperAPI: {str(e)}")
        return
    
    # Parse the structured JSON response
    yield progress("Parsing product data...", 3)
    
    product_info, reviews = parse_amazon_structured(data, url)
    
    # Stream product info
    yield {"event": "product", "data": json.dumps(product_info)}
    
    title_preview = product_info.get('title', 'Unknown')[:40]
    yield progress(f"Found: {title_preview}...", 3)
    yield progress("Extracting reviews...", 4)
    
    # Stream individual reviews
    for i, review in enumerate(reviews[:settings.MAX_REVIEWS]):
        yield {
            "event": "review",
            "data": json.dumps({
                "index": i,
                "reviewer_name": review.get("reviewer_name", "Anonymous"),
                "rating": review.get("rating", 3),
                "title": review.get("title", ""),
                "body": review.get("body", ""),
                "review_date": review.get("review_date", ""),
                "verified": review.get("verified", False)
            })
        }
        await asyncio.sleep(0.05)
    
    yield progress(f"Scraped {len(reviews)} reviews successfully", 5)


async def _scrape_raw_html(url: str, platform: str):
    """
    Scrape product page using raw HTML rendering (fallback for Flipkart, etc.).
    Uses ScraperAPI with render=true to get fully rendered HTML.
    """
    yield progress("Connecting to ScraperAPI...", 1)
    
    # Build ScraperAPI request URL
    encoded_url = quote(url, safe='')
    scraperapi_url = (
        f"https://api.scraperapi.com/"
        f"?api_key={settings.SCRAPERAPI_KEY}"
        f"&url={encoded_url}"
        f"&render=true"
    )
    
    yield progress("Fetching product page (rendering JavaScript)...", 2)
    
    try:
        async with httpx.AsyncClient(timeout=RAW_API_TIMEOUT) as client:
            response = await client.get(scraperapi_url)
            response.raise_for_status()
            html = response.text
    
    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        logger.error(f"ScraperAPI raw HTML HTTP {status}")
        if status == 404:
            yield error("Product page not found (404). The product may have been removed.")
        elif status == 403:
            yield error("ScraperAPI access denied. Check your API key or plan limits.")
        elif status == 429:
            yield error("ScraperAPI rate limit exceeded. Please try again in a minute.")
        else:
            yield error(f"ScraperAPI error (HTTP {status}). Please try again.")
        return
    
    except httpx.TimeoutException:
        logger.error("ScraperAPI raw HTML timed out")
        yield error("Request timed out. The product page took too long to load. Please try again.")
        return
    
    except httpx.RequestError as e:
        logger.error(f"ScraperAPI request error: {e}")
        yield error(f"Failed to fetch page: {str(e)}")
        return
    
    yield progress("Parsing product data...", 3)
    
    # Detect platform and parse
    if platform == "amazon":
        product_info, reviews = parse_amazon(html, url)
    elif platform == "flipkart":
        product_info, reviews = parse_flipkart(html, url)
    else:
        yield error("Unsupported platform.")
        return
    
    # Stream product info
    yield {"event": "product", "data": json.dumps(product_info)}
    
    title_preview = product_info.get('title', 'Unknown')[:40]
    yield progress(f"Found: {title_preview}...", 3)
    yield progress("Extracting reviews...", 4)
    
    # Stream individual reviews
    for i, review in enumerate(reviews[:settings.MAX_REVIEWS]):
        yield {
            "event": "review",
            "data": json.dumps({
                "index": i,
                "reviewer_name": review.get("reviewer_name", "Anonymous"),
                "rating": review.get("rating", 3),
                "title": review.get("title", ""),
                "body": review.get("body", ""),
                "review_date": review.get("review_date", ""),
                "verified": review.get("verified", False)
            })
        }
        await asyncio.sleep(0.05)
    
    yield progress(f"Scraped {len(reviews)} reviews successfully", 5)


def progress(msg: str, step: int) -> dict:
    """Create a progress SSE event."""
    return {
        "event": "progress",
        "data": json.dumps({
            "msg": msg,
            "step": step,
            "total": 6
        })
    }


def error(msg: str) -> dict:
    """Create an error SSE event."""
    return {
        "event": "error",
        "data": json.dumps({"msg": msg})
    }