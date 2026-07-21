import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyCoachAuth, verifyMemberAuth, assertCoachOwnsMember } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const coachId = verifyCoachAuth(req);
    const authedMemberId = verifyMemberAuth(req);

    if (!coachId && !authedMemberId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const taskId = parseInt(idParam);
    if (isNaN(taskId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // Verify ownership before allowing update
    const { data: task, error: fetchErr } = await supabase
      .from("client_tasks")
      .select("id, member_id")
      .eq("id", taskId)
      .single();

    if (fetchErr || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Coach must own the member, member must own the task
    if (coachId) {
      if (!(await assertCoachOwnsMember(supabase, coachId, task.member_id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else if (authedMemberId && task.member_id !== authedMemberId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Whitelist allowed fields — prevent mass-assignment
    const updatePayload: Record<string, any> = {};
    if (body.title !== undefined) updatePayload.title = String(body.title).slice(0, 200);
    if (body.type !== undefined) updatePayload.type = String(body.type).slice(0, 50);
    if (body.status !== undefined) updatePayload.status = String(body.status).slice(0, 50);
    if (body.duration !== undefined) updatePayload.duration = String(body.duration).slice(0, 50);
    if (body.assigned_by !== undefined) updatePayload.assigned_by = String(body.assigned_by).slice(0, 100);
    if (body.coach_assigned !== undefined) updatePayload.coach_assigned = !!body.coach_assigned;

    // Remove undefined values
    Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("client_tasks")
      .update(updatePayload)
      .eq("id", taskId)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const coachId = verifyCoachAuth(req);
    const authedMemberId = verifyMemberAuth(req);

    if (!coachId && !authedMemberId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const taskId = parseInt(idParam);
    if (isNaN(taskId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // Verify ownership before allowing delete
    const { data: task, error: fetchErr } = await supabase
      .from("client_tasks")
      .select("id, member_id")
      .eq("id", taskId)
      .single();

    if (fetchErr || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (coachId) {
      if (!(await assertCoachOwnsMember(supabase, coachId, task.member_id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else if (authedMemberId && task.member_id !== authedMemberId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("client_tasks").delete().eq("id", taskId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}