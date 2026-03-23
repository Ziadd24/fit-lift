import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser-safe client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client (uses service role key — never expose to browser)
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
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
