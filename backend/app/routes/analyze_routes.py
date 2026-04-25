"""
Analysis endpoints for ML classification and trust scoring.
"""

import json
from fastapi import APIRouter, HTTPException, Body
from app.ml.classifier import classify_review, classify_batch
from app.services.gemini_service import generate_summary
from app.database import queries
from app.models.pydantic_models import ScrapeRequest

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("/review")
async def analyze_single_review(
    text: str = Body(..., embed=True),
    rating: int = Body(3, embed=True),
):
    """
    Classify a single review text as fake or real.
    Returns is_fake, confidence score, and reasons.
    """
    result = classify_review(text, rating)
    return {
        "text": text[:200],
        "rating": rating,
        "is_fake": result["is_fake"],
        "confidence": result["confidence"],
        "reasons": result["reasons"],
    }


@router.post("/batch")
async def analyze_batch_reviews(
    reviews: list[dict] = Body(...),
):
    """
    Classify a batch of reviews at once.
    Each item must have: text (str), rating (int, optional).
    Returns list of classification results.
    """
    if not reviews:
        raise HTTPException(status_code=400, detail="No reviews provided.")
    if len(reviews) > 200:
        raise HTTPException(status_code=400, detail="Max 200 reviews per batch.")

    texts = [str(r.get("text", r.get("body", ""))) for r in reviews]
    ratings = [int(r.get("rating", 3)) for r in reviews]

    results = classify_batch(texts, ratings)

    output = []
    for review, result in zip(reviews, results):
        output.append(
            {
                "text": str(review.get("text", review.get("body", "")))[:200],
                "rating": review.get("rating", 3),
                "is_fake": result["is_fake"],
                "confidence": result["confidence"],
                "reasons": result["reasons"],
            }
        )

    fake_count = sum(1 for r in results if r["is_fake"])
    real_count = len(results) - fake_count
    fake_confidences = [r["confidence"] for r in results if r["is_fake"]]
    avg_conf = sum(fake_confidences) / len(fake_confidences) if fake_confidences else 0.5
    total = len(results)
    fake_ratio = fake_count / total if total > 0 else 0
    raw_score = (1 - fake_ratio) * 100 * (1 - (avg_conf - 0.5))
    trust_score = round(max(0, min(100, raw_score)), 1)
    verdict = "buy" if trust_score >= 70 else "avoid" if trust_score < 40 else "caution"

    return {
        "total": total,
        "fake_count": fake_count,
        "real_count": real_count,
        "trust_score": trust_score,
        "verdict": verdict,
        "results": output,
    }


@router.post("/reanalyze/{product_id}")
async def reanalyze_product(product_id: str):
    """
    Re-run ML classification + Gemini summary on an already-scraped product.
    Useful if the model has been retrained.
    Updates trust_score, verdict, and gemini_summary in DB.
    """
    product = queries.get_product_with_reviews(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    reviews = product.get("reviews", [])
    if not reviews:
        raise HTTPException(status_code=400, detail="No reviews to analyze.")

    # Re-classify all reviews
    texts = [r.get("body", "") for r in reviews]
    ratings = [r.get("rating", 3) for r in reviews]
    results = classify_batch(texts, ratings)

    classified_reviews = []
    for review, result in zip(reviews, results):
        classified_reviews.append({**review, **result})

    # Recompute trust score
    fake_count = sum(1 for r in results if r["is_fake"])
    real_count = len(results) - fake_count
    total = len(results)
    fake_confidences = [r["confidence"] for r in results if r["is_fake"]]
    avg_conf = sum(fake_confidences) / len(fake_confidences) if fake_confidences else 0.5
    fake_ratio = fake_count / total if total > 0 else 0
    raw_score = (1 - fake_ratio) * 100 * (1 - (avg_conf - 0.5))
    trust_score = round(max(0, min(100, raw_score)), 1)
    verdict = "buy" if trust_score >= 70 else "avoid" if trust_score < 40 else "caution"

    # Re-generate Gemini summary
    real_reviews = [r for r in classified_reviews if not r.get("is_fake", False)]
    gemini_summary = await generate_summary(
        product.get("title", "Unknown Product"),
        product.get("platform", "unknown"),
        trust_score,
        total,
        fake_count,
        real_count,
        real_reviews,
    )

    # Persist updates
    queries.update_product_analysis(
        product_id, trust_score, fake_count, real_count, verdict, gemini_summary
    )

    return {
        "product_id": product_id,
        "title": product.get("title", ""),
        "total_reviews": total,
        "fake_count": fake_count,
        "real_count": real_count,
        "trust_score": trust_score,
        "verdict": verdict,
        "gemini_summary": gemini_summary,
    }


@router.get("/trust-score")
async def compute_trust_score(
    fake_count: int,
    real_count: int,
    avg_fake_confidence: float = 0.5,
):
    """
    Utility endpoint: compute trust score from raw numbers.
    Useful for frontend previews or testing the formula.
    """
    total = fake_count + real_count
    if total == 0:
        raise HTTPException(status_code=400, detail="fake_count + real_count must be > 0.")
    fake_ratio = fake_count / total
    raw_score = (1 - fake_ratio) * 100 * (1 - (avg_fake_confidence - 0.5))
    trust_score = round(max(0, min(100, raw_score)), 1)
    verdict = "buy" if trust_score >= 70 else "avoid" if trust_score < 40 else "caution"
    return {
        "fake_count": fake_count,
        "real_count": real_count,
        "total": total,
        "fake_ratio": round(fake_ratio, 4),
        "avg_fake_confidence": avg_fake_confidence,
        "trust_score": trust_score,
        "verdict": verdict,
    }