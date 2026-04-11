import { NextRequest, NextResponse } from "next/server";
import { verifyCoachAuth, verifyAdminAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sanitizeHtml } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberIdStr = searchParams.get("memberId");
  const supabase = getSupabaseAdmin();

  if (memberIdStr) {
    const memberId = parseInt(memberIdStr);
    if (isNaN(memberId)) return NextResponse.json({ error: "Invalid memberId" }, { status: 400 });
    const coachId = verifyCoachAuth(req);
    const isAdmin = verifyAdminAuth(req);
    if (!coachId && !isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase.from("messages").select("*").eq("member_id", memberId).order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  const coachId = verifyCoachAuth(req);
  if (!coachId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("messages").select("*, members(name)").eq("coach_id", coachId).order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { memberId, content, senderType = "member" } = body;
  if (!memberId || !content) return NextResponse.json({ error: "memberId and content are required" }, { status: 400 });
  if (typeof content !== "string" || content.length > 5000) {
    return NextResponse.json({ error: "Content too long (max 5000 characters)" }, { status: 400 });
  }
  const sanitizedContent = sanitizeHtml(content);
  const supabase = getSupabaseAdmin();
  let coachId: number | null = null;

  if (senderType === "coach") {
    const authCoachId = verifyCoachAuth(req);
    if (!authCoachId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    coachId = authCoachId;
  } else {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const memberCode = authHeader.slice(7);
    const { data: memberData } = await supabase.from("members").select("id, coach_id").eq("id", memberId).eq("membership_code", memberCode).single();
    if (!memberData) return NextResponse.json({ error: "Unauthorized: invalid membership code" }, { status: 401 });
    coachId = (memberData?.coach_id ?? null) as number | null;
  }

  const { data, error } = await supabase.from("messages").insert({
    coach_id: coachId, member_id: memberId, content: sanitizedContent, sender_type: senderType,
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}