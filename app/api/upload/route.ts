import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const caption = (formData.get("caption") as string) || null;
  const memberIdStr = formData.get("memberId") as string | null;
  const memberId = memberIdStr ? parseInt(memberIdStr) : null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "gym-photos";

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // Upload to Supabase Storage
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

  // Get public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
  const url = urlData.publicUrl;

  // Save to database
  const { data: photo, error: dbError } = await supabase
    .from("photos")
    .insert({ url, caption, member_id: memberId })
    .select("*, members(name)")
    .single();

  if (dbError) {
    // Clean up storage if DB insert fails
    await supabase.storage.from(bucket).remove([filename]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      id: photo.id,
      url: photo.url,
      caption: photo.caption,
      member_id: photo.member_id,
      created_at: photo.created_at,
      member_name: (photo as any).members?.name ?? null,
    },
    { status: 201 }
  );
}
