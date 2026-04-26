import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!await verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "gym-photos";

    // Create signed URL for upload (valid for 60 seconds)
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filename);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
