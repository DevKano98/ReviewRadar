"""
Text preprocessing and feature engineering for fake review detection.
"""

import re


def clean_text(text: str) -> str:
    """
    Clean and normalize review text for ML processing.
    
    Steps:
    1. Convert to lowercase
    2. Remove URLs
    3. Remove special characters (keep letters, spaces, punctuation)
    4. Normalize whitespace
    
    Args:
        text: Raw review text
        
    Returns:
        Cleaned text
    """
    text = str(text).lower()
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'[^a-zA-Z\s!?.,]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def extract_features(texts: list[str], ratings: list[int]) -> list[dict]:
    """
    Extract engineered features from reviews for ML classification.
    
    Features extracted per review:
    - text_length: Total character count
    - word_count: Number of words
    - exclamation_count: Number of '!' characters
    - caps_ratio: Ratio of uppercase to total characters
    - avg_word_length: Average length of words
    - superlative_count: Count of superlative words (best, worst, amazing, etc.)
    - superlative_density: Superlatives per word
    - first_person_ratio: Usage of "I" pronoun
    - rating: Star rating (1-5)
    - negative_in_5star: Flag for 5-star reviews with negative sentiment
    - generic_phrases: Count of generic copy-paste phrases
    
    Args:
        texts: List of review text strings
        ratings: List of star ratings (1-5)
        
    Returns:
        List of feature dicts, one per review
    """
    features = []
    
   
    superlatives = r'\b(best|worst|amazing|perfect|horrible|excellent|awful|greatest)\b'
    generic = r'(love it|works great|highly recommend|great product|as described|fast shipping)'
    negative = r'\b(bad|terrible|awful|horrible|disappointing|poor|worst)\b'
    
    for text, rating in zip(texts, ratings):
        words = text.split()
        word_count = len(words) + 1  
        
        features.append({
            "text_length": len(text),
            "word_count": word_count,
            "exclamation_count": text.count('!'),
            "caps_ratio": sum(1 for c in text if c.isupper()) / (len(text) + 1),
            "avg_word_length": sum(len(w) for w in words) / word_count,
            "superlative_count": len(re.findall(superlatives, text.lower())),
            "superlative_density": len(re.findall(superlatives, text.lower())) / word_count,
            "first_person_ratio": text.lower().count(' i ') / word_count,
            "rating": float(rating) if rating else 3.0,
            "negative_in_5star": int(rating == 5 and bool(re.search(negative, text.lower()))),
            "generic_phrases": len(re.findall(generic, text.lower()))
        })
    
    return features