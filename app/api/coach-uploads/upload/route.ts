import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth, verifyCoachAuth } from "@/lib/auth";
import { validateUploadFile, validateUploadBytes, getFileTypeFromMimeType } from "@/lib/validate-upload";

export async function POST(req: NextRequest) {
  const coachId = verifyCoachAuth(req);
  const isAdmin = verifyAdminAuth(req);
  if (!coachId && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const memberIdStr = formData.get("member_id") as string | null;
  const category = formData.get("category") as string | null;
  const title = formData.get("title") as string | null;
  const description = formData.get("description") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!memberIdStr) {
    return NextResponse.json({ error: "member_id is required" }, { status: 400 });
  }

  if (!category || (category !== "training_program" && category !== "diet_plan")) {
    return NextResponse.json({ error: "Invalid category. Must be 'training_program' or 'diet_plan'" }, { status: 400 });
  }

  const memberId = parseInt(memberIdStr);
  if (isNaN(memberId)) {
    return NextResponse.json({ error: "Invalid member_id" }, { status: 400 });
  }

  const validation = validateUploadFile(file);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  if (!validateUploadBytes(bytes, file.type)) {
    return NextResponse.json({ error: "File content does not match declared type." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const bucket = "coach-uploads";
  const ext = validation.safeExtension;
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const fileType = getFileTypeFromMimeType(file.type);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filename, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
  const url = urlData.publicUrl;

  const uploadRecord: Record<string, any> = {
    coach_id: null, // Will be set by auth context if needed
    member_id: memberId,
    file_url: url,
    file_name: file.name,
    file_type: fileType,
    file_size: file.size,
    category: category,
    title: title || null,
    description: description || null,
  };

  const { data: insertedUpload, error: dbError } = await supabase
    .from("coach_uploads")
    .insert(uploadRecord)
    .select("*, members(name), coaches(name)")
    .single();

  if (dbError) {
    await supabase.storage.from(bucket).remove([filename]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({
    id: insertedUpload.id,
    file_url: insertedUpload.file_url,
    file_name: insertedUpload.file_name,
    file_type: insertedUpload.file_type,
    file_size: insertedUpload.file_size,
    category: insertedUpload.category,
    title: insertedUpload.title,
    description: insertedUpload.description,
    member_id: insertedUpload.member_id,
    coach_id: insertedUpload.coach_id,
    created_at: insertedUpload.created_at,
    member_name: insertedUpload.members?.name ?? null,
    coach_name: insertedUpload.coaches?.name ?? null,
  }, { status: 201 });
}
