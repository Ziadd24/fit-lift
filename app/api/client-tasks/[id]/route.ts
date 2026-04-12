import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyCoachAuth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const coachId = verifyCoachAuth(req);
    if (!coachId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("client_tasks").update(body).eq("id", parseInt(params.id)).select("*").single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const coachId = verifyCoachAuth(req);
    if (!coachId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("client_tasks").delete().eq("id", parseInt(params.id));
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}