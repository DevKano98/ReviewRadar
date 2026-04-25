/**
 * Helper utilities for analyzing and formatting ReviewRadar data.
 */

function normalizeVerdict(verdict) {
  return String(verdict || 'CAUTION').toUpperCase().replace(/\s+/g, '_');
}

export const getVerdictStyles = (verdict) => {
  const normalizedVerdict = normalizeVerdict(verdict);

  switch (normalizedVerdict) {
    case 'BUY':
    case 'WORTH_BUYING':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        title: 'Worth Buying',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      };
    case 'AVOID':
    case 'SKIP_THIS':
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        title: 'Skip This',
        badge: 'bg-rose-100 text-rose-700 border-rose-200',
      };
    case 'CAUTION':
    case 'BUY_WITH_CAUTION':
    default:
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        title: 'Buy With Caution',
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
      };
  }
};

export const getScoreColorClass = (score) => {
  const numScore = Number(score) || 0;
  if (numScore < 40) return 'text-rose-600 stroke-rose-500';
  if (numScore < 70) return 'text-amber-600 stroke-amber-500';
  return 'text-emerald-600 stroke-emerald-500';
};

export const sortReviews = (reviews, sortBy) => {
  if (!Array.isArray(reviews)) return [];

  return [...reviews].sort((a, b) => {
    if (sortBy === 'confidence') {
      const confA = Number(a.fake_confidence ?? a.confidence ?? 0);
      const confB = Number(b.fake_confidence ?? b.confidence ?? 0);
      return confB - confA;
    }

    if (sortBy === 'rating') {
      return Number(a.rating || 0) - Number(b.rating || 0);
    }

    return 0;
  });
};

export const filterReviews = (reviews, filterType) => {
  if (!Array.isArray(reviews)) return [];

  if (filterType === 'fake') return reviews.filter((review) => review.is_fake);
  if (filterType === 'real') return reviews.filter((review) => !review.is_fake);
  return reviews;
};
