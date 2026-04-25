"""
Fake review classifier using trained ML model.
Loads model at import time for fast predictions.
"""

import joblib
import logging
import numpy as np
from scipy.sparse import hstack, csr_matrix
from typing import Optional
from app.ml.preprocessor import clean_text, extract_features
from app.config import settings


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model and vectorizer - loaded at import
model = None
vectorizer = None


def _load_models():
    """Load trained model and vectorizer from disk."""
    global model, vectorizer
    
    try:
        model = joblib.load('app/ml/fake_review_model.pkl')
        vectorizer = joblib.load('app/ml/tfidf_vectorizer.pkl')
        logger.info("✓ ML model loaded successfully")
    except FileNotFoundError as e:
        logger.warning(
            f"⚠ ML model files not found: {e}\n"
            "Run 'python -m app.ml.train_model' to create them."
        )
        model = None
        vectorizer = None
    except Exception as e:
        logger.error(f"❌ Error loading ML model: {e}")
        model = None
        vectorizer = None


# Load models on import
_load_models()


def classify_review(text: str, rating: int = 3) -> dict:
    """
    Classify a single review as fake or real.
    
    Args:
        text: Review text content
        rating: Star rating (1-5)
        
    Returns:
        Dict with keys:
            - is_fake: bool
            - confidence: float (0.0 to 1.0)
            - reasons: list[str] explaining why it might be fake
    """
    # Fallback if model not loaded
    if model is None or vectorizer is None:
        return {
            "is_fake": False,
            "confidence": 0.5,
            "reasons": ["ML model not loaded — run train_model.py first"]
        }
    
    try:
        # Clean text and create TF-IDF vector
        cleaned = clean_text(text)
        tfidf_vec = vectorizer.transform([cleaned])
        
        # Extract engineered features
        feat = extract_features([text], [rating])[0]
        feat_sparse = csr_matrix([[v for v in feat.values()]])
        
        # Combine TF-IDF + features
        combined = hstack([tfidf_vec, feat_sparse])
        
        # Predict (handle both sparse and dense models)
        try:
            # Try sparse first (works for LogisticRegression, RandomForest)
            proba = model.predict_proba(combined)[0][1]
        except:
            # Fall back to dense (needed for XGBoost)
            proba = model.predict_proba(combined.toarray())[0][1]
        
        is_fake = proba >= settings.FAKE_THRESHOLD
        
        return {
            "is_fake": bool(is_fake),
            "confidence": round(float(proba), 4),
            "reasons": get_fake_reasons(text, rating, proba)
        }
    
    except Exception as e:
        logger.error(f"Classification error: {e}")
        return {
            "is_fake": False,
            "confidence": 0.5,
            "reasons": [f"Classification error: {str(e)}"]
        }


def classify_batch(texts: list[str], ratings: list[int]) -> list[dict]:
    """
    Classify multiple reviews efficiently.
    
    Args:
        texts: List of review text strings
        ratings: List of star ratings
        
    Returns:
        List of classification result dicts
    """
    if model is None or vectorizer is None:
        return [
            {
                "is_fake": False,
                "confidence": 0.5,
                "reasons": ["ML model not loaded"]
            }
            for _ in texts
        ]
    
    results = []
    for text, rating in zip(texts, ratings):
        results.append(classify_review(text, rating))
    
    return results


def get_fake_reasons(text: str, rating: int, confidence: float) -> list[str]:
    """
    Generate human-readable reasons why a review might be fake.
    
    Args:
        text: Review text
        rating: Star rating
        confidence: ML model confidence score
        
    Returns:
        List of reason strings
    """
    reasons = []
    
    # Excessive exclamation marks (>=3)
    if text.count('!') >= 3:
        reasons.append("Excessive exclamation marks")
    
    # Suspiciously short (<10 words)
    word_count = len(text.split())
    if word_count < 10:
        reasons.append("Suspiciously short review")
    
    # Overuse of superlatives (>2)
    superlatives = ['best', 'perfect', 'amazing', 'excellent', 'greatest', 'wonderful', 'fantastic', 'outstanding', 'superb', 'brilliant']
    superlative_count = sum(text.lower().count(w) for w in superlatives)
    if superlative_count > 2:
        reasons.append("Overuse of superlatives")
    
    # Generic copy-paste language
    generic_phrases = [
        'love it', 'works great', 'highly recommend',
        'great product', 'as described', 'fast shipping',
        'must buy', 'worth every penny', 'exceeded my expectations',
        'best purchase', 'no complaints', 'absolutely love', 'perfect product'
    ]
    if any(phrase in text.lower() for phrase in generic_phrases):
        reasons.append("Generic copy-paste language")
    
    # Negative sentiment in 5-star review
    negative_words = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'poor', 'worst', 'defective', 'broken']
    if rating == 5 and any(word in text.lower() for word in negative_words):
        reasons.append("5-star rating contradicts negative language")
    
    # High ML confidence
    if confidence > 0.85:
        reasons.append("High confidence AI detection")
    
    return reasons if reasons else ["Pattern analysis indicates potential manipulation"]