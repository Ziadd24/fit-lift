import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt(params.id);
  const supabase = getSupabaseAdmin();
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "gym-photos";

  const { data: photo } = await supabase
    .from("photos")
    .select("url")
    .eq("id", id)
    .single();

  if (photo) {
    const urlParts = photo.url.split("/");
    const filename = urlParts[urlParts.length - 1];
    if (filename) {
      await supabase.storage.from(bucket).remove([filename]);
    }
  }

  await supabase.from("photos").delete().eq("id", id);
  return new NextResponse(null, { status: 204 });
}