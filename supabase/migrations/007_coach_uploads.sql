-- ============================================================
-- FitGym — Coach Uploads Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── Coach Uploads Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_uploads (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' or 'pdf'
  file_size INTEGER NOT NULL,
  category TEXT NOT NULL, -- 'training_program' or 'diet_plan'
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_coach_uploads_coach_id ON coach_uploads(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_uploads_member_id ON coach_uploads(member_id);
CREATE INDEX IF NOT EXISTS idx_coach_uploads_category ON coach_uploads(category);

-- ─── Storage Bucket for Coach Uploads ───────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('coach-uploads', 'coach-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read of coach uploads
CREATE POLICY "public_read_coach_uploads"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'coach-uploads');

-- Allow service role to upload
CREATE POLICY "service_upload_coach_uploads"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'coach-uploads');

-- Allow service role to delete
CREATE POLICY "service_delete_coach_uploads"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'coach-uploads');

-- ─── Row Level Security ──────────────────────────────────────
ALTER TABLE coach_uploads ENABLE ROW LEVEL SECURITY;

-- Public read (filtered by member_id in API)
CREATE POLICY "anon_read_coach_uploads"
  ON coach_uploads FOR SELECT
  TO anon
  USING (true);

-- Service role full access
CREATE POLICY "service_full_coach_uploads"
  ON coach_uploads FOR ALL
  TO service_role
  USING (true);

-- ─── Realtime Support ───────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE coach_uploads;
