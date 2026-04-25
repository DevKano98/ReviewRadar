const BASE = import.meta.env.VITE_API_BASE;

export const getProduct = (productId) => 
  fetch(`${BASE}/product/${productId}`).then(r => r.json());

export const checkCached = (url) => 
  fetch(`${BASE}/product/check?url=${encodeURIComponent(url)}`).then(r => r.json());

export const getRecentSearches = () => 
  fetch(`${BASE}/product/recent`).then(r => r.json());

export const getProductLibrary = (limit = 48) =>
  fetch(`${BASE}/product/library?limit=${limit}`).then((r) => r.json());
