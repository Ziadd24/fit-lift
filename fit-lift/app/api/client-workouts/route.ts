import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    const supabase = getSupabaseAdmin();
    let query = supabase.from("client_workouts").select("*").order("created_at", { ascending: true });

    if (memberId) query = query.eq("member_id", parseInt(memberId));

    const { data: workouts, error } = await query;
    if (error) throw error;

    return NextResponse.json(workouts ?? []);
  } catch (error) {
    console.error("GET /api/client-workouts Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseAdmin();
    const { data: inserted, error } = await supabase
      .from("client_workouts")
      .insert({
        member_id: body.member_id,
        title: body.title,
        coach_assigned: body.coach_assigned || false,
        status: body.status || "todo",
        duration: body.duration || "45 min",
        calories: body.calories || 300,
        muscles: body.muscles || [],
        difficulty: body.difficulty || "Medium",
        sets: body.sets || [],
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(inserted);
  } catch (error) {
    console.error("POST /api/client-workouts Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
