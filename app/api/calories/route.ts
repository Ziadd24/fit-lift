import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyCoachAuth, verifyAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const coachId = verifyCoachAuth(req);
    const isAdmin = verifyAdminAuth(req);
    const authHeader = req.headers.get("Authorization");
    const memberCode = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const supabase = getSupabaseAdmin();

    let query = supabase.from("calorie_logs").select("*").order("created_at", { ascending: false });

    if (memberId) {
      if (memberId === "null") {
        // Coach's own logs (no member attached)
        query = query.is("member_id", null);
      } else if (memberId === "all") {
        // All client logs — scoped to coach's roster when not admin
        if (!isAdmin && coachId) {
          // Get coach's member IDs first
          const { data: coachMembers } = await supabase
            .from("members")
            .select("id")
            .eq("coach_id", coachId);
          const memberIds = (coachMembers || []).map((m: any) => m.id);
          if (memberIds.length === 0) {
            return NextResponse.json([]);
          }
          query = query.in("member_id", memberIds);
        } else {
          // Admin sees all client logs
          query = query.not("member_id", "is", null);
        }
      } else {
        const parsedId = parseInt(memberId);
        if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid memberId" }, { status: 400 });

        // Verify this member belongs to the coach or matches the logged-in client
        if (!isAdmin && coachId) {
          const { data: member } = await supabase
            .from("members")
            .select("id")
            .eq("id", parsedId)
            .eq("coach_id", coachId)
            .single();
          if (!member) return NextResponse.json({ error: "Member not in your roster" }, { status: 403 });
        } else if (!isAdmin) {
          if (!memberCode) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          const { data: member } = await supabase
            .from("members")
            .select("id")
            .eq("id", parsedId)
            .eq("membership_code", memberCode)
            .single();
          if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        query = query.eq("member_id", parsedId);
      }
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    query = query.gte("created_at", startOfToday.toISOString());

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const coachId = verifyCoachAuth(req);
    const isAdmin = verifyAdminAuth(req);
    const authHeader = req.headers.get("Authorization");
    const memberCode = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const { member_id, meal, result, category } = await req.json();
    if (!meal || !result || !category) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    if (typeof meal !== "string" || meal.length > 500) return NextResponse.json({ error: "Meal description too long" }, { status: 400 });

    // If member_id provided and not admin, verify membership ownership
    if (member_id && !isAdmin && coachId) {
      const supabaseCheck = getSupabaseAdmin();
      const { data: member } = await supabaseCheck
        .from("members")
        .select("id")
        .eq("id", member_id)
        .eq("coach_id", coachId)
        .single();
      if (!member) return NextResponse.json({ error: "Member not in your roster" }, { status: 403 });
    } else if (member_id && !isAdmin) {
      if (!memberCode) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const supabaseCheck = getSupabaseAdmin();
      const { data: member } = await supabaseCheck
        .from("members")
        .select("id")
        .eq("id", member_id)
        .eq("membership_code", memberCode)
        .single();
      if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else if (!member_id && !isAdmin && !coachId) {
      return NextResponse.json({ error: "member_id is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("calorie_logs").insert({
      member_id: member_id || null,
      meal: meal.slice(0, 500),
      result,
      category: category.slice(0, 50),
    }).select("*").single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
