-- ============================================================
-- FitGym — Remove all member photos from database
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Note: This only deletes database records. Storage files
-- in the gym-photos bucket must be cleaned manually if desired.
-- ============================================================

-- Delete all photos with category = 'member'
DELETE FROM photos WHERE category = 'member';

-- Optional: Also remove any photos linked to members via member_id
-- that might not have category set correctly
DELETE FROM photos WHERE member_id IS NOT NULL;
