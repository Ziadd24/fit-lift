import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const caption = (formData.get("caption") as string) || null;
  const category = (formData.get("category") as string) || "gallery";
  const coachIdStr = formData.get("coachId") as string | null;
  const coachId = coachIdStr ? parseInt(coachIdStr) : null;
  const memberIdStr = formData.get("memberId") as string | null;
  const memberId = memberIdStr ? parseInt(memberIdStr) : null;

  const supabase = getSupabaseAdmin();
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "gym-photos";
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filename, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
  const url = urlData.publicUrl;

  const photoRecord: Record<string, any> = {
    url,
    caption,
    category,
  };
  if (coachId) photoRecord.coach_id = coachId;
  if (memberId) photoRecord.member_id = memberId;

  const { data: insertedPhoto, error: dbError } = await (supabase as any)
    .from("photos")
    .insert(photoRecord)
    .select("*, members(name), coaches!photos_coach_id_fkey(name)")
    .single();

  if (dbError) {
    await supabase.storage.from(bucket).remove([filename]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const photo = {
    id: insertedPhoto.id,
    url: insertedPhoto.url,
    caption: insertedPhoto.caption,
    member_id: insertedPhoto.member_id,
    category: insertedPhoto.category || "gallery",
    coach_id: insertedPhoto.coach_id,
    created_at: insertedPhoto.created_at,
    member_name: insertedPhoto.members?.name ?? null,
    coach_name: insertedPhoto.coaches?.name ?? null,
  };

  return NextResponse.json(photo, { status: 201 });
}