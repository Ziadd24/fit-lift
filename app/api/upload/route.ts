import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";
import { validateImageFile, validateImageBytes } from "@/lib/validate-file";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  const validation = validateImageFile(file);
  if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });
  const bytes = await file.arrayBuffer();
  if (!validateImageBytes(bytes, file.type)) {
    return NextResponse.json({ error: "File content does not match declared type." }, { status: 400 });
  }
  const caption = ((formData.get("caption") as string) || "").slice(0, 500);
  const category = (formData.get("category") as string || "gallery").slice(0, 50);
  const coachIdStr = formData.get("coachId") as string | null;
  const coachId = coachIdStr ? parseInt(coachIdStr) : null;
  const memberIdStr = formData.get("memberId") as string | null;
  const memberId = memberIdStr ? parseInt(memberIdStr) : null;

  // Reject member photo uploads (feature removed)
  if (memberId || category === "member") {
    return NextResponse.json({ error: "Member photo uploads are no longer supported" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "gym-photos";
  const ext = validation.safeExtension;
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const safeContentType = ALLOWED_IMAGE_TYPES.has(file.type) ? file.type : "image/jpeg";
  const { error: uploadError } = await supabase.storage.from(bucket).upload(filename, bytes, { contentType: safeContentType, upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
  const url = urlData.publicUrl;
  const photoRecord: Record<string, any> = { url, caption, category };
  if (coachId) photoRecord.coach_id = coachId;
  if (memberId) photoRecord.member_id = memberId;

  // Only one photo per coach — delete old photos first
  if (coachId) {
    const { data: oldPhotos } = await supabase
      .from("photos")
      .select("url, id")
      .eq("coach_id", coachId);
    if (oldPhotos && oldPhotos.length > 0) {
      const paths = oldPhotos.map((p) => p.url.split("/").slice(-1)[0]).filter(Boolean);
      if (paths.length > 0) await supabase.storage.from(bucket).remove(paths);
      await supabase.from("photos").delete().eq("coach_id", coachId);
    }
  }
  const { data: insertedPhoto, error: dbError } = await (supabase as any)
    .from("photos").insert(photoRecord).select("*, members(name), coaches!photos_coach_id_fkey(name)").single();
  if (dbError) {
    await supabase.storage.from(bucket).remove([filename]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  return NextResponse.json({
    id: insertedPhoto.id, url: insertedPhoto.url, caption: insertedPhoto.caption,
    member_id: insertedPhoto.member_id, category: insertedPhoto.category || "gallery",
    coach_id: insertedPhoto.coach_id, created_at: insertedPhoto.created_at,
    member_name: insertedPhoto.members?.name ?? null, coach_name: insertedPhoto.coaches?.name ?? null,
  }, { status: 201 });
}