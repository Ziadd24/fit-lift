import { NextRequest, NextResponse } from "next/server";
import { verifyCoachAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const coachId = await verifyCoachAuth(req);
  if (!coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const memberIdStr = searchParams.get("memberId");
  
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("messages")
    .select("*, members(name)")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: true });

  if (memberIdStr) {
    query = query.eq("member_id", parseInt(memberIdStr));
  } else {
    // If no specific member, return no messages or return recent global ones (for overview).
    // Usually messages are tied to a specific conversation
    return NextResponse.json([]);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const coachId = await verifyCoachAuth(req);
  if (!coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId, content, senderType = "coach" } = await req.json();
  const supabase = getSupabaseAdmin();

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
