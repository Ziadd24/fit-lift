import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!await verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("coaches")
    .select("id, name, display_name, created_at, display_order, password_hash")
    .order("display_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  const coaches = data?.map(c => {
    const is_display_only = c.password_hash === "admin-only-display-coach";
    return {
      id: c.id,
      name: c.name,
      display_name: c.display_name,
      created_at: c.created_at,
      display_order: c.display_order,
      is_display_only
    };
  });
  return NextResponse.json(coaches || []);
}

export async function PUT(req: NextRequest) {
  if (!await verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, name, display_name } = body;
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("coaches")
    .update({ name, display_name })
    .eq("id", id)
    .select("id, name, display_name, created_at, display_order, password_hash")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({
    id: data.id,
    name: data.name,
    display_name: data.display_name,
    created_at: data.created_at,
    display_order: data.display_order,
    is_display_only: data.password_hash === "admin-only-display-coach"
  });
}

export async function POST(req: NextRequest) {
  if (!await verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { name, display_name, password, is_display_only } = await req.json();
  
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!is_display_only && (!password || password.length < 8)) {
    return NextResponse.json({ error: "Password must be at least 8 characters for real coaches" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  let final_password_hash = "admin-only-display-coach";
  if (!is_display_only) {
    final_password_hash = await hashPassword(password);
  }

  const { data, error } = await supabase
    .from("coaches")
    .insert({ 
      name: name.trim(), 
      display_name: display_name?.trim() || null,
      password_hash: final_password_hash
    })
    .select("id, name, display_name, created_at, display_order, password_hash")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({
    id: data.id,
    name: data.name,
    display_name: data.display_name,
    created_at: data.created_at,
    display_order: data.display_order,
    is_display_only: data.password_hash === "admin-only-display-coach"
  }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!await verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();

  // Delete associated photos from storage
  const { data: photos } = await supabase
    .from("photos")
    .select("url")
    .eq("coach_id", id);
  if (photos && photos.length > 0) {
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "gym-photos";
    const paths = photos.map((p) => p.url.split("/").slice(-1)[0]).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from(bucket).remove(paths);
    }
  }

  // Delete photos records
  await supabase.from("photos").delete().eq("coach_id", id);

  // Delete coach
  const { error } = await supabase.from("coaches").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}