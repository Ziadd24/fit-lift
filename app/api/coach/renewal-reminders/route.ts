import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyCoachAuth } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  const coachId = await verifyCoachAuth(req);
  if (!coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const memberIds = Array.isArray(body?.memberIds)
    ? body.memberIds.map((id: unknown) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0)
    : [];

  if (memberIds.length === 0) {
    return NextResponse.json({ error: "memberIds are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: members, error: memberError } = await supabase
    .from("members")
    .select("id, name, coach_id")
    .in("id", memberIds)
    .eq("coach_id", coachId);

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  if (!members || members.length === 0) {
    return NextResponse.json({ error: "No eligible members found" }, { status: 404 });
  }

  const now = new Date().toLocaleDateString();
  const rows = members.map((member) => ({
    title: sanitizeHtml("Membership renewal reminder"),
    content: sanitizeHtml(`Your membership needs renewal. Please contact your coach or the gym front desk to renew. Sent on ${now}.`),
    is_global: false,
    target_member_id: member.id,
  }));

  const { error: insertError } = await supabase.from("announcements").insert(rows);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, sent: members.length });
}
