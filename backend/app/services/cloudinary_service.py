"""
Cloudinary image upload service.
"""

import cloudinary
import cloudinary.uploader
import requests
import logging
from app.config import settings


logger = logging.getLogger(__name__)


# Configure Cloudinary on import
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)


def upload_product_image(image_url: str, cache_key: str) -> str:
    """
    Download and upload product image to Cloudinary.
    
    Args:
        image_url: Original product image URL from Amazon/Flipkart
        cache_key: Normalized cache key for the product (e.g., "amazon::B08N5WRWNW")
        
    Returns:
        Cloudinary secure URL on success, original URL on failure
    """
    try:
        # Create Cloudinary-friendly slug from cache key
        slug = cache_key.replace("::", "-")
        
        # Download image
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            response.content,
            public_id=f"reviewradar/{slug}",
            overwrite=True,
            resource_type="image"
        )
        
        cloudinary_url = result["secure_url"]
        logger.info(f"✓ Uploaded image to Cloudinary: {slug}")
        
        return cloudinary_url
    
    except requests.RequestException as e:
        logger.warning(f"Failed to download image: {e}")
        return image_url
    
    except Exception as e:
        logger.warning(f"Cloudinary upload failed: {e}")
        return image_url