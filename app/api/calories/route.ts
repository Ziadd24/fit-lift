import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyCoachAuth, verifyAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const coachId = verifyCoachAuth(req);
    const isAdmin = verifyAdminAuth(req);
    if (!coachId && !isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const supabase = getSupabaseAdmin();
    let query = supabase.from("calorie_logs").select("*").order("created_at", { ascending: false });
    if (memberId) {
      const parsedId = parseInt(memberId);
      if (isNaN(parsedId)) return NextResponse.json({ error: "Invalid memberId" }, { status: 400 });
      query = query.eq("member_id", parsedId);
    }
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
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
    if (!coachId && !isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { member_id, meal, result, category } = await req.json();
    if (!meal || !result || !category) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    if (typeof meal !== "string" || meal.length > 500) return NextResponse.json({ error: "Meal description too long" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("calorie_logs").insert({
      member_id: member_id || null, meal: meal.slice(0, 500), result, category: category.slice(0, 50),
    }).select("*").single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}