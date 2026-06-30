import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  if (!verifyAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  
  // Format numeric inputs properly if they are sent in request body
  const updateData: Record<string, any> = { ...body };
  if (updateData.duration_weeks !== undefined) {
    updateData.duration_weeks = parseInt(updateData.duration_weeks);
  }
  if (updateData.weight_lost_kg !== undefined) {
    updateData.weight_lost_kg = updateData.weight_lost_kg !== "" && updateData.weight_lost_kg !== null ? parseFloat(updateData.weight_lost_kg) : null;
  }
  if (updateData.muscle_gained_kg !== undefined) {
    updateData.muscle_gained_kg = updateData.muscle_gained_kg !== "" && updateData.muscle_gained_kg !== null ? parseFloat(updateData.muscle_gained_kg) : null;
  }
  if (updateData.coach_id !== undefined) {
    updateData.coach_id = updateData.coach_id ? parseInt(updateData.coach_id) : null;
  }
  if (updateData.display_order !== undefined) {
    updateData.display_order = updateData.display_order !== "" && updateData.display_order !== null ? parseInt(updateData.display_order) : 0;
  }

  const { data, error } = await supabase
    .from("transformations")
    .update(updateData)
    .eq("id", idParam)
    .select()
    .single();
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  if (!verifyAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const supabase = getSupabaseAdmin();
  
  // Retrieve image URLs first so we can remove them from storage
  const { data: record, error: fetchError } = await supabase
    .from("transformations")
    .select("before_image_url, after_image_url")
    .eq("id", idParam)
    .single();
    
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  
  // Delete row
  const { error: deleteError } = await supabase
    .from("transformations")
    .delete()
    .eq("id", idParam);
    
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  
  // Remove objects from transformations storage bucket if they exist
  const filesToRemove: string[] = [];
  if (record.before_image_url) {
    const beforeParts = record.before_image_url.split("/transformations/");
    if (beforeParts.length > 1) filesToRemove.push(beforeParts[1]);
  }
  if (record.after_image_url) {
    const afterParts = record.after_image_url.split("/transformations/");
    if (afterParts.length > 1) filesToRemove.push(afterParts[1]);
  }
  
  if (filesToRemove.length > 0) {
    await supabase.storage.from("transformations").remove(filesToRemove);
  }
  
  return NextResponse.json({ success: true });
}
