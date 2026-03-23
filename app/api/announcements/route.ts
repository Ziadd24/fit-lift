import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberIdParam = searchParams.get("memberId");
  const memberId = memberIdParam ? parseInt(memberIdParam) : null;

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("announcements")
    .select("*, members(name)")
    .order("created_at", { ascending: false });

  if (memberId) {
    query = query.or(`is_global.eq.true,target_member_id.eq.${memberId}`);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const announcements = (data || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    target_member_id: a.target_member_id,
    is_global: a.is_global,
    created_at: a.created_at,
    target_member_name: a.members?.name ?? null,
  }));

  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, content, is_global, target_member_id } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title,
      content,
      is_global: is_global ?? true,
      target_member_id: target_member_id || null,
    })
    .select("*, members(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    {
      id: data.id,
      title: data.title,
      content: data.content,
      target_member_id: data.target_member_id,
      is_global: data.is_global,
      created_at: data.created_at,
      target_member_name: (data as any).members?.name ?? null,
    },
    { status: 201 }
  );
}
