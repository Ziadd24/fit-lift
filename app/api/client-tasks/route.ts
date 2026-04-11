import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    const supabase = getSupabaseAdmin();
    let query = supabase.from("client_tasks").select("*").order("created_at", { ascending: true });

    if (memberId) query = query.eq("member_id", parseInt(memberId));

    const { data: tasks, error } = await query;
    if (error) throw error;

    return NextResponse.json(tasks ?? []);
  } catch (error) {
    console.error("GET /api/client-tasks Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseAdmin();
    const { data: inserted, error } = await supabase
      .from("client_tasks")
      .insert({
        member_id: body.member_id,
        type: body.type,
        title: body.title,
        status: body.status || "todo",
        duration: body.duration || "",
        assigned_by: body.assigned_by || "System",
        coach_assigned: body.coach_assigned || false,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(inserted);
  } catch (error) {
    console.error("POST /api/client-tasks Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

