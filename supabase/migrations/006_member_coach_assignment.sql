-- Add coach ownership to members so coach roster assignment works.
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS coach_id BIGINT REFERENCES coaches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_members_coach_id ON members(coach_id);
