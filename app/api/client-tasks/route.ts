import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyCoachAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const coachId = verifyCoachAuth(req);
    if (!coachId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const supabase = getSupabaseAdmin();
    let query = supabase.from("client_tasks").select("*").order("created_at", { ascending: true });
    if (memberId) query = query.eq("member_id", parseInt(memberId));
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const coachId = verifyCoachAuth(req);
    if (!coachId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const title = (body.title || "").slice(0, 200);
    const type = (body.type || "").slice(0, 50);
    if (!title || !type) return NextResponse.json({ error: "title and type are required" }, { status: 400 });
    if (!body.member_id || typeof body.member_id !== "number") {
      return NextResponse.json({ error: "Valid member_id is required" }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("client_tasks").insert({
      member_id: body.member_id, type, title,
      status: body.status || "todo",
      duration: (body.duration || "").slice(0, 50),
      assigned_by: (body.assigned_by || "System").slice(0, 100),
      coach_assigned: body.coach_assigned || false,
    }).select("*").single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}