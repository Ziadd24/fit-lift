-- Create transformations table
CREATE TABLE IF NOT EXISTS transformations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_name TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL,
  weight_lost_kg NUMERIC,
  muscle_gained_kg NUMERIC,
  before_image_url TEXT,
  after_image_url TEXT,
  coach_id BIGINT REFERENCES coaches(id) ON DELETE SET NULL,
  is_visible BOOLEAN DEFAULT true NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for visibility and display order
CREATE INDEX IF NOT EXISTS idx_transformations_visible_order ON transformations(is_visible, display_order);

-- Storage bucket for transformations
INSERT INTO storage.buckets (id, name, public)
VALUES ('transformations', 'transformations', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read of transformations bucket objects
CREATE POLICY "public_read_transformations"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'transformations');

-- Allow service role to manage transformations bucket objects
CREATE POLICY "service_manage_transformations"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'transformations');

-- Enable Row Level Security (RLS) on transformations table
ALTER TABLE transformations ENABLE ROW LEVEL SECURITY;

-- Allow public read of transformations table
CREATE POLICY "anon_read_transformations"
  ON transformations FOR SELECT
  TO anon
  USING (true);

-- Allow service role full access
CREATE POLICY "service_full_transformations"
  ON transformations FOR ALL
  TO service_role
  USING (true);

-- Enable realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE transformations;
