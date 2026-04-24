-- ============================================================
-- FitGym — Add display_order to coaches for admin reordering
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Add display_order column
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows with incremental order
UPDATE coaches
SET display_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM coaches
) AS sub
WHERE coaches.id = sub.id;

-- Create index on display_order
CREATE INDEX IF NOT EXISTS idx_coaches_display_order ON coaches(display_order);
