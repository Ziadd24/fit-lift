import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import { rateLimit, getClientIp, RateLimitPresets } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = await rateLimit(`coach-register:${ip}`, RateLimitPresets.register);
    if (!limit.allowed) {
      const retryAfterSec = Math.ceil((limit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many registration attempts." },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    const { name, password } = await req.json();
    if (!name || !password) {
      return NextResponse.json({ error: "Name and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: existingCoach } = await supabase
      .from("coaches").select("id").ilike("name", name.trim()).single();
    if (existingCoach) {
      return NextResponse.json({ error: "A coach with this name already exists" }, { status: 409 });
    }

    const approvalRequired = process.env.COACH_APPROVAL_REQUIRED === "true";
    const password_hash = await hashPassword(password);

    // Get max display_order to place new coach at the end
    let maxOrder = 0;
    const { data: maxOrderData } = await supabase
      .from("coaches")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .single();
    if (maxOrderData && typeof maxOrderData.display_order === "number") {
      maxOrder = maxOrderData.display_order;
    }

    const { data, error } = await supabase
      .from("coaches")
      .insert({
        name: name.trim(),
        password_hash,
        display_order: maxOrder + 1,
        ...(approvalRequired ? { status: "pending" } : {})
      })
      .select("id, name, display_order, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: "Registration failed." }, { status: 500 });
    }

    if (approvalRequired) {
      return NextResponse.json({
        success: true,
        message: "Registration submitted. An admin will approve your account.",
        coach: data,
      }, { status: 201 });
    }

    const { createCoachToken } = await import("@/lib/auth");
    const token = await createCoachToken(data.id);
    return NextResponse.json({ success: true, token, coach: data }, { status: 201 });
  } catch (err: any) {
    console.error("Coach Register Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}