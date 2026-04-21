import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyCoachAuth, verifyAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const coachId = verifyCoachAuth(req);
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const supabase = getSupabaseAdmin();

    if (memberId) {
      const parsedId = parseInt(memberId);
      if (coachId) {
        // Verify member belongs to this coach
        const { data: member } = await supabase
          .from("members")
          .select("id")
          .eq("id", parsedId)
          .eq("coach_id", coachId)
          .single();
        if (!member) return NextResponse.json({ error: "Member not in your roster" }, { status: 403 });
      }

      const { data, error } = await supabase
        .from("client_workouts")
        .select("*")
        .eq("member_id", parsedId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return NextResponse.json(data ?? []);
    }

    if (!coachId) return NextResponse.json({ error: "memberId is required for clients" }, { status: 400 });

    // No memberId: return workouts for all of this coach's members
    const { data: coachMembers } = await supabase
      .from("members")
      .select("id")
      .eq("coach_id", coachId);
    const memberIds = (coachMembers || []).map((m: any) => m.id);
    if (memberIds.length === 0) return NextResponse.json([]);

    const { data, error } = await supabase
      .from("client_workouts")
      .select("*")
      .in("member_id", memberIds)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const coachId = verifyCoachAuth(req);
    const body = await req.json();
    const title = (body.title || "").slice(0, 200);
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
    if (!body.member_id || typeof body.member_id !== "number") {
      return NextResponse.json({ error: "Valid member_id is required" }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("client_workouts").insert({
      member_id: body.member_id, title,
      coach_assigned: body.coach_assigned || false,
      status: body.status || "todo",
      duration: (body.duration || "45 min").slice(0, 50),
      calories: typeof body.calories === "number" ? Math.min(body.calories, 99999) : 300,
      muscles: Array.isArray(body.muscles) ? body.muscles.slice(0, 20).map((m: string) => String(m).slice(0, 50)) : [],
      difficulty: (body.difficulty || "Medium").slice(0, 50),
      sets: Array.isArray(body.sets) ? body.sets.slice(0, 50) : [],
    }).select("*").single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE all workouts (admin only)
export async function DELETE(req: NextRequest) {
  try {
    verifyAdminAuth(req);
    const supabase = getSupabaseAdmin();
    const { error, count } = await supabase.from("client_workouts").delete({ count: 'exact' }).neq("id", 0);
    if (error) throw error;
    return NextResponse.json({ success: true, deleted: count });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}