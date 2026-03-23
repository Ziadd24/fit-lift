import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", parseInt(params.id))
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("members")
    .update(body)
    .eq("id", parseInt(params.id))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt(params.id);
  const supabase = getSupabaseAdmin();

  // Delete associated photos from storage
  const { data: photos } = await supabase
    .from("photos")
    .select("url")
    .eq("member_id", id);

  if (photos && photos.length > 0) {
    const paths = photos
      .map((p) => p.url.split("/").slice(-1)[0])
      .filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "gym-photos")
        .remove(paths);
    }
  }

  await supabase.from("members").delete().eq("id", id);
  return new NextResponse(null, { status: 204 });
}
