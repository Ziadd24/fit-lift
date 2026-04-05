import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminAuth, verifyCoachAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const isAdmin = await verifyAdminAuth(req);
  const coachId = await verifyCoachAuth(req);
  
  if (!isAdmin && !coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all"; // all | active | expired
  const type = searchParams.get("type") || "all";

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = getSupabaseAdmin();
  let query = supabase.from("members").select("*", { count: "exact" });

  // Search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,membership_code.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Membership type filter
  if (type !== "all") {
    query = query.eq("membership_type", type);
  }

  // Status filter (active = expiry in the future, expired = expiry in the past)
  if (status === "active") {
    query = query.gte("sub_expiry_date", new Date().toISOString().split("T")[0]);
  } else if (status === "expired") {
    query = query.lt("sub_expiry_date", new Date().toISOString().split("T")[0]);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    members: data,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  });
}

export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminAuth(req);
  const coachId = await verifyCoachAuth(req);
  
  if (!isAdmin && !coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, membership_code, email, phone, membership_type, sub_expiry_date } = body;

  if (!name || !membership_code || !sub_expiry_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("members")
    .insert({
      name,
      membership_code,
      email: email || null,
      phone: phone || null,
      membership_type: membership_type || "Basic",
      sub_expiry_date,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Membership code already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}