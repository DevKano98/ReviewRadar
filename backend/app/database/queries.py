"""
Database query functions using psycopg2 with RealDictCursor.
All functions use %s placeholders for SQL injection protection.
"""

import json
from datetime import datetime, timedelta
from typing import Optional
from app.database.db import get_connection
from app.config import settings


def get_cached_product(cache_key: str) -> Optional[dict]:
    """
    Retrieve cached product if it exists and is still fresh.
    
    Args:
        cache_key: Normalized product identifier
        
    Returns:
        Product dict if found and fresh, None otherwise
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM products WHERE cache_key = %s",
                (cache_key,)
            )
            row = cur.fetchone()
            
            if not row:
                return None
            
            # Check if cache is still fresh
            scraped_at = row.get("scraped_at")
            if scraped_at:
                cache_expiry = scraped_at + timedelta(hours=settings.CACHE_HOURS)
                if datetime.now(scraped_at.tzinfo) > cache_expiry:
                    return None
            
            return row


def save_product(product_data: dict) -> dict:
    """
    Insert new product into database.
    
    Args:
        product_data: Dict with keys: cache_key, url, platform, title, price,
                     image_url, rating, total_reviews, trust_score, fake_count,
                     real_count, verdict, gemini_summary
    
    Returns:
        The inserted product row as dict with generated id
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO products (
                    cache_key, url, platform, title, price, image_url,
                    rating, total_reviews, trust_score, fake_count,
                    real_count, verdict, gemini_summary
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                product_data.get("cache_key"),
                product_data.get("url"),
                product_data.get("platform"),
                product_data.get("title"),
                product_data.get("price"),
                product_data.get("image_url"),
                product_data.get("rating"),
                product_data.get("total_reviews"),
                product_data.get("trust_score"),
                product_data.get("fake_count"),
                product_data.get("real_count"),
                product_data.get("verdict"),
                json.dumps(product_data.get("gemini_summary", {}))
            ))
            new_row = cur.fetchone()
            conn.commit()
            return new_row


def save_reviews(reviews: list[dict], product_id: str) -> None:
    """
    Batch insert reviews for a product.
    
    Args:
        reviews: List of review dicts with keys: reviewer_name, rating, title,
                body, review_date, verified, is_fake, fake_confidence, fake_reasons
        product_id: UUID of the parent product
    """
    if not reviews:
        return
    
    with get_connection() as conn:
        with conn.cursor() as cur:
            # Prepare data tuples for batch insert
            review_tuples = [
                (
                    product_id,
                    r.get("reviewer_name", "Anonymous"),
                    r.get("rating", 3),
                    r.get("title", ""),
                    r.get("body", ""),
                    r.get("review_date", ""),
                    r.get("verified", False),
                    r.get("is_fake", False),
                    r.get("fake_confidence", 0.5),
                    r.get("fake_reasons", [])
                )
                for r in reviews
            ]
            
            cur.executemany("""
                INSERT INTO reviews (
                    product_id, reviewer_name, rating, title, body,
                    review_date, verified, is_fake, fake_confidence, fake_reasons
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, review_tuples)
            
            conn.commit()


def get_product_with_reviews(product_id: str) -> dict:
    """
    Fetch product and all its reviews.
    
    Args:
        product_id: UUID of the product
        
    Returns:
        Dict with product fields plus "reviews" key containing list of review dicts
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            # Fetch product
            cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            product = cur.fetchone()
            
            if not product:
                return {}
            
            # Fetch reviews
            cur.execute(
                "SELECT * FROM reviews WHERE product_id = %s ORDER BY created_at",
                (product_id,)
            )
            reviews = cur.fetchall()
            
            # Merge product and reviews
            result = dict(product)
            result["reviews"] = reviews
            
            return result


def update_product_analysis(
    product_id: str,
    trust_score: float,
    fake_count: int,
    real_count: int,
    verdict: str,
    gemini_summary: dict
) -> None:
    """
    Update product with ML analysis results.
    
    Args:
        product_id: UUID of the product
        trust_score: Computed trust score (0-100)
        fake_count: Number of fake reviews detected
        real_count: Number of real reviews
        verdict: "buy", "avoid", or "caution"
        gemini_summary: AI summary dict
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE products
                SET trust_score = %s,
                    fake_count = %s,
                    real_count = %s,
                    verdict = %s,
                    gemini_summary = %s
                WHERE id = %s
            """, (
                trust_score,
                fake_count,
                real_count,
                verdict,
                json.dumps(gemini_summary),
                product_id
            ))
            conn.commit()


def log_search(url: str, cache_key: str, product_id: str) -> None:
    """
    Log a user search for analytics.
    
    Args:
        url: Original URL searched
        cache_key: Normalized cache key
        product_id: UUID of the product found/created
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO searches (url, cache_key, product_id) VALUES (%s, %s, %s)",
                (url, cache_key, product_id)
            )
            conn.commit()


def get_recent_searches(limit: int = 8) -> list[dict]:
    """
    Fetch recent searches with product details.
    
    Args:
        limit: Maximum number of searches to return
        
    Returns:
        List of search dicts with joined product info
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    s.*,
                    p.title,
                    p.platform,
                    p.trust_score,
                    p.verdict,
                    p.image_url
                FROM searches s
                LEFT JOIN products p ON s.product_id = p.id
                ORDER BY s.created_at DESC
                LIMIT %s
            """, (limit,))
            
            return cur.fetchall()


def list_products(limit: int = 48) -> list[dict]:
    """
    Fetch analyzed products directly from the products table.

    Args:
        limit: Maximum number of products to return

    Returns:
        List of product dicts ordered by most recent scrape
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    id,
                    url,
                    platform,
                    title,
                    price,
                    image_url,
                    rating,
                    total_reviews,
                    trust_score,
                    fake_count,
                    real_count,
                    verdict,
                    gemini_summary,
                    scraped_at,
                    created_at
                FROM products
                ORDER BY scraped_at DESC NULLS LAST, created_at DESC
                LIMIT %s
                """,
                (limit,),
            )
            return cur.fetchall()
