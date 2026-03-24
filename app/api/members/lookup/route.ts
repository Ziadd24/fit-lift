import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

interface SafeMemberResponse {
  id: number;
  name: string;
  membership_type: string;
  sub_expiry_date: string;
  membership_code: string;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(`lookup:${ip}`, {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!limit.allowed) {
    const retryAfterSec = Math.ceil((limit.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many attempts. Please wait before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  let body: { membershipCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { membershipCode } = body;

  if (!membershipCode || typeof membershipCode !== "string") {
    return NextResponse.json({ error: "membershipCode is required" }, { status: 400 });
  }

  if (membershipCode.length > 50 || !/^[A-Za-z0-9\-_]+$/.test(membershipCode)) {
    return NextResponse.json({ error: "Invalid membership code format" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("members")
    .select("id, name, membership_type, sub_expiry_date, membership_code")
    .eq("membership_code", membershipCode)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const safe: SafeMemberResponse = {
    id: data.id,
    name: data.name,
    membership_type: data.membership_type,
    sub_expiry_date: data.sub_expiry_date,
    membership_code: data.membership_code,
  };

  return NextResponse.json(safe);
}