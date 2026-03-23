import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { membershipCode } = await req.json();

  if (!membershipCode) {
    return NextResponse.json(
      { error: "membershipCode is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("membership_code", membershipCode)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
