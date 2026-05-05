import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

const ALLOWED_SETTINGS_KEYS = new Set([
  "schedule_image_url", "gym_name", "gym_phone", "gym_address",
  "gym_email", "opening_hours", "social_media_links",
  "popup_enabled", "popup_title", "popup_message",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key") || "schedule_image_url";
  const supabase = getSupabaseAdmin();
  const { data, error } = await (supabase as any).from("settings").select("key, value").eq("key", key).single();
  if (error) return NextResponse.json({ value: "" });
  return NextResponse.json({ value: data?.value || "" });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { keys } = body;
  if (!Array.isArray(keys) || keys.length === 0) {
    return NextResponse.json({ error: "keys array required" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await (supabase as any)
    .from("settings")
    .select("key, value")
    .in("key", keys);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const result: Record<string, string> = {};
  for (const row of (data || [])) {
    result[row.key] = row.value || "";
  }
  for (const key of keys) {
    if (!(key in result)) result[key] = "";
  }
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  if (!await verifyAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { key = "schedule_image_url", value } = body;
  if (!ALLOWED_SETTINGS_KEYS.has(key)) {
    return NextResponse.json({ error: "Invalid setting key" }, { status: 400 });
  }
  if (typeof value !== "string" || value.length > 5000) {
    return NextResponse.json({ error: "Setting value too long" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { error } = await (supabase as any).from("settings").upsert({ key, value: value.slice(0, 5000), updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, key, value });
}