-- ============================================================
-- FitGym — Add display_order to bundles for admin reordering
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Add display_order column
ALTER TABLE bundles
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows with incremental order based on price
UPDATE bundles
SET display_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY price ASC, id ASC) AS rn
  FROM bundles
) AS sub
WHERE bundles.id = sub.id;

-- Drop old price index and create display_order index
DROP INDEX IF EXISTS idx_bundles_price;
CREATE INDEX IF NOT EXISTS idx_bundles_display_order ON bundles(display_order);
