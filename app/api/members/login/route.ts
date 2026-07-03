import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createMemberToken, normalizePhone } from "@/lib/auth";
import { rateLimit, getClientIp, RateLimitPresets } from "@/lib/rate-limit";
import { getMembershipCodeLookupCandidates } from "@/lib/member-code";

interface SafeMemberResponse {
  id: number;
  name: string;
  membership_type: string;
  sub_expiry_date: string;
  start_date: string | null;
  membership_code: string;
  coach_id: number | null;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimit(`member-login:${ip}`, RateLimitPresets.login);

  if (!limit.allowed) {
    const retryAfterSec = Math.ceil((limit.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  let body: { membershipCode?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { membershipCode, phone } = body;

  if (!membershipCode || typeof membershipCode !== "string") {
    return NextResponse.json({ error: "Membership code is required" }, { status: 400 });
  }

  if (membershipCode.length > 50) {
    return NextResponse.json({ error: "Invalid membership code format" }, { status: 400 });
  }

  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  if (phone.length > 30) {
    return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
  }

  const { normalized, digitsOnly, candidates } = getMembershipCodeLookupCandidates(membershipCode);
  if (!normalized || !/^[A-Z0-9\-_]+$/.test(normalized)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  let memberData: (SafeMemberResponse & { phone: string | null }) | null = null;

  // Try each candidate membership code
  for (const candidate of candidates) {
    const result = await supabase
      .from("members")
      .select("id, name, membership_type, sub_expiry_date, start_date, membership_code, coach_id, phone")
      .ilike("membership_code", candidate)
      .maybeSingle();

    if (result.data) {
      memberData = result.data;
      break;
    }
    if (result.error) break;
  }

  // Fallback for 4-digit codes (same logic as lookup)
  if (!memberData && digitsOnly.length === 4) {
    const fallback = await supabase
      .from("members")
      .select("id, name, membership_type, sub_expiry_date, start_date, membership_code, coach_id, phone")
      .ilike("membership_code", `%${digitsOnly}`)
      .limit(2);

    if (fallback.data?.length === 1) {
      memberData = fallback.data[0];
    }
    // If multiple matches or error, memberData stays null → generic error below
  }

  if (!memberData) {
    // Generic error — don't reveal whether code exists
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Check if member has a phone number stored
  if (!memberData.phone) {
    return NextResponse.json(
      {
        error: "رقم الموبايل مش مسجل عندنا. كلم الجيم عشان يضيفوا رقمك.",
        errorCode: "NO_PHONE",
      },
      { status: 403 }
    );
  }

  // Normalize and compare phone numbers (strip non-digits, compare last 10 digits)
  const storedDigits = normalizePhone(memberData.phone);
  const inputDigits = normalizePhone(phone);

  if (!storedDigits || !inputDigits) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Exact match always passes (important for short test numbers like "01109")
  if (storedDigits !== inputDigits) {
    // Compare last 10 digits to handle country code variations
    // e.g., "01009987771" and "+201009987771" both end with "1009987771"
    const storedSuffix = storedDigits.slice(-10);
    const inputSuffix = inputDigits.slice(-10);

    if (storedSuffix !== inputSuffix || storedSuffix.length < 7) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
  }

  // Issue JWT token
  const token = await createMemberToken(memberData.id);

  const safeMember: SafeMemberResponse = {
    id: memberData.id,
    name: memberData.name,
    membership_type: memberData.membership_type,
    sub_expiry_date: memberData.sub_expiry_date,
    start_date: memberData.start_date,
    membership_code: memberData.membership_code,
    coach_id: memberData.coach_id,
  };

  return NextResponse.json({ success: true, token, member: safeMember });
}
