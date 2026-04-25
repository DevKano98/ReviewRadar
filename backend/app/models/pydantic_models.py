from typing import Optional
from pydantic import BaseModel


class ScrapeRequest(BaseModel):
    url: str


class ReviewOut(BaseModel):
    id: Optional[str] = None
    reviewer_name: str
    rating: int
    title: Optional[str] = None
    body: str
    review_date: Optional[str] = None
    verified: bool
    is_fake: bool
    fake_confidence: float
    fake_reasons: list[str]


class GeminiSummary(BaseModel):
    verdict: str
    one_line: str
    pros: list[str]
    cons: list[str]
    bottom_line: str


class ProductOut(BaseModel):
    id: str
    cache_key: str
    url: str
    platform: str
    title: str
    price: Optional[str] = None
    image_url: Optional[str] = None
    rating: Optional[float] = None
    total_reviews: int
    trust_score: float
    fake_count: int
    real_count: int
    verdict: str
    gemini_summary: Optional[dict] = None
    reviews: list[ReviewOut]