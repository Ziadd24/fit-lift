import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth, verifyCoachAuth, verifyMemberAuth, assertCoachOwnsMember } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const coachId = verifyCoachAuth(req);
  const isAdmin = verifyAdminAuth(req);
  const authedMemberId = verifyMemberAuth(req);

  if (!coachId && !isAdmin && !authedMemberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const memberIdStr = searchParams.get("member_id");
  const coachIdStr = searchParams.get("coach_id");
  const category = searchParams.get("category");

  if (!memberIdStr && !coachIdStr) {
    return NextResponse.json({ error: "member_id or coach_id is required" }, { status: 400 });
  }

  // Members can only view their own uploads
  if (authedMemberId && !coachId && !isAdmin) {
    if (memberIdStr && parseInt(memberIdStr) !== authedMemberId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const supabase = getSupabaseAdmin();

  // Coaches can only see uploads for members in their roster
  if (coachId && !isAdmin && memberIdStr) {
    const parsedMemberId = parseInt(memberIdStr);
    if (!isNaN(parsedMemberId)) {
      if (!(await assertCoachOwnsMember(supabase, coachId, parsedMemberId))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  let query = supabase
    .from("coach_uploads")
    .select("*, members(name), coaches(name)")
    .order("created_at", { ascending: false });

  if (memberIdStr) {
    const memberId = parseInt(memberIdStr);
    if (isNaN(memberId)) {
      return NextResponse.json({ error: "Invalid member_id" }, { status: 400 });
    }
    // If member is authed, force their own ID
    if (authedMemberId && !coachId && !isAdmin) {
      query = query.eq("member_id", authedMemberId);
    } else {
      query = query.eq("member_id", memberId);
    }
  }

  if (coachIdStr) {
    const coachIdParam = parseInt(coachIdStr);
    if (isNaN(coachIdParam)) {
      return NextResponse.json({ error: "Invalid coach_id" }, { status: 400 });
    }
    query = query.eq("coach_id", coachIdParam);
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
