import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth, verifyCoachAuth } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  const coachId = verifyCoachAuth(req);
  const isAdmin = verifyAdminAuth(req);
  if (!coachId && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const idStr = searchParams.get("id");

  if (!idStr) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const id = parseInt(idStr);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Get the upload record first to get the file URL
  const { data: upload, error: fetchError } = await supabase
    .from("coach_uploads")
    .select("file_url")
    .eq("id", id)
    .single();

  if (fetchError || !upload) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  // Delete from storage
  const filename = upload.file_url.split("/").pop();
  if (filename) {
    const { error: deleteStorageError } = await supabase.storage
      .from("coach-uploads")
      .remove([filename]);

    if (deleteStorageError) {
      console.error("Storage delete error:", deleteStorageError);
      // Continue with database delete even if storage fails
    }
  }

  // Delete from database
  const { error: deleteDbError } = await supabase
    .from("coach_uploads")
    .delete()
    .eq("id", id);

  if (deleteDbError) {
    return NextResponse.json({ error: deleteDbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
