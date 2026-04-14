import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyPassword, createCoachToken } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`coach-login:${ip}`, {
      limit: 10, windowMs: 15 * 60 * 1000,
    });
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
    const { data: coachRaw, error } = await supabase
      .from("coaches")
      .select("id, name, password_hash, created_at")
      .ilike("name", name.trim())
      .single();

    if (error || !coachRaw) {
      return NextResponse.json({ error: "Invalid name or password" }, { status: 401 });
    }

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