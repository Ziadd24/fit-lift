import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth, verifyCoachAuth } from "@/lib/auth";
import { normalizeMaybeMojibake } from "@/lib/text";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const isAdmin = await verifyAdminAuth(req);
  const coachId = await verifyCoachAuth(req);
  if (!isAdmin && !coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", parseInt(idParam))
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const isAdmin = await verifyAdminAuth(req);
  const coachId = await verifyCoachAuth(req);
  if (!isAdmin && !coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const normalizedBody = {
    ...body,
    ...(typeof body.name === "string" ? { name: normalizeMaybeMojibake(body.name).slice(0, 200) } : {}),
    ...(typeof body.email === "string" ? { email: normalizeMaybeMojibake(body.email).slice(0, 200) || null } : {}),
    ...(typeof body.phone === "string" ? { phone: normalizeMaybeMojibake(body.phone).slice(0, 50) || null } : {}),
    ...(typeof body.membership_type === "string"
      ? { membership_type: normalizeMaybeMojibake(body.membership_type).slice(0, 100) }
      : {}),
  };
  const supabase = getSupabaseAdmin();

  // Coaches can only update members they own
  let query = supabase.from("members").update(normalizedBody).eq("id", parseInt(idParam));
  if (!isAdmin && coachId) {
    query = query.eq("coach_id", coachId);
  }

  const { data, error } = await query.select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Member not found or not in your roster" }, { status: 404 });
  return NextResponse.json(data);
}

/**
 * PATCH /api/members/:id
 * Coach assigns an existing (unassigned) member to their roster.
 * Body: { action: "assign" | "unassign" }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const isAdmin = await verifyAdminAuth(req);
  const coachId = await verifyCoachAuth(req);
  if (!isAdmin && !coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const action: "assign" | "unassign" = body.action || "assign";
  const memberId = parseInt(idParam);
  if (isNaN(memberId)) return NextResponse.json({ error: "Invalid member id" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Verify the member exists and is currently unassigned (or belongs to this coach)
  const { data: existing } = await supabase
    .from("members")
    .select("id, coach_id, name")
    .eq("id", memberId)
    .single();

  if (!existing) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  if (action === "assign") {
    // Prevent stealing another coach's client unless admin
    if (!isAdmin && existing.coach_id !== null && existing.coach_id !== coachId) {
      return NextResponse.json(
        { error: "This member is already assigned to another coach" },
        { status: 409 }
      );
    }
    const newCoachId = isAdmin ? (body.coach_id ?? coachId) : coachId;
    const { data, error } = await supabase
      .from("members")
      .update({ coach_id: newCoachId })
      .eq("id", memberId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (action === "unassign") {
    // Coach can only unassign their own client; admin can unassign anyone
    if (!isAdmin && existing.coach_id !== coachId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { data, error } = await supabase
      .from("members")
      .update({ coach_id: null })
      .eq("id", memberId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const isAdmin = await verifyAdminAuth(req);
  const coachId = await verifyCoachAuth(req);
  if (!isAdmin && !coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt(idParam);
  const supabase = getSupabaseAdmin();

  const { data: photos } = await supabase
    .from("photos")
    .select("url")
    .eq("member_id", id);

  if (photos && photos.length > 0) {
    const paths = photos
      .map((p) => p.url.split("/").slice(-1)[0])
      .filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "gym-photos")
        .remove(paths);
    }
  }

  await supabase.from("members").delete().eq("id", id);
  return new NextResponse(null, { status: 204 });
}
