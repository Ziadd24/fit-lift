-- ============================================================
-- FitGym — Bundles Table Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── Bundles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bundles (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  price       INTEGER NOT NULL DEFAULT 0,
  period      TEXT NOT NULL DEFAULT '/ mo',
  features    TEXT[] NOT NULL DEFAULT '{}',
  highlight   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast ordering
CREATE INDEX IF NOT EXISTS idx_bundles_price ON bundles(price);

-- Row Level Security
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;

-- Bundles: anon can read (needed for public pricing page)
CREATE POLICY "anon_read_bundles"
  ON bundles FOR SELECT
  TO anon
  USING (true);

-- Service role can do everything (managed via API routes)
CREATE POLICY "service_full_bundles"
  ON bundles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
