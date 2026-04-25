function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeReview(review = {}) {
  const fakeConfidence = safeNumber(
    review.fake_confidence ?? review.confidence,
    review.is_fake ? 0.5 : 0
  );

  return {
    ...review,
    rating: safeNumber(review.rating, 0),
    date: review.date || review.review_date || 'Recent',
    review_date: review.review_date || review.date || '',
    fake_confidence: fakeConfidence,
    confidence: safeNumber(review.confidence, fakeConfidence),
    reasons: review.reasons || review.fake_reasons || [],
    fake_reasons: review.fake_reasons || review.reasons || [],
    is_fake: Boolean(review.is_fake),
  };
}

export function normalizeGeminiSummary(summary) {
  if (!summary) return null;

  let parsed = summary;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  return {
    verdict: parsed.verdict || 'Buy With Caution',
    one_line: parsed.one_line || 'Summary unavailable.',
    pros: Array.isArray(parsed.pros) ? parsed.pros : [],
    cons: Array.isArray(parsed.cons) ? parsed.cons : [],
    bottom_line: parsed.bottom_line || 'Please review the detailed results below.',
  };
}

export function normalizeProductPayload(payload = {}) {
  const reviews = Array.isArray(payload.reviews) ? payload.reviews.map(normalizeReview) : [];
  const trustScore = safeNumber(payload.trust_score, 0);
  const fakeCount = safeNumber(payload.fake_count, reviews.filter((review) => review.is_fake).length);
  const realCount = safeNumber(payload.real_count, reviews.length - fakeCount);

  return {
    product: {
      ...payload,
      rating: safeNumber(payload.rating, 0),
      trust_score: trustScore,
      fake_count: fakeCount,
      real_count: realCount,
      total_reviews: safeNumber(payload.total_reviews, reviews.length),
    },
    reviews,
    mlStats: {
      trust_score: trustScore,
      fake_count: fakeCount,
      real_count: realCount,
      verdict: payload.verdict || 'caution',
    },
    geminiSummary: normalizeGeminiSummary(payload.gemini_summary),
  };
}

export function normalizeLibraryProduct(product = {}) {
  return {
    ...product,
    trust_score: safeNumber(product.trust_score, 0),
    rating: safeNumber(product.rating, 0),
    total_reviews: safeNumber(product.total_reviews, 0),
    fake_count: safeNumber(product.fake_count, 0),
    real_count: safeNumber(product.real_count, 0),
    gemini_summary: normalizeGeminiSummary(product.gemini_summary),
  };
}
