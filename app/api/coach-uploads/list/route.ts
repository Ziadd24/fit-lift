import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const memberIdStr = searchParams.get("member_id");
  const coachIdStr = searchParams.get("coach_id");
  const category = searchParams.get("category");

  if (!memberIdStr && !coachIdStr) {
    return NextResponse.json({ error: "member_id or coach_id is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("coach_uploads")
    .select("*, members(name), coaches(name)")
    .order("created_at", { ascending: false });

  if (memberIdStr) {
    const memberId = parseInt(memberIdStr);
    if (isNaN(memberId)) {
      return NextResponse.json({ error: "Invalid member_id" }, { status: 400 });
    }
    query = query.eq("member_id", memberId);
  }

  if (coachIdStr) {
    const coachId = parseInt(coachIdStr);
    if (isNaN(coachId)) {
      return NextResponse.json({ error: "Invalid coach_id" }, { status: 400 });
    }
    query = query.eq("coach_id", coachId);
  }

  if (category && (category === "training_program" || category === "diet_plan")) {
    query = query.eq("category", category);
  }

  const { data: uploads, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ uploads: uploads || [] });
}
