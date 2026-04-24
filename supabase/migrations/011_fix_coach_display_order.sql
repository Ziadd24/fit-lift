-- ============================================================
-- FitGym — Fix coach photos display_order values
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Check current display_order values for coach photos
SELECT id, coach_id, caption, display_order, created_at
FROM photos
WHERE coach_id IS NOT NULL
ORDER BY coach_id, display_order;

-- If display_order is 0 or NULL for coach photos, run this:
UPDATE photos
SET display_order = sub.rn
FROM (
  SELECT id, coach_id, ROW_NUMBER() OVER (PARTITION BY coach_id ORDER BY created_at ASC, id ASC) AS rn
  FROM photos
  WHERE coach_id IS NOT NULL
) AS sub
WHERE photos.id = sub.id;
