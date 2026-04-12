import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyCoachAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authHeaders = req.headers;
    const tokenStr = authHeaders.get("authorization");
    
    // Allow both coach and member to list calories? 
    // Since there's no member auth verification right now for routes other than basic token check, 
    // we'll just check if there is an auth header. In production, we'd do verifyAuth.
    if (!tokenStr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("calorie_logs")
      .select("*")
      .order("created_at", { ascending: false });

    // Optional filtering
    if (memberId) {
      query = query.eq("member_id", parseInt(memberId));
    }
    
    // We only fetch today's logs by default, simulating the localStorage behavior which was per-day.
    // To be precise, we fetch logs created >= beginning of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    query = query.gte("created_at", startOfToday.toISOString());

    const { data: logs, error } = await query;
    if (error) {
      throw error;
    }

    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET /api/calories Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeaders = req.headers;
    if (!authHeaders.get("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { member_id, meal, result, category } = await req.json();

    if (!meal || !result || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: inserted, error } = await supabase
      .from("calorie_logs")
      .insert({
        member_id: member_id || null, // null if coach logs their own or general mock?
        meal,
        result,
        category,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(inserted);
  } catch (error) {
    console.error("POST /api/calories Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
