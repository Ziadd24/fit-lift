import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberIdParam = searchParams.get("memberId");
  const memberId = memberIdParam ? parseInt(memberIdParam) : null;
  const isGlobal = searchParams.get("global") === "true";
  const category = searchParams.get("category");
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("photos")
    .select("id, url, caption, category, member_id, coach_id, created_at, display_order, members(name)")
    .order("display_order", { ascending: true });

  if (memberId) {
    query = query.or(`member_id.eq.${memberId},member_id.is.null`);
  } else if (isGlobal) {
    query = query.is("member_id", null);
  }

  if (category) {
    query = query.eq("category", category);
  }


  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const photos = (data || []).map((p: any) => ({
    id: p.id,
    url: p.url,
    caption: p.caption,
    category: p.category,
    member_id: p.member_id,
    coach_id: p.coach_id,
    display_order: p.display_order,
    created_at: p.created_at,
    member_name: p.members?.name ?? null,
    coach_name: null,
  }));

  return NextResponse.json(photos);
}
