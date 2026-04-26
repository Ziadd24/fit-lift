import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberIdParam = searchParams.get("memberId");
  const memberId = memberIdParam ? parseInt(memberIdParam) : null;
  const isGlobal = searchParams.get("global") === "true";
  const category = searchParams.get("category");
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("photos")
    .select("id, url, caption, category, member_id, coach_id, created_at, display_order, members(name)")
    .order("display_order", { ascending: true });

  if (memberId) {
    query = query.or(`member_id.eq.${memberId},member_id.is.null`);
  } else if (isGlobal) {
    query = query.is("member_id", null);
  }

  if (category) {
    query = query.eq("category", category);
  }


  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const photos = (data || []).map((p: any) => ({
    id: p.id,
    url: p.url,
    caption: p.caption,
    category: p.category,
    member_id: p.member_id,
    coach_id: p.coach_id,
    display_order: p.display_order,
    created_at: p.created_at,
    member_name: p.members?.name ?? null,
    coach_name: null,
  }));

  return NextResponse.json(photos);
}

export async function POST(req: NextRequest) {
  if (!await verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  try {
    const body = await req.json();
    const { url, caption, category, coachId, memberId } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const photoRecord: Record<string, any> = {
      url,
      caption: caption || "",
      category: category || "gallery",
    };

    if (coachId) photoRecord.coach_id = coachId;
    if (memberId) photoRecord.member_id = memberId;

    // Only one photo per coach — delete old photos first
    if (coachId) {
      const { data: oldPhotos } = await supabase
        .from("photos")
        .select("url, id")
        .eq("coach_id", coachId);

      if (oldPhotos && oldPhotos.length > 0) {
        const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "gym-photos";
        const paths = oldPhotos.map((p) => p.url.split("/").slice(-1)[0]).filter(Boolean);
        if (paths.length > 0) await supabase.storage.from(bucket).remove(paths);
        await supabase.from("photos").delete().eq("coach_id", coachId);
      }
    }

    const { data: insertedPhoto, error: dbError } = await (supabase as any)
      .from("photos")
      .insert(photoRecord)
      .select("*, members(name), coaches!photos_coach_id_fkey(name)")
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      id: insertedPhoto.id,
      url: insertedPhoto.url,
      caption: insertedPhoto.caption,
      member_id: insertedPhoto.member_id,
      category: insertedPhoto.category || "gallery",
      coach_id: insertedPhoto.coach_id,
      created_at: insertedPhoto.created_at,
      member_name: insertedPhoto.members?.name ?? null,
      coach_name: insertedPhoto.coaches?.name ?? null,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid request" }, { status: 400 });
  }
}
