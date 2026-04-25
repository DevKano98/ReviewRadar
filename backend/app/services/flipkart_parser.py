"""
Flipkart product page parser.
"""

from bs4 import BeautifulSoup
import re
from typing import Tuple


def parse_flipkart(html: str, url: str) -> Tuple[dict, list[dict]]:
    """
    Parse Flipkart product page HTML to extract product info and reviews.
    
    Args:
        html: Raw HTML content from Playwright
        url: Original product URL
        
    Returns:
        Tuple of (product_info dict, reviews list)
    """
    soup = BeautifulSoup(html, "lxml")
    
    # ===== PRODUCT INFO =====
    product_info = {
        "platform": "flipkart",
        "url": url,
        "title": "",
        "price": "",
        "rating": None,
        "image_url": ""
    }
    
    # Title
    try:
        title_elem = soup.select_one("span.B_NuCI") or soup.select_one("h1._35KyD6")
        if title_elem:
            product_info["title"] = title_elem.get_text(strip=True)
    except:
        pass
    
    # Price
    try:
        price_elem = soup.select_one("div._30jeq3")
        if price_elem:
            product_info["price"] = price_elem.get_text(strip=True)
    except:
        pass
    
    # Rating
    try:
        rating_elem = soup.select_one("div._3LWZlK")
        if rating_elem:
            rating_text = rating_elem.get_text(strip=True)
            match = re.search(r'([\d.]+)', rating_text)
            if match:
                product_info["rating"] = float(match.group(1))
    except:
        pass
    
    # Image
    try:
        img_elem = soup.select_one("img._396cs4") or soup.select_one("img._2r_T1I")
        if img_elem:
            product_info["image_url"] = img_elem.get("src", "")
    except:
        pass
    
    # ===== REVIEWS =====
    reviews = []
    
    try:
        # Flipkart has multiple possible selectors for reviews
        review_elements = soup.select("div._27M-vq") or soup.select("div.col.EPCmJX")
        
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
                name_elem = review_elem.select_one("p._2sc7ZR._2V5EHH") or review_elem.select_one("p._2sc7ZR")
                if name_elem:
                    review["reviewer_name"] = name_elem.get_text(strip=True)
            except:
                pass
            
            # Rating
            try:
                rating_elem = review_elem.select_one("div._3LWZlK")
                if rating_elem:
                    rating_text = rating_elem.get_text(strip=True)
                    match = re.search(r'(\d+)', rating_text)
                    if match:
                        review["rating"] = int(match.group(1))
            except:
                pass
            
            # Title
            try:
                title_elem = review_elem.select_one("p._2-N8zT")
                if title_elem:
                    review["title"] = title_elem.get_text(strip=True)
            except:
                pass
            
            # Body
            try:
                body_elem = review_elem.select_one("div.t-ZTKy") or review_elem.select_one("div._6K-7Co")
                if body_elem:
                    review["body"] = body_elem.get_text(strip=True)
            except:
                pass
            
            # Date
            try:
                # Date is usually in second span with _2sc7ZR class
                date_spans = review_elem.select("p._2sc7ZR")
                if len(date_spans) > 1:
                    review["review_date"] = date_spans[1].get_text(strip=True)
            except:
                pass
            
            # Verified purchase (Certified Buyer)
            try:
                certified_elem = review_elem.find(string=re.compile("Certified Buyer", re.IGNORECASE))
                review["verified"] = certified_elem is not None
            except:
                pass
            
            # Only add if we have body text
            if review["body"]:
                reviews.append(review)
    
    except Exception as e:
        print(f"Error parsing Flipkart reviews: {e}")
    
    # Note: Flipkart often loads reviews dynamically via JavaScript
    # If no reviews found, it might need a different scraping approach
    if not reviews:
        print("⚠ No reviews found in Flipkart HTML (may be loaded dynamically)")
    
    return product_info, reviews