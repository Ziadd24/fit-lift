import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("transformations")
    .select("*, coaches(id, name)")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { 
    id,
    member_name, 
    duration_weeks, 
    weight_lost_kg, 
    muscle_gained_kg, 
    before_image_url, 
    after_image_url, 
    coach_id, 
    is_visible, 
    display_order 
  } = body;
  
  if (!member_name || duration_weeks === undefined) {
    return NextResponse.json({ error: "Member Name and Duration are required" }, { status: 400 });
  }
  
  if (!before_image_url && !after_image_url) {
    return NextResponse.json({ error: "At least one image (before or after) is required" }, { status: 400 });
  }
  
  const { data, error } = await supabase.from("transformations").insert({
    id: id || undefined,
    member_name: member_name.slice(0, 100),
    duration_weeks: parseInt(duration_weeks),
    weight_lost_kg: weight_lost_kg !== "" && weight_lost_kg !== null ? parseFloat(weight_lost_kg) : null,
    muscle_gained_kg: muscle_gained_kg !== "" && muscle_gained_kg !== null ? parseFloat(muscle_gained_kg) : null,
    before_image_url: before_image_url || null,
    after_image_url: after_image_url || null,
    coach_id: coach_id ? parseInt(coach_id) : null,
    is_visible: is_visible !== undefined ? !!is_visible : true,
    display_order: display_order !== undefined ? parseInt(display_order) : 0,
  }).select().single();
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
