const BASE = import.meta.env.VITE_API_BASE;

export const getProduct = (productId) => 
  fetch(`${BASE}/product/${productId}`).then(r => r.json());

export const checkCached = (url) => 
  fetch(`${BASE}/product/check?url=${encodeURIComponent(url)}`).then(r => r.json());

export const getRecentSearches = () => 
  fetch(`${BASE}/recent`).then(r => r.json());