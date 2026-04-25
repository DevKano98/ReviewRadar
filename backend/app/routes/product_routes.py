

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from app.database import queries
from app.services.url_utils import normalize_url

router = APIRouter(prefix="/product", tags=["product"])


@router.get("/check")
async def check_cache(url: str = Query(...)):
    """
    Check if a product URL has been analyzed before.
    
    Args:
        url: Product URL to check
        
    Returns:
        Dict with cached status and product_id if found
    """
    cache_key = normalize_url(url)
    cached = queries.get_cached_product(cache_key)
    if cached:
        return {"cached": True, "product_id": str(cached["id"])}
    return {"cached": False, "product_id": None}


@router.get("/recent")
async def recent_searches():
    """
    Get recent product searches/analyses.
    
    Returns:
        List of recent search dicts with product info
    """
    results = queries.get_recent_searches(limit=8)
    
    
    serialized = []
    for r in results:
        row = {}
        for k, v in r.items():
           
            if hasattr(v, "hex"):
                row[k] = str(v)
            
            elif hasattr(v, "isoformat"):
                row[k] = v.isoformat()
            else:
                row[k] = v
        serialized.append(row)
    
    return serialized


@router.get("/library")
async def product_library(limit: int = Query(48, ge=1, le=200)):
    """
    Get analyzed product pages directly from the DB.

    Args:
        limit: Maximum number of products to return

    Returns:
        List of analyzed product dicts
    """
    results = queries.list_products(limit=limit)

    serialized = []
    for r in results:
        row = {}
        for k, v in r.items():
            if hasattr(v, "hex"):
                row[k] = str(v)
            elif hasattr(v, "isoformat"):
                row[k] = v.isoformat()
            else:
                row[k] = v
        serialized.append(row)

    return serialized


@router.get("/{product_id}")
async def get_product(product_id: UUID):
    """
    Get complete product details with all reviews.
    
    Args:
        product_id: UUID of the product
        
    Returns:
        Product dict with reviews array
    """
    product = queries.get_product_with_reviews(str(product_id))
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
   
    def serialize(obj):
        if hasattr(obj, "hex"):  
            return str(obj)
        if hasattr(obj, "isoformat"): 
            return obj.isoformat()
        return obj

    def deep_serialize(d):
        if isinstance(d, dict):
            return {k: deep_serialize(v) for k, v in d.items()}
        if isinstance(d, list):
            return [deep_serialize(i) for i in d]
        return serialize(d)

    return deep_serialize(product)
