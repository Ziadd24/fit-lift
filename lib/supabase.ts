import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser-safe client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client (uses service role key — never expose to browser)
// Cached singleton to avoid creating a new client on every request
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;
export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  _supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
  return _supabaseAdmin;
}

export type Member = {
  id: number;
  membership_code: string;
  name: string;
  email: string | null;
  phone: string | null;
  membership_type: string;
  sub_expiry_date: string;
  created_at: string;
};

export type Photo = {
  id: number;
  url: string;
  caption: string | null;
  member_id: number | null;
  created_at: string;
  member_name?: string | null;
};

export type Announcement = {
  id: number;
  title: string;
  content: string;
  target_member_id: number | null;
  is_global: boolean;
  created_at: string;
  target_member_name?: string | null;
};

export type Coach = {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  created_at: string;
};

export type Message = {
  id: number;
  coach_id: number;
  member_id: number;
  content: string | null;
  sender_type: "coach" | "member";
  image_url: string | null;
  created_at: string;
  member_name?: string;
};

export type Session = {
  id: number;
  coach_id: number;
  member_id: number | null;
  session_type: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
  member_name?: string;
};