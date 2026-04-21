import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, verifyCoachAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type BodyMetricEntry = {
  id: string;
  metric: string;
  value: number;
  unit: string;
  source: string;
  recordedAt: string;
  note?: string | null;
};

type CoachGoal = {
  id: string;
  label: string;
  metric: string;
  target: number;
  unit: string;
  dueDate?: string | null;
  updatedBy?: "coach" | "member";
  source?: string;
};

type PersonalRecord = {
  id: string;
  exercise: string;
  weight: number;
  unit: string;
  achievedAt: string;
  videoUrl?: string | null;
  sourceWorkoutId?: number | null;
  notes?: string | null;
  attempts?: Array<{
    weight: number;
    reps?: number | null;
    achievedAt: string;
    workoutId?: number | null;
  }>;
};

type WearableConnection = {
  id: string;
  provider: string;
  status: "connected" | "manual" | "pending";
  lastSyncAt?: string | null;
};

type ProgressProfile = {
  member_id: number;
  body_metrics: BodyMetricEntry[];
  coach_goals: CoachGoal[];
  personal_records: PersonalRecord[];
  wearable_connections: WearableConnection[];
  updated_by_role: string | null;
  updated_at?: string;
};

const DEFAULT_PROFILE = (memberId: number): ProgressProfile => ({
  member_id: memberId,
  body_metrics: [],
  coach_goals: [
    {
      id: "goal-calories",
      label: "Daily Calories",
      metric: "calories",
      target: 2200,
      unit: "kcal",
      dueDate: null,
      updatedBy: "coach",
      source: "Nutrition logs",
    },
    {
      id: "goal-protein",
      label: "Daily Protein",
      metric: "protein",
      target: 180,
      unit: "g",
      dueDate: null,
      updatedBy: "coach",
      source: "Nutrition logs",
    },
    {
      id: "goal-carbs",
      label: "Daily Carbs",
      metric: "carbs",
      target: 220,
      unit: "g",
      dueDate: null,
      updatedBy: "coach",
      source: "Nutrition logs",
    },
    {
      id: "goal-fat",
      label: "Daily Fat",
      metric: "fat",
      target: 70,
      unit: "g",
      dueDate: null,
      updatedBy: "coach",
      source: "Nutrition logs",
    },
    {
      id: "goal-workouts",
      label: "Weekly Workouts",
      metric: "workouts",
      target: 5,
      unit: "",
      dueDate: null,
      updatedBy: "coach",
      source: "Completed workouts",
    },
    {
      id: "goal-volume",
      label: "Weekly Training Volume",
      metric: "volume",
      target: 12000,
      unit: "kg",
      dueDate: null,
      updatedBy: "coach",
      source: "Set x rep x weight",
    },
  ],
  personal_records: [],
  wearable_connections: [
    { id: "wearable-manual", provider: "Manual Entry", status: "manual", lastSyncAt: null },
  ],
  updated_by_role: "system",
});

function isMissingTableError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || error.message?.toLowerCase().includes("member_progress_profiles") || false;
}

async function resolveMemberAccess(req: NextRequest, requestedMemberId?: number | null) {
  const supabase = getSupabaseAdmin();
  const coachId = verifyCoachAuth(req);
  const isAdmin = verifyAdminAuth(req);

  if (coachId || isAdmin) {
    if (!requestedMemberId) {
      return { error: NextResponse.json({ error: "memberId is required" }, { status: 400 }) };
    }
    if (coachId) {
      const { data: member } = await supabase
        .from("members")
        .select("id")
        .eq("id", requestedMemberId)
        .eq("coach_id", coachId)
        .single();
      if (!member) {
        return { error: NextResponse.json({ error: "Member not in your roster" }, { status: 403 }) };
      }
    }
    return {
      memberId: requestedMemberId,
      role: coachId ? "coach" : "admin",
      supabase,
    };
  }

  const authHeader = req.headers.get("Authorization");
  const memberCode = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!memberCode) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  let query = supabase
    .from("members")
    .select("id")
    .eq("membership_code", memberCode);

  if (requestedMemberId) {
    query = query.eq("id", requestedMemberId);
  }

  const { data: member } = await query.single();
  if (!member) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { memberId: member.id as number, role: "member", supabase };
}

function sanitizeMetrics(metrics: unknown): BodyMetricEntry[] {
  if (!Array.isArray(metrics)) return [];
  return metrics
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const value = Number(item.value);
      if (!item.metric || !Number.isFinite(value)) return null;
      return {
        id: String(item.id || `${item.metric}-${item.recordedAt || Date.now()}`),
        metric: String(item.metric).slice(0, 80),
        value,
        unit: String(item.unit || "").slice(0, 12),
        source: String(item.source || "manual").slice(0, 40),
        recordedAt: String(item.recordedAt || new Date().toISOString()),
        note: item.note ? String(item.note).slice(0, 300) : null,
      };
    })
    .filter(Boolean) as BodyMetricEntry[];
}

function sanitizeGoals(goals: unknown): CoachGoal[] {
  if (!Array.isArray(goals)) return [];
  return goals
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const target = Number(item.target);
      if (!item.label || !item.metric || !Number.isFinite(target)) return null;
      return {
        id: String(item.id || `${item.metric}-${Date.now()}`),
        label: String(item.label).slice(0, 80),
        metric: String(item.metric).slice(0, 40),
        target,
        unit: String(item.unit || "").slice(0, 20),
        dueDate: item.dueDate ? String(item.dueDate).slice(0, 40) : null,
        updatedBy: item.updatedBy === "member" ? "member" : "coach",
        source: item.source ? String(item.source).slice(0, 80) : undefined,
      };
    })
    .filter(Boolean) as CoachGoal[];
}

function sanitizeRecords(records: unknown): PersonalRecord[] {
  if (!Array.isArray(records)) return [];
  return records
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const weight = Number(item.weight);
      if (!item.exercise || !Number.isFinite(weight)) return null;
      const attempts = Array.isArray(item.attempts)
        ? item.attempts
            .map((attempt) => {
              const row = attempt as Record<string, unknown>;
              const attemptWeight = Number(row.weight);
              if (!Number.isFinite(attemptWeight)) return null;
              return {
                weight: attemptWeight,
                reps: row.reps == null ? null : Number(row.reps),
                achievedAt: String(row.achievedAt || item.achievedAt || new Date().toISOString()),
                workoutId: row.workoutId == null ? null : Number(row.workoutId),
              };
            })
            .filter(Boolean)
        : [];
      return {
        id: String(item.id || `${item.exercise}-${Date.now()}`),
        exercise: String(item.exercise).slice(0, 120),
        weight,
        unit: String(item.unit || "kg").slice(0, 12),
        achievedAt: String(item.achievedAt || new Date().toISOString()),
        videoUrl: item.videoUrl ? String(item.videoUrl).slice(0, 500) : null,
        sourceWorkoutId: item.sourceWorkoutId == null ? null : Number(item.sourceWorkoutId),
        notes: item.notes ? String(item.notes).slice(0, 500) : null,
        attempts: attempts as PersonalRecord["attempts"],
      };
    })
    .filter(Boolean) as PersonalRecord[];
}

function sanitizeWearables(wearables: unknown): WearableConnection[] {
  if (!Array.isArray(wearables)) return [];
  return wearables
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      if (!item.provider) return null;
      return {
        id: String(item.id || `${item.provider}-${Date.now()}`),
        provider: String(item.provider).slice(0, 80),
        status: item.status === "connected" || item.status === "pending" ? item.status : "manual",
        lastSyncAt: item.lastSyncAt ? String(item.lastSyncAt).slice(0, 40) : null,
      };
    })
    .filter(Boolean) as WearableConnection[];
}

function mergeProfile(existing: ProgressProfile, patch: Partial<ProgressProfile>, role: string): ProgressProfile {
  return {
    ...existing,
    body_metrics: patch.body_metrics ? sanitizeMetrics(patch.body_metrics) : existing.body_metrics,
    coach_goals: patch.coach_goals ? sanitizeGoals(patch.coach_goals) : existing.coach_goals,
    personal_records: patch.personal_records ? sanitizeRecords(patch.personal_records) : existing.personal_records,
    wearable_connections: patch.wearable_connections
      ? sanitizeWearables(patch.wearable_connections)
      : existing.wearable_connections,
    updated_by_role: role,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedMemberId = searchParams.get("memberId");
  const access = await resolveMemberAccess(req, requestedMemberId ? Number(requestedMemberId) : null);
  if ("error" in access) return access.error;

  const { memberId, supabase } = access;
  const { data, error } = await supabase
    .from("member_progress_profiles")
    .select("*")
    .eq("member_id", memberId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(DEFAULT_PROFILE(memberId));
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    data || DEFAULT_PROFILE(memberId)
  );
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const requestedMemberId = body.memberId ? Number(body.memberId) : null;
  const access = await resolveMemberAccess(req, requestedMemberId);
  if ("error" in access) return access.error;

  const { memberId, supabase, role } = access;
  const { data: existing, error: existingError } = await supabase
    .from("member_progress_profiles")
    .select("*")
    .eq("member_id", memberId)
    .maybeSingle();

  if (isMissingTableError(existingError)) {
    return NextResponse.json(mergeProfile(DEFAULT_PROFILE(memberId), body, role));
  }

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const merged = mergeProfile(existing || DEFAULT_PROFILE(memberId), body, role);
  const { data, error } = await supabase
    .from("member_progress_profiles")
    .upsert({
      member_id: memberId,
      body_metrics: merged.body_metrics,
      coach_goals: merged.coach_goals,
      personal_records: merged.personal_records,
      wearable_connections: merged.wearable_connections,
      updated_by_role: role,
      updated_at: new Date().toISOString(),
    }, { onConflict: "member_id" })
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(merged);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
