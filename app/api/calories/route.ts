import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyCoachAuth, verifyAdminAuth, verifyMemberAuth, assertCoachOwnsMember } from "@/lib/auth";

type CalorieResult = Record<string, any> & {
  shared_with_coach?: boolean;
  shared_coach_id?: number | null;
};


function isFiniteId(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isSharedWithCoach(result: unknown, coachId: number) {
  if (!result || typeof result !== "object") return false;
  const logResult = result as CalorieResult;
  return logResult.shared_with_coach === true && logResult.shared_coach_id === coachId;
}

export async function GET(req: NextRequest) {
  try {
    const coachId = verifyCoachAuth(req);
    const isAdmin = verifyAdminAuth(req);
    const authedMemberId = verifyMemberAuth(req);

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const supabase = getSupabaseAdmin();

    let query = supabase.from("calorie_logs").select("*").order("created_at", { ascending: false });

    if (memberId) {
      if (memberId === "null") {
        query = query.is("member_id", null);
      } else if (memberId === "all") {
        if (!isAdmin && coachId) {
          query = query.not("member_id", "is", null);
        } else if (!isAdmin) {
          if (!authedMemberId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          query = query.eq("member_id", authedMemberId);
        } else {
          query = query.not("member_id", "is", null);
        }
      } else {
        const parsedId = parseInt(memberId, 10);
        if (Number.isNaN(parsedId)) {
          return NextResponse.json({ error: "Invalid memberId" }, { status: 400 });
        }

        if (!isAdmin && !coachId) {
          if (!authedMemberId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          if (parsedId !== authedMemberId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        query = query.eq("member_id", parsedId);
      }
    } else if (!coachId && !isAdmin) {
      if (!authedMemberId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      query = query.eq("member_id", authedMemberId);
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    query = query.gte("created_at", startOfToday.toISOString());

    const { data, error } = await query;
    if (error) throw error;

    let logs = data || [];

    if (!isAdmin && coachId) {
      // Coaches can only see logs that were explicitly shared with them.
      logs = logs.filter((log: any) => {
        if (isSharedWithCoach(log.result, coachId)) return true;
        if (!log.member_id) return false;
        return false;
      });
    }

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const coachId = verifyCoachAuth(req);
    const isAdmin = verifyAdminAuth(req);
    const authedMemberId = verifyMemberAuth(req);

    const { member_id, meal, result, category } = await req.json();
    if (!meal || !result || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (typeof meal !== "string" || meal.length > 500) {
      return NextResponse.json({ error: "Meal description too long" }, { status: 400 });
    }

    let resolvedMemberId = member_id ? Number(member_id) : null;
    let sharedWithCoach = false;
    let sharedCoachId: number | null = null;

    if (!isAdmin) {
      const supabaseCheck = getSupabaseAdmin();

      if (coachId) {
        if (!resolvedMemberId) {
          return NextResponse.json({ error: "member_id is required" }, { status: 400 });
        }
        if (!(await assertCoachOwnsMember(supabaseCheck, coachId, resolvedMemberId))) {
          return NextResponse.json({ error: "Member not in your roster" }, { status: 403 });
        }
        sharedWithCoach = true;
        sharedCoachId = coachId;
      } else {
        if (!authedMemberId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (resolvedMemberId && authedMemberId !== resolvedMemberId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        resolvedMemberId = authedMemberId;
        // Check if member has a coach for sharing
        const { data: memberInfo } = await supabaseCheck
          .from("members")
          .select("coach_id")
          .eq("id", authedMemberId)
          .single();
        sharedWithCoach = !!memberInfo?.coach_id;
        sharedCoachId = memberInfo?.coach_id ?? null;
      }
    }

    if (!resolvedMemberId) {
      return NextResponse.json({ error: "member_id is required" }, { status: 400 });
    }

    const normalizedResult: CalorieResult = {
      ...(typeof result === "object" && result !== null ? result : {}),
      shared_with_coach: sharedWithCoach,
      shared_coach_id: sharedCoachId,
    };

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("calorie_logs")
      .insert({
        member_id: resolvedMemberId,
        meal: meal.slice(0, 500),
        result: normalizedResult,
        category: category.slice(0, 50),
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
