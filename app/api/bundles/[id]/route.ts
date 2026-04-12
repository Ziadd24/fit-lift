import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { data, error } = await supabase.from("bundles").update(body).eq("id", parseInt(params.id)).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("bundles").delete().eq("id", parseInt(params.id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}