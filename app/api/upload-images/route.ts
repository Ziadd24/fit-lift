import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";
import { validateImageFile, validateImageBytes } from "@/lib/validate-file";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export async function POST(req: NextRequest) {
  if (!await verifyAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  if (!files || files.length === 0) return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  if (files.length > 20) return NextResponse.json({ error: "Too many files (max 20)" }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "gym-photos";
  const uploadedUrls: string[] = [];
  for (const file of files) {
    const validation = validateImageFile(file);
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });
    const bytes = await file.arrayBuffer();
    if (!validateImageBytes(bytes, file.type)) {
      return NextResponse.json({ error: "File content does not match declared type." }, { status: 400 });
    }
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${validation.safeExtension}`;
    const safeContentType = ALLOWED_IMAGE_TYPES.has(file.type) ? file.type : "image/jpeg";
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filename, bytes, { contentType: safeContentType, upsert: false });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
    uploadedUrls.push(urlData.publicUrl);
  }
  return NextResponse.json({ urls: uploadedUrls }, { status: 201 });
}