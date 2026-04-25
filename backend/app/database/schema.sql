-- Run this in Neon Console → SQL Editor → Run

CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key     TEXT UNIQUE NOT NULL,
  url           TEXT NOT NULL,
  platform      TEXT,
  title         TEXT,
  price         TEXT,
  image_url     TEXT,
  rating        FLOAT,
  total_reviews INT,
  trust_score   FLOAT,
  fake_count    INT DEFAULT 0,
  real_count    INT DEFAULT 0,
  verdict       TEXT,
  gemini_summary JSONB,
  scraped_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
  reviewer_name   TEXT,
  rating          INT,
  title           TEXT,
  body            TEXT NOT NULL,
  review_date     TEXT,
  verified        BOOLEAN DEFAULT FALSE,
  is_fake         BOOLEAN,
  fake_confidence FLOAT,
  fake_reasons    TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS searches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url        TEXT NOT NULL,
  cache_key  TEXT,
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_cache_key ON products(cache_key);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_fake    ON reviews(is_fake);
CREATE INDEX IF NOT EXISTS idx_searches_created   ON searches(created_at DESC);