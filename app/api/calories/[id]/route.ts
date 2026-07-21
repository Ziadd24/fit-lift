import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyCoachAuth, verifyAdminAuth, verifyMemberAuth, assertCoachOwnsMember } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const coachId = verifyCoachAuth(req);
    const isAdmin = verifyAdminAuth(req);
    const authedMemberId = verifyMemberAuth(req);

    // Require at least one valid role
    if (!coachId && !isAdmin && !authedMemberId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // Fetch the log first to verify ownership
    const { data: log, error: fetchError } = await supabase
      .from("calorie_logs")
      .select("id, member_id")
      .eq("id", id)
      .single();

    if (fetchError || !log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    // Admins can delete anything
    // Coaches can delete logs for members in their roster
    // Members can only delete their own logs
    if (!isAdmin) {
      if (coachId) {
        if (!(await assertCoachOwnsMember(supabase, coachId, log.member_id))) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else if (authedMemberId) {
        if (log.member_id !== authedMemberId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    const { error } = await supabase.from("calorie_logs").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}