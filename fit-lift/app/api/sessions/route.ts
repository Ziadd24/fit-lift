import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyCoachAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const coachId = await verifyCoachAuth(req);
  if (!coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // YYYY-MM-DD

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("sessions")
    .select("*, members(name)")
    .eq("coach_id", coachId);

  if (date) {
    // Filter by date range (start of day to end of day)
    const startDate = `${date}T00:00:00Z`;
    const endDate = `${date}T23:59:59Z`;
    query = query.gte("scheduled_at", startDate).lte("scheduled_at", endDate);
  }

  const { data, error } = await query.order("scheduled_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Format response to include member_name at top level
  const sessions = (data || []).map((s: any) => ({
    ...s,
    member_name: s.members?.name || "Guest Client",
  }));

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const coachId = await verifyCoachAuth(req);
  if (!coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { memberId, sessionType, scheduledAt, durationMinutes, notes } = body;

  if (!sessionType || !scheduledAt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      coach_id: coachId,
      member_id: memberId || null,
      session_type: sessionType,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes || 60,
      notes: notes || null,
      status: "scheduled",
    })
    .select("*, members(name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    member_name: (data as any).members?.name || "Guest Client",
  });
}

export async function PUT(req: NextRequest) {
  const coachId = await verifyCoachAuth(req);
  if (!coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", id)
    .eq("coach_id", coachId) // Ensure coach owns the session
    .select("*, members(name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    member_name: (data as any).members?.name || "Guest Client",
  });
}
