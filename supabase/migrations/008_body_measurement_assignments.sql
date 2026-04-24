-- Add grouped assignment support to coach_uploads

ALTER TABLE coach_uploads
  ADD COLUMN IF NOT EXISTS assignment_id TEXT,
  ADD COLUMN IF NOT EXISTS assignment_title TEXT,
  ADD COLUMN IF NOT EXISTS assignment_kind TEXT NOT NULL DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS coach_notes TEXT,
  ADD COLUMN IF NOT EXISTS measurement_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS assignment_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'coach_uploads_assignment_kind_check'
  ) THEN
    ALTER TABLE coach_uploads
      ADD CONSTRAINT coach_uploads_assignment_kind_check
      CHECK (assignment_kind IN ('upload', 'body_measurement_assignment'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'coach_uploads_assignment_status_check'
  ) THEN
    ALTER TABLE coach_uploads
      ADD CONSTRAINT coach_uploads_assignment_status_check
      CHECK (assignment_status IN ('pending', 'submitted', 'reviewed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_coach_uploads_assignment_id ON coach_uploads(assignment_id);
CREATE INDEX IF NOT EXISTS idx_coach_uploads_assignment_kind ON coach_uploads(assignment_kind);
CREATE INDEX IF NOT EXISTS idx_coach_uploads_assignment_status ON coach_uploads(assignment_status);
