export function detectPlatform(url) {
  try {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('amazon.in') || lowerUrl.includes('amazon.com')) {
      return "amazon";
    }
    if (lowerUrl.includes('flipkart.com')) {
      return "flipkart";
    }
    return "unknown";
  } catch (e) {
    return "unknown";
  }
}

export function isValidProductURL(url) {
  if (!url) return { valid: false, platform: null, error: "URL cannot be empty" };
  
  try {
    const platform = detectPlatform(url);
    const lowerUrl = url.toLowerCase();

    if (platform === "amazon" && lowerUrl.includes("/dp/")) {
      return { valid: true, platform: "amazon", error: null };
    }
    
    if (platform === "flipkart" && lowerUrl.includes("/p/")) {
      return { valid: true, platform: "flipkart", error: null };
    }

    return { 
      valid: false, 
      platform, 
      error: "Invalid product URL format. Must contain /dp/ for Amazon or /p/ for Flipkart." 
    };
  } catch (err) {
    return { valid: false, platform: null, error: "Invalid URL string" };
  }
}