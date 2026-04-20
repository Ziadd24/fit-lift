import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth, verifyCoachAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const coachId = verifyCoachAuth(req);
  const isAdmin = verifyAdminAuth(req);
  if (!coachId && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, title, description } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: updatedUpload, error: dbError } = await supabase
    .from("coach_uploads")
    .update({ title: title || null, description: description || null })
    .eq("id", id)
    .select("*, members(name), coaches(name)")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({
    id: updatedUpload.id,
    file_url: updatedUpload.file_url,
    file_name: updatedUpload.file_name,
    file_type: updatedUpload.file_type,
    file_size: updatedUpload.file_size,
    category: updatedUpload.category,
    title: updatedUpload.title,
    description: updatedUpload.description,
    member_id: updatedUpload.member_id,
    coach_id: updatedUpload.coach_id,
    created_at: updatedUpload.created_at,
    member_name: updatedUpload.members?.name ?? null,
    coach_name: updatedUpload.coaches?.name ?? null,
  });
}
