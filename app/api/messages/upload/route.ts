import { NextRequest, NextResponse } from "next/server";
import { verifyCoachAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateImageFile, validateImageBytes } from "@/lib/validate-file";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export async function POST(req: NextRequest) {
  const coachId = verifyCoachAuth(req);
  if (!coachId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  
  const validation = validateImageFile(file);
  if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });
  
  const bytes = await file.arrayBuffer();
  if (!validateImageBytes(bytes, file.type)) {
    return NextResponse.json({ error: "File content does not match declared type." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "gym-photos";
  const ext = validation.safeExtension;
  const filename = `messages/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const safeContentType = ALLOWED_IMAGE_TYPES.has(file.type) ? file.type : "image/jpeg";
  
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filename, bytes, { contentType: safeContentType, upsert: false });
  
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
  
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
  const url = urlData.publicUrl;
  
  return NextResponse.json({ url }, { status: 201 });
}
