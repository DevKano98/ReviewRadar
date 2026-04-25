"""
Gemini AI service for generating buy/skip recommendations.
"""

import google.generativeai as genai
import json
import logging
from app.config import settings


# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

# Initialize model with system instruction
model = genai.GenerativeModel(
    "gemma-4-26b-a4b-it",
    system_instruction="""You are ReviewRadar AI. You help Indian online shoppers make
smart buying decisions. You only receive REAL verified reviews — fakes have been
filtered by ML. Be honest, direct, and specific. Never be vague."""
)

logger = logging.getLogger(__name__)


async def generate_summary(
    product_title: str,
    platform: str,
    trust_score: float,
    total_reviews: int,
    fake_count: int,
    real_count: int,
    real_reviews: list[dict]
) -> dict:
    """
    Generate AI-powered buy/skip verdict using Gemini.
    
    Args:
        product_title: Product name
        platform: "amazon" or "flipkart"
        trust_score: Computed trust score (0-100)
        total_reviews: Total number of reviews
        fake_count: Number of fake reviews detected
        real_count: Number of real reviews
        real_reviews: List of real review dicts (with rating, body keys)
        
    Returns:
        Dict with keys: verdict, one_line, pros, cons, bottom_line
    """
    # Fallback response in case of errors
    fallback = {
        "verdict": "Buy With Caution",
        "one_line": "Analysis incomplete due to technical issue",
        "pros": [],
        "cons": [],
        "bottom_line": "Please try analyzing again"
    }
    
    try:
        # Take up to 20 best real reviews for context
        review_snippets = []
        for r in real_reviews[:20]:
            rating = r.get('rating', 3)
            body = r.get('body', '')[:200]  # Truncate long reviews
            review_snippets.append(f"- [{rating}★] {body}")
        
        reviews_text = '\n'.join(review_snippets) if review_snippets else "No real reviews available"
        
        # Construct prompt
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
        
        # Call Gemini API
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean markdown formatting if present
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            response_text = '\n'.join(lines[1:-1]) if len(lines) > 2 else response_text
            response_text = response_text.replace('```json', '').replace('```', '').strip()
        
        # Parse JSON response
        summary = json.loads(response_text)
        
        # Validate required keys
        required_keys = ['verdict', 'one_line', 'pros', 'cons', 'bottom_line']
        if not all(key in summary for key in required_keys):
            logger.warning("Gemini response missing required keys")
            return fallback
        
        return summary
    
    except json.JSONDecodeError as e:
        logger.error(f"Gemini JSON parse error: {e}")
        logger.error(f"Response text: {response_text[:500]}")
        return fallback
    
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return fallback