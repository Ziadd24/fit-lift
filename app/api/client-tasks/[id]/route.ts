import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeaders = req.headers;
    if (!authHeaders.get("authorization")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const supabase = getSupabaseAdmin();
    const { data: updated, error } = await supabase
      .from("client_tasks")
      .update(body)
      .eq("id", parseInt(params.id))
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/client-tasks Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeaders = req.headers;
    if (!authHeaders.get("authorization")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("client_tasks").delete().eq("id", parseInt(params.id));

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/client-tasks Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
