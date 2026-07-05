import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyCoachAuth, verifyMemberAuth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const coachId = verifyCoachAuth(req);
    const authedMemberId = verifyMemberAuth(req);

    if (!coachId && !authedMemberId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const workoutId = parseInt(idParam);
    if (isNaN(workoutId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // Verify ownership before allowing update
    const { data: workout, error: fetchErr } = await supabase
      .from("client_workouts")
      .select("id, member_id")
      .eq("id", workoutId)
      .single();

    if (fetchErr || !workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    // Coach must own the member, member must own the workout
    if (coachId) {
      const { data: member } = await supabase
        .from("members")
        .select("id")
        .eq("id", workout.member_id)
        .eq("coach_id", coachId)
        .single();
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else if (authedMemberId && workout.member_id !== authedMemberId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Whitelist allowed fields — prevent mass-assignment
    const updatePayload: Record<string, any> = {};
    if (body.title !== undefined) updatePayload.title = String(body.title).slice(0, 200);
    if (body.status !== undefined) updatePayload.status = String(body.status).slice(0, 50);
    if (body.duration !== undefined) updatePayload.duration = String(body.duration).slice(0, 50);
    if (body.calories !== undefined) updatePayload.calories = typeof body.calories === "number" ? Math.min(body.calories, 99999) : undefined;
    if (body.muscles !== undefined) updatePayload.muscles = Array.isArray(body.muscles) ? body.muscles.slice(0, 20).map((m: string) => String(m).slice(0, 50)) : undefined;
    if (body.difficulty !== undefined) updatePayload.difficulty = String(body.difficulty).slice(0, 50);
    if (body.sets !== undefined) updatePayload.sets = Array.isArray(body.sets) ? body.sets.slice(0, 50) : undefined;
    if (body.coach_assigned !== undefined) updatePayload.coach_assigned = !!body.coach_assigned;

    // Remove undefined values
    Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("client_workouts")
      .update(updatePayload)
      .eq("id", workoutId)
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
    const workoutId = parseInt(idParam);
    if (isNaN(workoutId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // Verify ownership before allowing delete
    const { data: workout, error: fetchErr } = await supabase
      .from("client_workouts")
      .select("id, member_id")
      .eq("id", workoutId)
      .single();

    if (fetchErr || !workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    if (coachId) {
      const { data: member } = await supabase
        .from("members")
        .select("id")
        .eq("id", workout.member_id)
        .eq("coach_id", coachId)
        .single();
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else if (authedMemberId && workout.member_id !== authedMemberId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("client_workouts").delete().eq("id", workoutId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}