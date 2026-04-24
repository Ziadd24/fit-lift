import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { swaps } = body;

  if (!Array.isArray(swaps) || swaps.length === 0) {
    return NextResponse.json({ error: "Invalid swaps array" }, { status: 400 });
  }

  for (const swap of swaps) {
    const { id, display_order } = swap;
    if (!id || typeof display_order !== "number") {
      return NextResponse.json({ error: "Each swap must have id and display_order" }, { status: 400 });
    }
  }

  const updatePromises = swaps.map((swap: { id: number; display_order: number }) =>
    supabase.from("photos").update({ display_order: swap.display_order }).eq("id", swap.id)
  );

  const results = await Promise.all(updatePromises);

  const firstError = results.find((r) => r.error);
  if (firstError) {
    return NextResponse.json({ error: firstError.error?.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
