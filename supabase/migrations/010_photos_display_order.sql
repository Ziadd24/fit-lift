-- ============================================================
-- FitGym — Add display_order to photos for admin reordering
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Add display_order column
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows with incremental order
-- Gallery photos (no coach_id, category is null or 'gallery')
UPDATE photos
SET display_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM photos
  WHERE coach_id IS NULL AND (category IS NULL OR category = 'gallery')
) AS sub
WHERE photos.id = sub.id;

-- Coach photos (grouped by coach_id)
UPDATE photos
SET display_order = sub.rn
FROM (
  SELECT id, coach_id, ROW_NUMBER() OVER (PARTITION BY coach_id ORDER BY created_at ASC, id ASC) AS rn
  FROM photos
  WHERE coach_id IS NOT NULL
) AS sub
WHERE photos.id = sub.id;

-- Create index on display_order
CREATE INDEX IF NOT EXISTS idx_photos_display_order ON photos(display_order);
