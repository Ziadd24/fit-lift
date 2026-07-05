-- ============================================================
-- FitGym — Coach Packages Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS coach_packages (
  id SERIAL PRIMARY KEY,
  sessions INTEGER NOT NULL,
  label_ar TEXT NOT NULL,
  label_en TEXT NOT NULL,
  price INTEGER NOT NULL,
  popular BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_coach_packages_display_order ON coach_packages(display_order);

-- Allow public read of coach packages
ALTER TABLE coach_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_coach_packages"
  ON coach_packages FOR SELECT
  TO anon
  USING (true);

-- Insert default packages
INSERT INTO coach_packages (sessions, label_ar, label_en, price, popular, display_order)
VALUES 
  (10, '10 جلسات', '10 Sessions', 1500, false, 1),
  (15, '15 جلسة', '15 Sessions', 1900, false, 2),
  (20, '20 جلسة', '20 Sessions', 2400, true, 3),
  (30, '30 جلسة', '30 Sessions', 3400, false, 4)
ON CONFLICT DO NOTHING;
