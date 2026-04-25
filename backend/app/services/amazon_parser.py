"""
Amazon product page parser.
Supports both structured JSON (ScraperAPI Product API) and raw HTML fallback.
"""

from bs4 import BeautifulSoup
import re
from typing import Tuple


def parse_amazon_structured(data: dict, url: str) -> Tuple[dict, list[dict]]:
    """
    Parse structured JSON response from ScraperAPI Amazon Product API.
    
    Args:
        data: JSON response dict from /structured/amazon/product
        url: Original product URL
        
    Returns:
        Tuple of (product_info dict, reviews list)
    """
    # ===== PRODUCT INFO =====
    product_info = {
        "platform": "amazon",
        "url": url,
        "title": data.get("name", ""),
        "price": data.get("pricing", ""),
        "rating": data.get("average_rating"),
        "image_url": "",
    }
    
    # Use high-res image if available, otherwise first regular image
    high_res = data.get("high_res_images", [])
    regular = data.get("images", [])
    if high_res:
        product_info["image_url"] = high_res[0]
    elif regular:
        product_info["image_url"] = regular[0]
    
    # ===== REVIEWS =====
    reviews = []
    raw_reviews = data.get("reviews", [])
    
    for rev in raw_reviews:
        # Clean the title — ScraperAPI prefixes with "X.0 out of 5 stars\n...\n    Actual Title"
        raw_title = rev.get("title", "")
        cleaned_title = _clean_review_title(raw_title)
        
        # Clean the review body — remove trailing "Read more" artifacts
        raw_body = rev.get("review", "")
        cleaned_body = _clean_review_body(raw_body)
        
        review = {
            "reviewer_name": _clean_username(rev.get("username", "Anonymous")),
            "rating": rev.get("stars", 3),
            "title": cleaned_title,
            "body": cleaned_body,
            "review_date": rev.get("date", ""),
            "verified": rev.get("verified_purchase", False),
        }
        
        # Only include reviews that have body text
        if review["body"]:
            reviews.append(review)
    
    return product_info, reviews


def _clean_review_title(title: str) -> str:
    """
    Clean review title from ScraperAPI structured response.
    Removes the "X.0 out of 5 stars" prefix and whitespace artifacts.
    """
    # Remove "X.0 out of 5 stars" prefix
    cleaned = re.sub(r'^\d+\.\d+\s+out of \d+\s+stars\s*', '', title)
    # Remove excessive whitespace/newlines
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


def _clean_review_body(body: str) -> str:
    """
    Clean review body text from ScraperAPI structured response.
    Removes trailing "Read more" and whitespace artifacts.
    """
    # Remove trailing "Read more" with surrounding whitespace
    cleaned = re.sub(r'\s*Read more\s*$', '', body, flags=re.IGNORECASE)
    # Remove excessive whitespace/newlines
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


def _clean_username(username: str) -> str:
    """
    Clean username — ScraperAPI sometimes duplicates the name.
    E.g. "Vishal Suresh RangariVishal Suresh Rangari" -> "Vishal Suresh Rangari"
    """
    if not username:
        return "Anonymous"
    half = len(username) // 2
    if half > 0 and username[:half] == username[half:]:
        return username[:half]
    return username


def parse_amazon(html: str, url: str) -> Tuple[dict, list[dict]]:
    """
    Parse Amazon product page HTML to extract product info and reviews.
    (Fallback method — used when structured API is unavailable)
    
    Args:
        html: Raw HTML content from Playwright
        url: Original product URL
        
    Returns:
        Tuple of (product_info dict, reviews list)
    """
    soup = BeautifulSoup(html, "lxml")
    
    # ===== PRODUCT INFO =====
    product_info = {
        "platform": "amazon",
        "url": url,
        "title": "",
        "price": "",
        "rating": None,
        "image_url": ""
    }
    
    # Title
    try:
        title_elem = soup.find(id="productTitle")
        if title_elem:
            product_info["title"] = title_elem.get_text(strip=True)
    except:
        pass
    
    # Price
    try:
        price_elem = soup.select_one(".a-price .a-offscreen")
        if price_elem:
            product_info["price"] = price_elem.get_text(strip=True)
    except:
        pass
    
    # Rating
    try:
        rating_elem = soup.select_one("[data-hook='rating-out-of-text']")
        if not rating_elem:
            rating_elem = soup.select_one(".a-icon-alt")
        
        if rating_elem:
            rating_text = rating_elem.get_text(strip=True)
            match = re.search(r'([\d.]+)', rating_text)
            if match:
                product_info["rating"] = float(match.group(1))
    except:
        pass
    
    # Image
    try:
        img_elem = soup.find(id="landingImage")
        if img_elem:
            # Try data-old-hires first (higher quality), fallback to src
            product_info["image_url"] = img_elem.get("data-old-hires") or img_elem.get("src", "")
    except:
        pass
    
    # ===== REVIEWS =====
    reviews = []
    
    try:
        review_elements = soup.select("[data-hook='review']")
        
        for review_elem in review_elements:
            review = {
                "reviewer_name": "",
                "rating": 3,
                "title": "",
                "body": "",
                "review_date": "",
                "verified": False
            }
            
            # Reviewer name
            try:
                name_elem = review_elem.select_one("[data-hook='genome-widget'] a")
                if not name_elem:
                    name_elem = review_elem.select_one(".a-profile-name")
                if name_elem:
                    review["reviewer_name"] = name_elem.get_text(strip=True)
            except:
                pass
            
            # Rating
            try:
                rating_elem = review_elem.select_one("[data-hook='review-star-rating']")
                if rating_elem:
                    rating_text = rating_elem.get_text(strip=True)
                    match = re.search(r'([\d.]+)', rating_text)
                    if match:
                        review["rating"] = int(float(match.group(1)))
            except:
                pass
            
            # Title
            try:
                title_elem = review_elem.select_one("[data-hook='review-title']")
                if title_elem:
                    # Remove "Reviewed in India" type prefix
                    title_text = title_elem.get_text(strip=True)
                    review["title"] = title_text
            except:
                pass
            
            # Body
            try:
                body_elem = review_elem.select_one("[data-hook='review-body'] span")
                if body_elem:
                    review["body"] = body_elem.get_text(strip=True)
            except:
                pass
            
            # Date
            try:
                date_elem = review_elem.select_one("[data-hook='review-date']")
                if date_elem:
                    review["review_date"] = date_elem.get_text(strip=True)
            except:
                pass
            
            # Verified purchase
            try:
                verified_elem = review_elem.select_one("[data-hook='avp-badge']")
                review["verified"] = verified_elem is not None
            except:
                pass
            
            # Only add if we have body text
            if review["body"]:
                reviews.append(review)
    
    except Exception as e:
        print(f"Error parsing Amazon reviews: {e}")
    
    return product_info, reviews