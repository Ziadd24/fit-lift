import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key") || "schedule_image_url";
  const supabase = getSupabaseAdmin();
  const { data, error } = await (supabase as any)
    .from("settings")
    .select("key, value")
    .eq("key", key)
    .single();
  if (error) return NextResponse.json({ value: "" });
  return NextResponse.json({ value: data?.value || "" });
}

export async function PUT(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { key = "schedule_image_url", value } = body;
  const supabase = getSupabaseAdmin();
  const { error } = await (supabase as any)
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, key, value });
}