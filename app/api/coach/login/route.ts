import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyPassword, createCoachToken } from "@/lib/auth";
import { rateLimit, getClientIp, RateLimitPresets } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = await rateLimit(`coach-login:${ip}`, RateLimitPresets.login);
    if (!limit.allowed) {
      const retryAfterSec = Math.ceil((limit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    const { name, password } = await req.json();
    if (!name || !password) {
      return NextResponse.json({ error: "Name and password are required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const searchTerm = name.trim();
    console.log("[Coach Login] Searching for:", searchTerm);
    
    const { data: coachRaw, error } = await supabase
      .from("coaches")
      .select("id, name, password_hash, created_at")
      .ilike("name", searchTerm)
      .single();

    if (error) {
      console.error("[Coach Login] Supabase error:", error);
      return NextResponse.json({ error: "Invalid name or password" }, { status: 401 });
    }
    
    if (!coachRaw) {
      console.error("[Coach Login] No coach found for:", searchTerm);
      return NextResponse.json({ error: "Invalid name or password" }, { status: 401 });
    }
    
    console.log("[Coach Login] Found coach:", coachRaw.id, coachRaw.name);

    const isMatch = await verifyPassword(password, coachRaw.password_hash!);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid name or password" }, { status: 401 });
    }

    const safeCoach = {
      id: coachRaw.id, name: coachRaw.name,
      created_at: coachRaw.created_at,
    };
    return NextResponse.json({
      success: true, token: await createCoachToken(coachRaw.id), coach: safeCoach,
    });
  } catch (err: any) {
    console.error("Coach Login Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}