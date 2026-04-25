"""
Gemini AI service for generating buy/skip recommendations.
"""

import json
import logging

import google.generativeai as genai

from app.config import settings


logger = logging.getLogger(__name__)

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

# Use a Gemini model that works with the current google.generativeai client.
MODEL_NAME = "gemini-flash-lite-latest"

model = genai.GenerativeModel(
    MODEL_NAME,
    system_instruction="""You are ReviewRadar AI. You help Indian online shoppers make
smart buying decisions. You only receive real verified reviews - fakes have been
filtered by ML. Be honest, direct, and specific. Never be vague.""",
)


async def generate_summary(
    product_title: str,
    platform: str,
    trust_score: float,
    total_reviews: int,
    fake_count: int,
    real_count: int,
    real_reviews: list[dict],
) -> dict:
    """
    Generate AI-powered buy/skip verdict using Gemini.
    """
    fallback = build_fallback_summary(
        product_title,
        trust_score,
        total_reviews,
        fake_count,
        real_count,
        real_reviews,
    )

    try:
        review_snippets = []
        for review in real_reviews[:20]:
            rating = review.get("rating", 3)
            body = review.get("body", "")[:200]
            review_snippets.append(f"- [{rating} stars] {body}")

        reviews_text = "\n".join(review_snippets) if review_snippets else "No real reviews available"

        prompt = f"""
Product: {product_title}
Platform: {platform}
Trust Score: {trust_score}/100
Total Reviews: {total_reviews} | Fake: {fake_count} | Real: {real_count}

Verified Real Reviews:
{reviews_text}

Based ONLY on these real reviews, respond with valid JSON exactly like this:
{{
  "verdict": "Worth Buying" or "Skip This" or "Buy With Caution",
  "one_line": "One punchy sentence summarizing your verdict",
  "pros": ["specific pro 1", "specific pro 2", "specific pro 3"],
  "cons": ["specific con 1", "specific con 2"],
  "bottom_line": "Your honest final recommendation in one sentence"
}}

Return ONLY the JSON. No markdown. No explanation.
""".strip()

        response = model.generate_content(prompt)
        response_text = (response.text or "").strip()

        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1]) if len(lines) > 2 else response_text
            response_text = response_text.replace("```json", "").replace("```", "").strip()

        summary = json.loads(response_text)

        required_keys = ["verdict", "one_line", "pros", "cons", "bottom_line"]
        if not all(key in summary for key in required_keys):
            logger.warning("Gemini response missing required keys")
            return fallback

        return summary

    except json.JSONDecodeError as exc:
        logger.error("Gemini JSON parse error: %s", exc)
        logger.error("Response text: %s", response_text[:500] if "response_text" in locals() else "")
        return fallback

    except Exception as exc:
        logger.error("Gemini API error: %s", exc)
        return fallback


def build_fallback_summary(
    product_title: str,
    trust_score: float,
    total_reviews: int,
    fake_count: int,
    real_count: int,
    real_reviews: list[dict],
) -> dict:
    """
    Build a deterministic local summary when Gemini is unavailable.
    """
    verdict = (
        "Worth Buying"
        if trust_score >= 70
        else "Skip This"
        if trust_score < 40
        else "Buy With Caution"
    )

    positive_reviews = [review for review in real_reviews if (review.get("rating") or 0) >= 4]
    critical_reviews = [review for review in real_reviews if (review.get("rating") or 0) <= 2]

    pros = []
    cons = []

    if positive_reviews:
        pros.append("Several credible buyers described a clearly positive experience.")
    if real_count:
        pros.append(f"{real_count} reviews were treated as trustworthy input.")
    if trust_score >= 70:
        pros.append("The trust score suggests the review mix looks healthy overall.")

    if fake_count:
        cons.append(f"{fake_count} reviews were flagged as suspicious during ML screening.")
    if critical_reviews:
        cons.append("Some credible reviews still mention noticeable drawbacks.")
    if trust_score < 70:
        cons.append("The final verdict is limited by mixed or weaker evidence.")

    if not pros:
        pros.append("The available evidence set is smaller than ideal.")
    if not cons:
        cons.append("No single major complaint dominated the verified reviews.")

    if trust_score >= 70:
        one_line = f"{product_title} looks promising based on the credible reviews available."
    elif trust_score < 40:
        one_line = f"{product_title} shows too many suspicious or conflicting signals to trust comfortably."
    else:
        one_line = f"{product_title} has mixed signals, so a cautious decision makes sense."

    if total_reviews:
        bottom_line = (
            f"This recommendation is based on {total_reviews} analyzed reviews, including {real_count} credible ones."
        )
    else:
        bottom_line = "This recommendation is based on limited evidence, so treat it as an early signal."

    return {
        "verdict": verdict,
        "one_line": one_line,
        "pros": pros[:3],
        "cons": cons[:3],
        "bottom_line": bottom_line,
    }
