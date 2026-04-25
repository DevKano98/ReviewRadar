# ReviewRadar 🛡️
### Don't get fooled. Know before you buy.

ReviewRadar is a tool we built because we got tired of being misled by fake reviews on Amazon and Flipkart. You paste a product link. We tell you the truth.

---

## The Problem

Every day, millions of shoppers on Amazon and Flipkart make buying decisions based on reviews that were never written by real customers. Brands pay for fake reviews. Sellers bulk-generate them using bots. The star rating you see is often a lie — and there was no easy way to know that, until now.

---

## What ReviewRadar Does

You paste any Amazon or Flipkart product URL into ReviewRadar. In under a minute, you get:

- Every review on that product page scraped and analyzed
- Each review labeled as **Fake** or **Real** with a confidence score
- A **Trust Score** from 0 to 100 showing how authentic the product's reviews are
- A clear verdict — **Worth Buying**, **Buy With Caution**, or **Skip This**
- An AI-generated summary based exclusively on the real reviews

The entire process streams live to your screen as it happens — you watch each review get classified in real time, like watching a lie detector run on every review.

---

## How We Built It

### The Crawler

We built a custom scraper using Playwright — a full browser automation tool — that loads the actual product page the way a real user would, not just the raw HTML. This lets us get past lazy-loaded content and dynamic review sections that simple HTTP scrapers miss entirely.

To get past Amazon and Flipkart's anti-bot systems, we route every request through a residential proxy network. The scraper extracts reviewer name, star rating, review title, full body text, date, and verified purchase status — everything needed to make a good ML judgment.

For any product, we scrape up to 90 reviews across multiple pages. Results are cached so the same product URL never gets scraped twice — the second person to search a product gets their answer instantly.

### The ML Model

We trained a **Random Forest Classifier** on 40,526 real and computer-generated reviews from a curated fake review dataset. The model doesn't just look at words — it analyzes a combination of:

- **TF-IDF text vectors** across 15,000 vocabulary features with trigram support — catching not just individual words but suspicious phrases and patterns
- **11 engineered behavioral features** per review including exclamation mark density, superlative overuse, caps ratio, review length, generic phrase detection, first-person pronoun patterns, and rating-sentiment mismatch signals

The model achieved:

| Metric | Score |
|---|---|
| Accuracy | 89.17% |
| ROC-AUC | 0.9565 |
| Precision (Fake) | 0.90 |
| Recall (Fake) | 0.89 |

Out of 8,106 test reviews, 7,228 were classified correctly. The ROC-AUC of 0.9565 puts it in the top tier for classical ML on this problem — most research papers in this space report 0.88–0.94 using similar approaches.

We evaluated three algorithms — Logistic Regression (88.9%), XGBoost (87.8%), and Random Forest (89.2%) — and kept the best performer. The ensemble of TF-IDF plus hand-engineered features is what pushes it past a naive text classifier.

### The Trust Score

After the ML model classifies every review, we compute a Trust Score:

```
fake_ratio          = fake reviews / total reviews
avg_fake_confidence = mean ML confidence across fake-labeled reviews
trust_score         = (1 - fake_ratio) × 100 × (1 - (avg_fake_confidence - 0.5))
```

This formula penalizes not just the quantity of fake reviews but also the model's certainty about them. A product with 10 borderline-fake reviews scores higher than one with 10 reviews the model is 95% sure are fake.

Scores above 70 → **Worth Buying**. Below 40 → **Avoid**. In between → **Caution**.

### The AI Summary

We pass only the real reviews — fake ones filtered out — to Gemini 1.5 Flash. It reads them as a knowledgeable friend would and produces a structured verdict: what's genuinely good, what's genuinely bad, and whether you should buy it. The summary is grounded in real customer experiences, not manufactured ones.

---

## What Makes It Different

Most fake review checkers work on a per-seller or per-account basis — flagging suspicious reviewer patterns, checking if reviewers only review one brand, looking at review timing clusters. Those approaches require access to reviewer history across the entire platform, which only Amazon itself has.

We took a different approach: **analyze the text itself**. A fake review betrays itself through what it says and how it says it — the vocabulary it uses, the patterns it follows, the things it doesn't say. Our model learned these patterns from tens of thousands of examples and applies that judgment to every review it sees.

---

## The Stack

Built entirely with open-source tools and free-tier cloud services. Runs on any machine. Deployable for free.

**Backend:** Python + FastAPI + Playwright  
**ML:** scikit-learn + XGBoost  
**Database:** Neon (serverless PostgreSQL)  
**Images:** Cloudinary  
**AI Summary:** Google Gemini 1.5 Flash  
**Frontend:** React + Vite + Tailwind CSS + Framer Motion  

---

## Limitations We're Honest About

- Amazon and Flipkart change their page structure frequently. The scraper may need updates as they do.
- The model was trained on English reviews. Mixed-language reviews (Hinglish) may be less accurate.
- Very short reviews (under 10 words) are harder to classify with high confidence — the model flags uncertainty.
- Products with fewer than 5 reviews don't get a reliable Trust Score.
- The model is 89% accurate — that means roughly 1 in 10 reviews may be mislabeled. We show confidence scores so you can judge edge cases yourself.

---

## Who This Is For

Anyone who shops online and wants a second opinion before spending their money. Especially useful for high-value purchases — electronics, appliances, furniture — where fake review manipulation is most common and most costly.

---

*Built by developers who got burned by fake reviews one too many times.*