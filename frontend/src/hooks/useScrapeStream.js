import { useState, useCallback } from "react";

export const useScrapeStream = () => {
  const [status, setStatus] = useState("idle");
  const [events, setEvents] = useState([]);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [mlStats, setMlStats] = useState(null);
  const [geminiSummary, setGeminiSummary] = useState(null);
  const [productId, setProductId] = useState(null);
  const [error, setError] = useState(null);

  const addEvent = useCallback((eventObj) => {
    setEvents((prev) => [...prev, { ...eventObj, id: Date.now() + Math.random() }]);
  }, []);

  const reset = () => {
    setStatus("idle");
    setEvents([]);
    setReviews([]);
    setProduct(null);
    setMlStats(null);
    setGeminiSummary(null);
    setProductId(null);
    setError(null);
  };

  const startScrape = (url) => {
    reset();
    setStatus("connecting");

    const es = new EventSource(`${import.meta.env.VITE_API_BASE}/scrape/stream?url=${encodeURIComponent(url)}`);

    const listeners = {
      "progress": (e) => {
        const data = JSON.parse(e.data);
        setStatus("scraping");
        addEvent({ type: "info", msg: data.msg, step: data.step });
      },
      "product": (e) => {
        const data = JSON.parse(e.data);
        setProduct(data);
        addEvent({ type: "success", msg: `Found: ${data.title}` });
      },
      "review": (e) => {
        const data = JSON.parse(e.data);
        addEvent({ type: "review_raw", msg: data.reviewer_name, rating: data.rating, body: data.body.slice(0, 80) });
      },
      "ml_start": (e) => {
        const data = JSON.parse(e.data);
        setStatus("classifying");
        addEvent({ type: "ml", msg: data.msg });
      },
      "ml_result": (e) => {
        const data = JSON.parse(e.data);
        addEvent({ 
          type: data.is_fake ? "fake" : "real", 
          msg: data.reviewer_name, 
          confidence: data.confidence, 
          body: data.body, 
          reasons: data.reasons 
        });
        setReviews(prev => [...prev, data]);
      },
      "ml_done": (e) => {
        const data = JSON.parse(e.data);
        setMlStats(data);
        addEvent({ type: "stats", fake: data.fake_count, real: data.real_count, score: data.trust_score });
      },
      "gemini_start": (e) => {
        const data = JSON.parse(e.data);
        setStatus("summarizing");
        addEvent({ type: "ai", msg: data.msg });
      },
      "gemini_done": (e) => {
        const data = JSON.parse(e.data);
        setGeminiSummary(data);
        addEvent({ type: "verdict", verdict: data.verdict });
      },
      "cached": (e) => {
        const data = JSON.parse(e.data);
        setStatus("cached");
        addEvent({ type: "info", msg: data.msg });
      },
      "saved": (e) => {
        const data = JSON.parse(e.data);
        setProductId(data.product_id);
      },
      "complete": () => {
        setStatus("done");
        es.close();
      },
      "error": (e) => {
        const data = JSON.parse(e.data);
        setStatus("error");
        setError(data.msg);
        addEvent({ type: "error", msg: data.msg });
        es.close();
      }
    };

    Object.entries(listeners).forEach(([event, handler]) => {
      es.addEventListener(event, handler);
    });

    es.onerror = () => {
      setStatus("error");
      setError("Connection lost. Please try again.");
      es.close();
    };

    // Cleanup function
    return () => es.close();
  };

  return { status, events, product, reviews, mlStats, geminiSummary, productId, error, startScrape, reset };
};