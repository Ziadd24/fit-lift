import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getMembershipCodeLookupCandidates } from "@/lib/member-code";

interface SafeMemberResponse {
  id: number;
  name: string;
  membership_type: string;
  sub_expiry_date: string;
  membership_code: string;
  coach_id: number | null;
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

  if (membershipCode.length > 50) {
    return NextResponse.json({ error: "Invalid membership code format" }, { status: 400 });
  }

  const { normalized, digitsOnly, candidates } = getMembershipCodeLookupCandidates(membershipCode);
  if (!normalized || !/^[A-Z0-9\-_]+$/.test(normalized)) {
    return NextResponse.json({ error: "Invalid membership code format" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  let data: SafeMemberResponse | null = null;
  let error: { message?: string } | null = null;

  for (const candidate of candidates) {
    const result = await supabase
      .from("members")
      .select("id, name, membership_type, sub_expiry_date, membership_code, coach_id")
      .ilike("membership_code", candidate)
      .maybeSingle();

    if (result.data) {
      data = result.data;
      error = null;
      break;
    }

    if (result.error) {
      error = result.error;
      break;
    }
  }

  if (!data && digitsOnly.length === 4) {
    const fallback = await supabase
      .from("members")
      .select("id, name, membership_type, sub_expiry_date, membership_code, coach_id")
      .ilike("membership_code", `%${digitsOnly}`)
      .limit(2);

    if (fallback.error) {
      error = fallback.error;
    } else if ((fallback.data ?? []).length === 1) {
      data = fallback.data![0];
    } else if ((fallback.data ?? []).length > 1) {
      return NextResponse.json(
        { error: "Multiple members match that short code. Please enter the full membership code." },
        { status: 409 }
      );
    }
  }

  if (error || !data) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const safe: SafeMemberResponse = {
    id: data.id,
    name: data.name,
    membership_type: data.membership_type,
    sub_expiry_date: data.sub_expiry_date,
    membership_code: data.membership_code,
    coach_id: data.coach_id,
  };

  return NextResponse.json(safe);
}
