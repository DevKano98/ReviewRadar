/**
 * Helper utilities for analyzing and formatting ReviewRadar data.
 */

// 1. Determine banner and text styles based on the AI Verdict
export const getVerdictStyles = (verdict) => {
  const normalizedVerdict = verdict?.toUpperCase() || "CAUTION";
  
  switch (normalizedVerdict) {
    case "BUY":
      return { 
        bg: "bg-emerald-900/40", 
        border: "border-emerald-500/50", 
        text: "text-emerald-400", 
        title: "✓ Worth Buying",
        badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      };
    case "AVOID":
      return { 
        bg: "bg-red-900/40", 
        border: "border-red-500/50", 
        text: "text-red-400", 
        title: "✗ Skip This Product",
        badge: "bg-red-500/10 text-red-400 border-red-500/20"
      };
    case "CAUTION":
    default:
      return { 
        bg: "bg-yellow-900/40", 
        border: "border-yellow-500/50", 
        text: "text-yellow-400", 
        title: "⚠ Buy With Caution",
        badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      };
  }
};

// 2. Determine Trust Score ring colors
export const getScoreColorClass = (score) => {
  const numScore = Number(score) || 0;
  if (numScore < 40) return "text-red-400 stroke-red-400";
  if (numScore < 70) return "text-yellow-400 stroke-yellow-400";
  return "text-emerald-400 stroke-emerald-400";
};

// 3. Sort reviews based on user selection
export const sortReviews = (reviews, sortBy) => {
  if (!Array.isArray(reviews)) return [];
  
  return [...reviews].sort((a, b) => {
    if (sortBy === 'confidence') {
      // Sort by highest fake confidence first
      const confA = a.is_fake ? a.fake_confidence : 0;
      const confB = b.is_fake ? b.fake_confidence : 0;
      return confB - confA;
    }
    if (sortBy === 'rating') {
      // Sort by lowest rating first (often correlates with fake negative reviews, or vice versa)
      return (a.rating || 0) - (b.rating || 0);
    }
    return 0; // Default received order
  });
};

// 4. Filter reviews by category
export const filterReviews = (reviews, filterType) => {
  if (!Array.isArray(reviews)) return [];
  
  if (filterType === 'fake') return reviews.filter(r => r.is_fake);
  if (filterType === 'real') return reviews.filter(r => !r.is_fake);
  return reviews; // 'all'
};