import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberIdParam = searchParams.get("memberId");
  const memberId = memberIdParam ? parseInt(memberIdParam) : null;
  const isGlobal = searchParams.get("global") === "true";

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("photos")
    .select("*, members(name)")
    .order("created_at", { ascending: false });

  if (memberId) {
    query = query.or(`member_id.eq.${memberId},member_id.is.null`);
  } else if (isGlobal) {
    query = query.is("member_id", null);
  }


  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const photos = (data || []).map((p: any) => ({
    id: p.id,
    url: p.url,
    caption: p.caption,
    member_id: p.member_id,
    created_at: p.created_at,
    member_name: p.members?.name ?? null,
  }));

  return NextResponse.json(photos);
}
