-- ============================================================
-- FitGym — Supabase Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension (just in case)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Members ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id              SERIAL PRIMARY KEY,
  membership_code TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  membership_type TEXT NOT NULL DEFAULT 'Basic',
  sub_expiry_date TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast membership code lookups (used by member login)
CREATE INDEX IF NOT EXISTS idx_members_membership_code ON members(membership_code);

-- ─── Photos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photos (
  id         SERIAL PRIMARY KEY,
  url        TEXT NOT NULL,
  caption    TEXT,
  member_id  INTEGER REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_member_id ON photos(member_id);

-- ─── Announcements ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id               SERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  content          TEXT NOT NULL,
  target_member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  is_global        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_announcements_target_member ON announcements(target_member_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_global ON announcements(is_global);

-- ─── Row Level Security ──────────────────────────────────────
-- We use the service role key on the server, so RLS is
-- intentionally restrictive for the anon key (public browsing).

ALTER TABLE members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Members: anon can read (needed for membership code lookup)
CREATE POLICY "anon_read_members"
  ON members FOR SELECT
  TO anon
  USING (true);

-- Photos: anon can read
CREATE POLICY "anon_read_photos"
  ON photos FOR SELECT
  TO anon
  USING (true);

-- Announcements: anon can read
CREATE POLICY "anon_read_announcements"
  ON announcements FOR SELECT
  TO anon
  USING (true);

-- Service role (used by Next.js API routes) bypasses RLS automatically.
-- No additional policies needed for INSERT/UPDATE/DELETE — those routes
-- are protected by the ADMIN_TOKEN check in the application layer.

-- ─── Storage Bucket ─────────────────────────────────────────
-- Create the bucket for gym photos.
-- After running this SQL, also go to:
--   Storage → gym-photos → Policies
--   and make sure public read is enabled (or use the policy below).

INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-photos', 'gym-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read of photos
CREATE POLICY "public_read_gym_photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'gym-photos');

-- Allow service role to upload
CREATE POLICY "service_upload_gym_photos"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'gym-photos');

-- Allow service role to delete
CREATE POLICY "service_delete_gym_photos"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'gym-photos');
