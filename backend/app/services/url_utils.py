"""
URL normalization and platform detection utilities.
"""

import re
from urllib.parse import urlparse


def normalize_url(url: str) -> str:
    """
    Normalize product URL to create a consistent cache key.
    
    Extracts product IDs from Amazon and Flipkart URLs:
    - Amazon: extracts ASIN from /dp/{ASIN} pattern
    - Flipkart: extracts product ID from /p/{ID} pattern
    
    Args:
        url: Raw product URL
        
    Returns:
        Normalized cache key in format "platform::id" or domain+path
    """
    parsed = urlparse(url.strip())
    
    if "amazon" in parsed.netloc or "amzn" in parsed.netloc:
        match = re.search(r'/dp/([A-Z0-9]{10})', url)
        if match:
            return f"amazon::{match.group(1)}"
    
    if "flipkart" in parsed.netloc:
        match = re.search(r'/p/([a-zA-Z0-9]+)', url)
        if match:
            return f"flipkart::{match.group(1)}"
    
    return f"{parsed.netloc}{parsed.path}"


def detect_platform(url: str) -> str:
    """
    Detect e-commerce platform from URL.
    
    Args:
        url: Product URL
        
    Returns:
        Platform name: "amazon", "flipkart", or "unknown"
    """
    url_lower = url.lower()
    
    if "amazon" in url_lower or "amzn" in url_lower:
        return "amazon"
    if "flipkart" in url_lower:
        return "flipkart"
    
    return "unknown"


def extract_amazon_asin(url: str) -> str | None:
    """
    Extract the ASIN (Amazon Standard Identification Number) from a URL.
    
    Args:
        url: Amazon product URL
        
    Returns:
        10-character ASIN string, or None if not found
    """
    match = re.search(r'/dp/([A-Z0-9]{10})', url)
    return match.group(1) if match else None


def extract_amazon_tld(url: str) -> str:
    """
    Extract the Amazon TLD (top-level domain) from a URL.
    
    Maps domain suffixes to TLD codes used by ScraperAPI:
        amazon.in  -> "in"
        amazon.com -> "com"
        amazon.co.uk -> "co.uk"
        etc.
    
    Args:
        url: Amazon product URL
        
    Returns:
        TLD string for ScraperAPI (e.g. "in", "com", "co.uk")
    """
    parsed = urlparse(url.strip())
    host = parsed.netloc.lower()
    
    # Remove www. prefix
    host = re.sub(r'^www\.', '', host)
    
    # Extract TLD after "amazon."
    match = re.match(r'amazon\.(.+)', host)
    if match:
        return match.group(1)
    
    # Fallback for shortened URLs (amzn.in, etc.)
    match = re.match(r'amzn\.(.+)', host)
    if match:
        return match.group(1)
    
    return "com"