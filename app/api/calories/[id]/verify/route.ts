import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyCoachAuth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const coachId = await verifyCoachAuth(req);
  if (!coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logId = parseInt(idParam);
  if (isNaN(logId)) {
    return NextResponse.json({ error: "Invalid log ID" }, { status: 400 });
  }

  const body = await req.json();
  const { action, coach_note, edited_result } = body;

  if (!action || !["verified", "edited"].includes(action)) {
    return NextResponse.json({ error: "action must be 'verified' or 'edited'" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const updatePayload: Record<string, any> = {
    verified_status: action,
    coach_note: coach_note || null,
  };

  // If coach edited the macros, update the result JSONB too
  if (action === "edited" && edited_result) {
    updatePayload.result = edited_result;
  }

  const { data, error } = await supabase
    .from("calorie_logs")
    .update(updatePayload)
    .eq("id", logId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
