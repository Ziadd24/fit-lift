import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth, verifyCoachAuth } from "@/lib/auth";
import { sanitizeSearchFilter } from "@/lib/sanitize";
import { normalizeMembershipCode } from "@/lib/member-code";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 1000;

export async function GET(req: NextRequest) {
  const isAdmin = await verifyAdminAuth(req);
  const coachId = await verifyCoachAuth(req);
  if (!isAdmin && !coachId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSizeParam = searchParams.get("pageSize") || "";
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const type = searchParams.get("type") || "all";
  // unassigned=true → return members with no coach (for the assign-member drawer)
  const unassigned = searchParams.get("unassigned") === "true";
  const wantsAll = pageSizeParam === "all";
  const pageSize = wantsAll
    ? MAX_PAGE_SIZE
    : Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(pageSizeParam || String(PAGE_SIZE)) || PAGE_SIZE));

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const today = new Date().toISOString().split("T")[0];
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const supabase = getSupabaseAdmin();
  let query = supabase.from("members").select("*", { count: "exact" });

  if (isAdmin) {
    // Admin sees all members regardless of coach assignment
    // (no coach_id filter)
  } else if (coachId) {
    if (unassigned) {
      // Coach is searching for members to assign — show unassigned ones
      query = query.is("coach_id", null);
    } else {
      // Normal roster: only this coach's own members
      query = query.eq("coach_id", coachId);
    }
  }

  if (search) {
    const safeSearch = sanitizeSearchFilter(search);
    if (safeSearch)
      query = query.or(
        `name.ilike.%${safeSearch}%,membership_code.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`
      );
  }
  if (type !== "all") query = query.eq("membership_type", type);
  if (status === "active") {
    query = query.gte("sub_expiry_date", today);
  } else if (status === "expired") {
    query = query.lt("sub_expiry_date", today);
  } else if (status === "expiring_soon") {
    query = query.gte("sub_expiry_date", today).lte("sub_expiry_date", sevenDaysLater);
  }

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    members: data,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  });
}

// POST is admin-only. Coaches assign existing members via PATCH /api/members/[id]
export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminAuth(req);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Only admins can create new members. Coaches should assign existing members to their roster." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { name, membership_code, email, phone, membership_type, sub_expiry_date, start_date, coach_id } = body;
  if (!name || !membership_code || !sub_expiry_date)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  if (name.length > 200) return NextResponse.json({ error: "Name too long" }, { status: 400 });

  const normalizedMembershipCode = normalizeMembershipCode(String(membership_code));
  if (!normalizedMembershipCode || normalizedMembershipCode.length > 50) {
    return NextResponse.json({ error: "Invalid membership code" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("members")
    .insert({
      name: name.slice(0, 200),
      membership_code: normalizedMembershipCode,
      email: (email || "").slice(0, 200) || null,
      phone: (phone || "").slice(0, 50) || null,
      membership_type: (membership_type || "1 Month").slice(0, 100),
      sub_expiry_date,
      start_date: start_date || new Date().toISOString().split("T")[0],
      coach_id: coach_id || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "Membership code already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("member_progress_profiles")
    .upsert(
      {
        member_id: data.id,
        body_metrics: [],
        coach_goals: [],
        personal_records: [],
        wearable_connections: [],
        updated_by_role: "system",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "member_id" }
    );

  return NextResponse.json(data, { status: 201 });
}
