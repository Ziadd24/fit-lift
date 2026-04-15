import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth, verifyCoachAuth } from "@/lib/auth";
import { sanitizeSearchFilter } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const isAdmin = await verifyAdminAuth(req);
  const coachId = await verifyCoachAuth(req);
  if (!isAdmin && !coachId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const type = searchParams.get("type") || "all";
  // unassigned=true → return members with no coach (for the assign-member drawer)
  const unassigned = searchParams.get("unassigned") === "true";
  const assignmentSearch = searchParams.get("assignmentSearch") === "true";

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = getSupabaseAdmin();
  let query = supabase.from("members").select("*", { count: "exact" });

  if (isAdmin) {
    // Admin sees all members regardless of coach assignment
    // (no coach_id filter)
  } else if (coachId) {
    if (assignmentSearch) {
      // Coach assign drawer:
      // - with no search, show unassigned members by default
      // - with search, show all matching members so exact code lookups don't silently disappear
      if (!search.trim()) {
        query = query.is("coach_id", null);
      }
    } else if (unassigned) {
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
  if (status === "active") query = query.gte("sub_expiry_date", new Date().toISOString().split("T")[0]);
  else if (status === "expired") query = query.lt("sub_expiry_date", new Date().toISOString().split("T")[0]);

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    members: data,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
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
  const { name, membership_code, email, phone, membership_type, sub_expiry_date, coach_id } = body;
  if (!name || !membership_code || !sub_expiry_date)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  if (name.length > 200) return NextResponse.json({ error: "Name too long" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("members")
    .insert({
      name: name.slice(0, 200),
      membership_code: membership_code.slice(0, 50),
      email: (email || "").slice(0, 200) || null,
      phone: (phone || "").slice(0, 50) || null,
      membership_type: (membership_type || "Basic").slice(0, 100),
      sub_expiry_date,
      coach_id: coach_id || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "Membership code already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
