import { NextRequest, NextResponse } from "next/server";
import { verifyCoachAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberIdStr = searchParams.get("memberId");

  const supabase = getSupabaseAdmin();

  // If a memberId is supplied, allow client access without coach auth
  if (memberIdStr) {
    const memberId = parseInt(memberIdStr);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  }

  // No memberId — require coach auth to see all messages
  const coachId = await verifyCoachAuth(req);
  if (!coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*, members(name)")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { memberId, content, senderType = "member" } = body;

  if (!memberId || !content) {
    return NextResponse.json({ error: "memberId and content are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Determine coach_id: if coach is sending, verify coach auth
  let coachId: number | null = null;
  if (senderType === "coach") {
    const authCoachId = await verifyCoachAuth(req);
    if (!authCoachId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    coachId = authCoachId;
  } else {
    // For member messages, look up their assigned coach
    const { data: memberData } = await supabase
      .from("members")
      .select("coach_id")
      .eq("id", memberId)
      .single();
    coachId = (memberData?.coach_id ?? null) as number | null;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      coach_id: coachId,
      member_id: memberId,
      content,
      sender_type: senderType,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

