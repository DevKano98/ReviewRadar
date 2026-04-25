"""
Scraping endpoints with Server-Sent Events streaming.
"""

import asyncio
import json
from fastapi import APIRouter, Query
from sse_starlette.sse import EventSourceResponse
from app.services.scraper_service import scrape_product_stream
from app.services.url_utils import normalize_url, detect_platform
from app.ml.classifier import classify_review
from app.services.gemini_service import generate_summary
from app.services.cloudinary_service import upload_product_image
from app.database import queries

router = APIRouter(prefix="/scrape", tags=["scrape"])


@router.get("/stream")
async def scrape_stream(url: str = Query(...)):
    """
    Main SSE endpoint that streams scraping progress to frontend.
    
    Event flow:
    1. Check cache → if found, return cached data immediately
    2. Scrape product page → stream progress events
    3. Run ML classification → stream results per review
    4. Compute trust score → stream summary
    5. Generate Gemini AI summary → stream verdict
    6. Save to database → stream confirmation
    7. Return complete product data
    
    Args:
        url: Amazon or Flipkart product URL
        
    Returns:
        EventSourceResponse with SSE stream
    """

    async def generator():
        try:
            cache_key = normalize_url(url)

           
            cached = queries.get_cached_product(cache_key)
            if cached:
                yield {
                    "event": "cached",
                    "data": json.dumps({
                        "msg": "Found cached analysis!",
                        "product_id": str(cached["id"])
                    }),
                }
                product_with_reviews = queries.get_product_with_reviews(str(cached["id"]))
                
               
                yield {
                    "event": "complete",
                    "data": json.dumps(serialize_obj(product_with_reviews))
                }
                queries.log_search(url, cache_key, str(cached["id"]))
                return

           
            reviews_raw = []
            product_info = {}

            try:
                async for event in scrape_product_stream(url):
                    yield event  

                    
                    try:
                        parsed = json.loads(event["data"])
                    except Exception:
                        continue

                    if event["event"] == "product":
                        product_info = parsed
                    elif event["event"] == "review":
                        reviews_raw.append(parsed)
                    elif event["event"] == "error":
                        return  
            except Exception as e:
                yield {
                    "event": "error",
                    "data": json.dumps({"msg": f"Scraping failed: {str(e)}"})
                }
                return

            if not reviews_raw:
                yield {
                    "event": "progress",
                    "data": json.dumps({
                        "msg": "No reviews found on this page. Completing with product metadata only...",
                        "step": 4,
                        "total": 6
                    })
                }
                classified_reviews = []
            else:
               
                yield {
                    "event": "ml_start",
                    "data": json.dumps({
                        "msg": f"Running ML classifier on {len(reviews_raw)} reviews..."
                    })
                }

                classified_reviews = []
                for review in reviews_raw:
                    result = classify_review(
                        review.get("body", ""),
                        review.get("rating", 3)
                    )
                    classified = {
                        **review,
                        **result,
                        "fake_confidence": result["confidence"],
                        "fake_reasons": result["reasons"],
                        "date": review.get("date") or review.get("review_date", ""),
                    }
                    classified_reviews.append(classified)
                    
                   
                    yield {
                        "event": "ml_result",
                        "data": json.dumps({
                            "reviewer_name": review.get("reviewer_name", ""),
                            "rating": review.get("rating", 3),
                            "title": review.get("title", ""),
                            "body": review.get("body", "")[:100],
                            "date": review.get("date") or review.get("review_date", ""),
                            "is_fake": result["is_fake"],
                            "confidence": result["confidence"],
                            "fake_confidence": result["confidence"],
                            "reasons": result["reasons"],
                            "fake_reasons": result["reasons"],
                        })
                    }
                    await asyncio.sleep(0.03)  

           
            fake_count = sum(1 for r in classified_reviews if r["is_fake"])
            real_count = len(classified_reviews) - fake_count
            total = len(classified_reviews)
            
            if total == 0:
                trust_score = 0.0
                verdict = "unknown"
            else:
                fake_confidences = [
                    r["confidence"] for r in classified_reviews if r["is_fake"]
                ]
                avg_conf = (
                    sum(fake_confidences) / len(fake_confidences)
                    if fake_confidences else 0.5
                )
                
                fake_ratio = fake_count / total
                raw_score = (1 - fake_ratio) * 100 * (1 - (avg_conf - 0.5))
                trust_score = round(max(0, min(100, raw_score)), 1)
                verdict = (
                    "buy" if trust_score >= 70
                    else "avoid" if trust_score < 40
                    else "caution"
                )

            yield {
                "event": "ml_done",
                "data": json.dumps({
                    "fake_count": fake_count,
                    "real_count": real_count,
                    "trust_score": trust_score,
                    "verdict": verdict,
                })
            }

           
            yield {
                "event": "gemini_start",
                "data": json.dumps({"msg": "Generating AI buy/skip verdict..."})
            }
            
            real_reviews = [r for r in classified_reviews if not r["is_fake"]]
            gemini_summary = await generate_summary(
                product_info.get("title", "Unknown Product"),
                detect_platform(url),
                trust_score,
                total,
                fake_count,
                real_count,
                real_reviews,
            )
            
            yield {
                "event": "gemini_done",
                "data": json.dumps(gemini_summary)
            }

           
            cloudinary_url = product_info.get("image_url", "")
            if cloudinary_url:
                try:
                    cloudinary_url = upload_product_image(cloudinary_url, cache_key)
                except Exception as e:
                    print(f"Cloudinary upload failed: {e}")
                    pass  

            
            saved_product = queries.save_product({
                "cache_key": cache_key,
                "url": url,
                "platform": detect_platform(url),
                "title": product_info.get("title", ""),
                "price": product_info.get("price", ""),
                "image_url": cloudinary_url,
                "rating": product_info.get("rating"),
                "total_reviews": total,
                "trust_score": trust_score,
                "fake_count": fake_count,
                "real_count": real_count,
                "verdict": verdict,
                "gemini_summary": gemini_summary,
            })

            queries.save_reviews(classified_reviews, str(saved_product["id"]))
            queries.log_search(url, cache_key, str(saved_product["id"]))

            yield {
                "event": "saved",
                "data": json.dumps({
                    "product_id": str(saved_product["id"]),
                    "msg": "Analysis complete and saved!"
                })
            }

           
            full_product = queries.get_product_with_reviews(str(saved_product["id"]))
            
            yield {
                "event": "complete",
                "data": json.dumps(serialize_obj(full_product))
            }

        except Exception as e:
           
            import traceback
            traceback.print_exc()
            try:
                yield {
                    "event": "error",
                    "data": json.dumps({"msg": f"Unexpected server error: {str(e)}"})
                }
            except Exception:
                pass  

    return EventSourceResponse(generator())


def serialize_obj(obj):
    """Recursively serialize UUIDs and datetimes to JSON-safe types."""
    if hasattr(obj, "hex"):
        return str(obj)
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: serialize_obj(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [serialize_obj(i) for i in obj]
    return obj
