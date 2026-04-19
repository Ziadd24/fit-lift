"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { create } from "zustand";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";
import { useListCalorieLogs, useListWorkouts, type CalorieLog, type ClientWorkout } from "@/lib/api-hooks";

export type DashboardPeriod = "7d" | "30d" | "90d" | "1y";

export type BodyMetricEntry = {
  id: string;
  metric: string;
  value: number;
  unit: string;
  source: string;
  recordedAt: string;
  note?: string | null;
};

export type CoachGoal = {
  id: string;
  label: string;
  metric: string;
  target: number;
  unit: string;
  dueDate?: string | null;
  updatedBy?: "coach" | "member";
  source?: string;
};

export type PersonalRecord = {
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

export type WearableConnection = {
  id: string;
  provider: string;
  status: "connected" | "manual" | "pending";
  lastSyncAt?: string | null;
};

export type ProgressProfile = {
  member_id: number;
  body_metrics: BodyMetricEntry[];
  coach_goals: CoachGoal[];
  personal_records: PersonalRecord[];
  wearable_connections: WearableConnection[];
  updated_by_role: string | null;
  updated_at?: string;
};

type ChartPoint = {
  key: string;
  label: string;
  shortLabel: string;
  value: number;
  previousValue: number;
  workouts: ClientWorkout[];
  dateLabel: string;
};

type GoalHistoryPoint = {
  label: string;
  current: number;
  target: number;
};

type PendingPatch = Partial<ProgressProfile> & {
  memberId: number;
  queuedAt: string;
};

type StoreState = {
  period: DashboardPeriod;
  showComparison: boolean;
  selectedPointKey: string | null;
  connectionState: "online" | "offline" | "syncing";
  pendingCount: number;
  setPeriod: (period: DashboardPeriod) => void;
  setShowComparison: (show: boolean) => void;
  setSelectedPointKey: (key: string | null) => void;
  setConnectionState: (state: StoreState["connectionState"]) => void;
  setPendingCount: (count: number) => void;
};

export const useProgressDashboardStore = create<StoreState>((set) => ({
  period: "30d",
  showComparison: true,
  selectedPointKey: null,
  connectionState: "online",
  pendingCount: 0,
  setPeriod: (period) => set({ period, selectedPointKey: null }),
  setShowComparison: (showComparison) => set({ showComparison }),
  setSelectedPointKey: (selectedPointKey) => set({ selectedPointKey }),
  setConnectionState: (connectionState) => set({ connectionState }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
}));

const CHANNEL_NAME = "fitlift-progress-dashboard";
const queueKey = (memberId: number) => `fitlift-progress-queue:${memberId}`;

function defaultProfile(memberId: number): ProgressProfile {
  return {
    member_id: memberId,
    body_metrics: [],
    coach_goals: [
      {
        id: "goal-calories",
        label: "Daily Calories",
        metric: "calories",
        target: 2200,
        unit: "kcal",
        updatedBy: "coach",
        source: "Nutrition logs",
      },
      {
        id: "goal-workouts",
        label: "Weekly Workouts",
        metric: "workouts",
        target: 5,
        unit: "",
        updatedBy: "coach",
        source: "Completed workouts",
      },
      {
        id: "goal-volume",
        label: "Weekly Training Volume",
        metric: "volume",
        target: 12000,
        unit: "kg",
        updatedBy: "coach",
        source: "Set x rep x weight",
      },
    ],
    personal_records: [],
    wearable_connections: [{ id: "manual", provider: "Manual Entry", status: "manual", lastSyncAt: null }],
    updated_by_role: "system",
  };
}

function mergeProfile(base: ProgressProfile, patch: Partial<ProgressProfile>): ProgressProfile {
  return {
    ...base,
    ...patch,
    body_metrics: patch.body_metrics ?? base.body_metrics,
    coach_goals: patch.coach_goals ?? base.coach_goals,
    personal_records: patch.personal_records ?? base.personal_records,
    wearable_connections: patch.wearable_connections ?? base.wearable_connections,
  };
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function readQueue(memberId: number): PendingPatch[] {
  if (typeof window === "undefined") return [];
  return safeJsonParse(window.localStorage.getItem(queueKey(memberId)), []);
}

function writeQueue(memberId: number, queue: PendingPatch[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(queueKey(memberId), JSON.stringify(queue));
}

function triggerHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(14);
  }
}

function parseNumericReps(reps: unknown) {
  if (typeof reps === "number") return reps;
  if (typeof reps !== "string") return 0;
  const match = reps.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function getCompletedSetCount(setEntry: Record<string, any>) {
  if (Array.isArray(setEntry.completedSets)) {
    return setEntry.completedSets.filter(Boolean).length;
  }
  if (typeof setEntry.sets === "number" && setEntry.done) return setEntry.sets;
  return 0;
}

function getTotalSetCount(setEntry: Record<string, any>) {
  if (typeof setEntry.sets === "number") return setEntry.sets;
  if (Array.isArray(setEntry.completedSets)) return setEntry.completedSets.length;
  return 0;
}

function extractWorkoutStats(workouts: ClientWorkout[]) {
  let totalSets = 0;
  let completedSets = 0;
  let totalVolume = 0;
  const attemptsByExercise = new Map<string, PersonalRecord["attempts"]>();

  const completedWorkouts = workouts.filter((workout) => {
    if (workout.status === "completed" || workout.status === "done") return true;
    const sets = Array.isArray(workout.sets) ? workout.sets : [];
    return sets.some((entry) => getCompletedSetCount(entry as Record<string, any>) > 0);
  });

  workouts.forEach((workout) => {
    const sets = Array.isArray(workout.sets) ? workout.sets : [];
    sets.forEach((entry) => {
      const row = entry as Record<string, any>;
      const setCount = getTotalSetCount(row);
      const doneCount = getCompletedSetCount(row);
      const reps = parseNumericReps(row.reps);
      const weight = Number(row.weight || 0);
      const exercise = typeof row.exercise === "string" ? row.exercise : "Exercise";
      totalSets += setCount;
      completedSets += doneCount;
      totalVolume += Math.max(doneCount || setCount, 0) * reps * Math.max(weight, 0);
      const attempts = attemptsByExercise.get(exercise) || [];
      attempts.push({
        weight,
        reps,
        achievedAt: workout.created_at,
        workoutId: workout.id,
      });
      attemptsByExercise.set(exercise, attempts);
    });
  });

  return { totalSets, completedSets, totalVolume, completedWorkouts, attemptsByExercise };
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function computeStreak(workouts: ClientWorkout[]) {
  const days = new Set(
    workouts
      .filter((workout) => workout.status === "completed" || workout.status === "done")
      .map((workout) => startOfDay(new Date(workout.created_at)).toISOString())
  );

  let streak = 0;
  let cursor = startOfDay(new Date());
  while (days.has(cursor.toISOString())) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function buildChartPoints(workouts: ClientWorkout[], period: DashboardPeriod): ChartPoint[] {
  const now = new Date();
  const points: ChartPoint[] = [];

  if (period === "7d") {
    for (let index = 6; index >= 0; index -= 1) {
      const day = startOfDay(addDays(now, -index));
      const previousDay = startOfDay(addDays(day, -7));
      const currentWorkouts = workouts.filter((workout) => sameDay(new Date(workout.created_at), day));
      const previousWorkouts = workouts.filter((workout) => sameDay(new Date(workout.created_at), previousDay));
      points.push({
        key: day.toISOString(),
        label: day.toLocaleDateString(undefined, { weekday: "long" }),
        shortLabel: day.toLocaleDateString(undefined, { weekday: "short" }),
        value: extractWorkoutStats(currentWorkouts).totalVolume,
        previousValue: extractWorkoutStats(previousWorkouts).totalVolume,
        workouts: currentWorkouts,
        dateLabel: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      });
    }
    return points;
  }

  if (period === "30d") {
    for (let index = 5; index >= 0; index -= 1) {
      const end = startOfDay(addDays(now, -(index * 7)));
      const start = addDays(end, -6);
      const previousEnd = addDays(start, -1);
      const previousStart = addDays(previousEnd, -6);
      const currentWorkouts = workouts.filter((workout) => {
        const createdAt = new Date(workout.created_at).getTime();
        return createdAt >= start.getTime() && createdAt <= end.getTime() + 86400000 - 1;
      });
      const previousWorkouts = workouts.filter((workout) => {
        const createdAt = new Date(workout.created_at).getTime();
        return createdAt >= previousStart.getTime() && createdAt <= previousEnd.getTime() + 86400000 - 1;
      });
      points.push({
        key: `${start.toISOString()}-${end.toISOString()}`,
        label: `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
        shortLabel: `W${6 - index}`,
        value: extractWorkoutStats(currentWorkouts).totalVolume,
        previousValue: extractWorkoutStats(previousWorkouts).totalVolume,
        workouts: currentWorkouts,
        dateLabel: `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      });
    }
    return points;
  }

  if (period === "90d") {
    for (let index = 5; index >= 0; index -= 1) {
      const end = startOfDay(addDays(now, -(index * 14)));
      const start = addDays(end, -13);
      const previousEnd = addDays(start, -1);
      const previousStart = addDays(previousEnd, -13);
      const currentWorkouts = workouts.filter((workout) => {
        const createdAt = new Date(workout.created_at).getTime();
        return createdAt >= start.getTime() && createdAt <= end.getTime() + 86400000 - 1;
      });
      const previousWorkouts = workouts.filter((workout) => {
        const createdAt = new Date(workout.created_at).getTime();
        return createdAt >= previousStart.getTime() && createdAt <= previousEnd.getTime() + 86400000 - 1;
      });
      points.push({
        key: `${start.toISOString()}-${end.toISOString()}`,
        label: `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
        shortLabel: `${start.toLocaleDateString(undefined, { month: "short" })} ${start.getDate()}`,
        value: extractWorkoutStats(currentWorkouts).totalVolume,
        previousValue: extractWorkoutStats(previousWorkouts).totalVolume,
        workouts: currentWorkouts,
        dateLabel: `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      });
    }
    return points;
  }

  for (let index = 11; index >= 0; index -= 1) {
    const monthDate = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), -index);
    const previousMonthDate = addMonths(monthDate, -12);
    const currentWorkouts = workouts.filter((workout) => {
      const createdAt = new Date(workout.created_at);
      return createdAt.getFullYear() === monthDate.getFullYear() && createdAt.getMonth() === monthDate.getMonth();
    });
    const previousWorkouts = workouts.filter((workout) => {
      const createdAt = new Date(workout.created_at);
      return createdAt.getFullYear() === previousMonthDate.getFullYear() && createdAt.getMonth() === previousMonthDate.getMonth();
    });
    points.push({
      key: monthDate.toISOString(),
      label: monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      shortLabel: monthDate.toLocaleDateString(undefined, { month: "short" }),
      value: extractWorkoutStats(currentWorkouts).totalVolume,
      previousValue: extractWorkoutStats(previousWorkouts).totalVolume,
      workouts: currentWorkouts,
      dateLabel: monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    });
  }
  return points;
}

function movingAverage(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function deriveBodyMetricCards(metrics: BodyMetricEntry[]) {
  const grouped = new Map<string, BodyMetricEntry[]>();
  metrics.forEach((metric) => {
    const list = grouped.get(metric.metric) || [];
    list.push(metric);
    grouped.set(metric.metric, list);
  });

  return Array.from(grouped.entries()).map(([label, entries]) => {
    const sorted = [...entries].sort((a, b) => +new Date(a.recordedAt) - +new Date(b.recordedAt));
    const latest = sorted[sorted.length - 1];
    const recent = sorted.slice(-3).map((entry) => entry.value);
    const previous = sorted.slice(-6, -3).map((entry) => entry.value);
    const trendValue = movingAverage(recent) - movingAverage(previous.length ? previous : recent);
    return {
      label,
      latest,
      trendValue,
      rising: trendValue >= 0,
      history: sorted.map((entry) => entry.value),
    };
  });
}

function derivePersonalRecords(profileRecords: PersonalRecord[], attemptsByExercise: Map<string, PersonalRecord["attempts"]>) {
  const autoRecords = Array.from(attemptsByExercise.entries()).map(([exercise, attempts]) => {
    const sorted = [...(attempts || [])].sort((a, b) => b.weight - a.weight || +new Date(b.achievedAt) - +new Date(a.achievedAt));
    return {
      id: `auto-${exercise}`,
      exercise,
      weight: sorted[0]?.weight || 0,
      unit: "kg",
      achievedAt: sorted[0]?.achievedAt || new Date().toISOString(),
      attempts: sorted.slice(0, 8),
      sourceWorkoutId: sorted[0]?.workoutId || null,
      videoUrl: null,
      notes: null,
    } satisfies PersonalRecord;
  });

  const merged = new Map<string, PersonalRecord>();
  autoRecords.forEach((record) => merged.set(record.exercise.toLowerCase(), record));
  profileRecords.forEach((record) => {
    const key = record.exercise.toLowerCase();
    const existing = merged.get(key);
    merged.set(key, {
      ...existing,
      ...record,
      attempts: record.attempts?.length ? record.attempts : existing?.attempts,
    });
  });

  return Array.from(merged.values()).sort((a, b) => b.weight - a.weight);
}

function getCurrentForGoal(metric: string, context: { dailyCalories: number; weeklyWorkouts: number; weeklyVolume: number; latestWeight?: number }) {
  switch (metric) {
    case "calories":
      return context.dailyCalories;
    case "workouts":
      return context.weeklyWorkouts;
    case "volume":
      return context.weeklyVolume;
    case "body_weight":
      return context.latestWeight ?? 0;
    default:
      return 0;
  }
}

function buildGoalHistory(
  goals: CoachGoal[],
  period: DashboardPeriod,
  chartPoints: ChartPoint[],
  calorieLogs: CalorieLog[],
  bodyMetricCards: Array<{ label: string; history: number[] }>
) {
  const today = startOfDay(new Date());
  return goals.map((goal) => {
    let history: GoalHistoryPoint[] = [];

    if (goal.metric === "volume" || goal.metric === "workouts") {
      history = chartPoints.map((point) => ({
        label: point.shortLabel,
        current: goal.metric === "volume" ? point.value : point.workouts.length,
        target: goal.target,
      }));
    } else if (goal.metric === "calories") {
      const dayCount = period === "7d" ? 7 : period === "30d" ? 6 : period === "90d" ? 6 : 12;
      const step = period === "1y" ? 30 : period === "90d" ? 14 : period === "30d" ? 5 : 1;
      history = Array.from({ length: dayCount }).map((_, index) => {
        const offset = (dayCount - 1 - index) * step;
        const day = startOfDay(addDays(today, -offset));
        const nextDay = addDays(day, step);
        const calories = calorieLogs
          .filter((log) => {
            const createdAt = +new Date(log.created_at);
            return createdAt >= day.getTime() && createdAt < nextDay.getTime();
          })
          .reduce((sum, log) => sum + (log.result?.totals?.calories || 0), 0);
        return {
          label: step === 1 ? day.toLocaleDateString(undefined, { weekday: "short" }) : day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          current: calories,
          target: goal.target,
        };
      });
    } else if (goal.metric === "body_weight") {
      const weightHistory = bodyMetricCards.find((metric) => metric.label === "Body Weight")?.history || [];
      history = weightHistory.slice(-6).map((value, index) => ({
        label: `P${index + 1}`,
        current: value,
        target: goal.target,
      }));
    }

    return { goalId: goal.id, metric: goal.metric, points: history };
  });
}

export function useProgressDashboard(memberId?: number) {
  const { currentMember, memberCode, coachToken, adminToken } = useAuth();
  const queryClient = useQueryClient();
  const {
    period,
    showComparison,
    selectedPointKey,
    connectionState,
    pendingCount,
    setPeriod,
    setShowComparison,
    setSelectedPointKey,
    setConnectionState,
    setPendingCount,
  } = useProgressDashboardStore();

  const resolvedMemberId = memberId || currentMember?.id;
  const token = adminToken || coachToken || memberCode || currentMember?.membership_code;
  const channelRef = useRef<BroadcastChannel | null>(null);

  const profileQuery = useQuery<ProgressProfile>({
    queryKey: ["progress_profile", resolvedMemberId],
    queryFn: async () => {
      const qs = resolvedMemberId ? `?memberId=${resolvedMemberId}` : "";
      const response = await fetch(`/api/progress${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to load progress profile");
      return response.json();
    },
    enabled: !!resolvedMemberId && !!token,
  });

  const { data: workouts = [], isLoading: workoutsLoading } = useListWorkouts(resolvedMemberId);
  const { data: calorieLogs = [], isLoading: calorieLoading } = useListCalorieLogs(resolvedMemberId);


  useEffect(() => {
    if (!resolvedMemberId || typeof window === "undefined") return;
    setPendingCount(readQueue(resolvedMemberId).length);
  }, [resolvedMemberId, setPendingCount]);

  const flushQueue = useCallback(async () => {
    if (!resolvedMemberId || !token || typeof window === "undefined") return;
    const queue = readQueue(resolvedMemberId);
    if (!queue.length || !navigator.onLine) return;

    setConnectionState("syncing");
    for (const patch of queue) {
      const response = await fetch("/api/progress", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        setConnectionState("offline");
        return;
      }
    }

    writeQueue(resolvedMemberId, []);
    setPendingCount(0);
    setConnectionState("online");
    queryClient.invalidateQueries({ queryKey: ["progress_profile", resolvedMemberId] });
  }, [queryClient, resolvedMemberId, setConnectionState, setPendingCount, token]);

  const saveProfilePatch = useCallback(async (patch: Partial<ProgressProfile>) => {
    if (!resolvedMemberId || !token) return;
    triggerHaptic();

    queryClient.setQueryData<ProgressProfile>(["progress_profile", resolvedMemberId], (current) =>
      mergeProfile(current || defaultProfile(resolvedMemberId), patch)
    );

    channelRef.current?.postMessage({ type: "profile-patch", memberId: resolvedMemberId, patch });

    if (!navigator.onLine) {
      const queue = [...readQueue(resolvedMemberId), { ...patch, memberId: resolvedMemberId, queuedAt: new Date().toISOString() }];
      writeQueue(resolvedMemberId, queue);
      setPendingCount(queue.length);
      setConnectionState("offline");
      return;
    }

    setConnectionState("syncing");
    const response = await fetch("/api/progress", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...patch, memberId: resolvedMemberId }),
    });

    if (!response.ok) {
      const queue = [...readQueue(resolvedMemberId), { ...patch, memberId: resolvedMemberId, queuedAt: new Date().toISOString() }];
      writeQueue(resolvedMemberId, queue);
      setPendingCount(queue.length);
      setConnectionState("offline");
      return;
    }

    const data = (await response.json()) as ProgressProfile;
    queryClient.setQueryData(["progress_profile", resolvedMemberId], data);
    setConnectionState("online");
  }, [queryClient, resolvedMemberId, setConnectionState, setPendingCount, token]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current.onmessage = (event) => {
      const payload = event.data;
      if (!payload || payload.memberId !== resolvedMemberId || payload.type !== "profile-patch") return;
      queryClient.setQueryData<ProgressProfile>(["progress_profile", resolvedMemberId], (current) =>
        mergeProfile(current || defaultProfile(resolvedMemberId || 0), payload.patch)
      );
    };

    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [queryClient, resolvedMemberId]);

  useEffect(() => {
    if (!resolvedMemberId) return;

    const onOnline = () => {
      setConnectionState("online");
      flushQueue();
    };
    const onOffline = () => setConnectionState("offline");

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [flushQueue, resolvedMemberId, setConnectionState]);

  useEffect(() => {
    if (!resolvedMemberId) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["client_workouts", resolvedMemberId] });
      queryClient.invalidateQueries({ queryKey: ["calorie_logs", resolvedMemberId] });
      queryClient.invalidateQueries({ queryKey: ["messages", resolvedMemberId] });
      queryClient.invalidateQueries({ queryKey: ["progress_profile", resolvedMemberId] });
    };

    const channel = supabase
      .channel(`progress-live-${resolvedMemberId}`)
      .on("postgres_changes" as any, {
        event: "*",
        schema: "public",
        table: "client_workouts",
        filter: `member_id=eq.${resolvedMemberId}`,
      }, invalidate)
      .on("postgres_changes" as any, {
        event: "*",
        schema: "public",
        table: "calorie_logs",
        filter: `member_id=eq.${resolvedMemberId}`,
      }, invalidate)

      .on("postgres_changes" as any, {
        event: "*",
        schema: "public",
        table: "member_progress_profiles",
        filter: `member_id=eq.${resolvedMemberId}`,
      }, invalidate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, resolvedMemberId]);

  const derived = useMemo(() => {
    const profile = profileQuery.data || (resolvedMemberId ? defaultProfile(resolvedMemberId) : null);
    const workoutStats = extractWorkoutStats(workouts);
    const chartPoints = buildChartPoints(workouts, period);
    const selectedPoint = chartPoints.find((point) => point.key === selectedPointKey) || chartPoints[chartPoints.length - 1] || null;
    const bodyMetricCards = deriveBodyMetricCards(profile?.body_metrics || []);
    const latestWeight = bodyMetricCards.find((metric) => metric.label === "Body Weight")?.latest.value;
    const today = startOfDay(new Date());
    const dailyCalories = calorieLogs
      .filter((log) => sameDay(new Date(log.created_at), today))
      .reduce((sum, log) => sum + (log.result?.totals?.calories || 0), 0);
    const weeklyWorkouts = workouts.filter((workout) => new Date(workout.created_at) >= addDays(today, -6)).length;
    const weeklyVolume = chartPoints[chartPoints.length - 1]?.value || 0;
    const personalRecords = derivePersonalRecords(profile?.personal_records || [], workoutStats.attemptsByExercise);
    const goals = (profile?.coach_goals || []).map((goal) => {
      const current = getCurrentForGoal(goal.metric, { dailyCalories, weeklyWorkouts, weeklyVolume, latestWeight });
      const completion = goal.target > 0 ? Math.min(current / goal.target, 1.4) : 0;
      const risk = completion >= 0.9 ? "safe" : completion >= 0.65 ? "watch" : "at-risk";
      return { ...goal, current, completion, risk };
    });
    const goalHistory = buildGoalHistory(profile?.coach_goals || [], period, chartPoints, calorieLogs, bodyMetricCards);

    const caloriesBurned = workouts.reduce((sum, workout) => sum + Number(workout.calories || 0), 0);
    const efficiency = workoutStats.totalSets ? Math.round((workoutStats.completedSets / workoutStats.totalSets) * 100) : 0;
    const streak = computeStreak(workouts);
    const coachReviewCount = 0;
    const newCoachReviewCount = 0;

    return {
      profile,
      chartPoints,
      selectedPoint,
      bodyMetricCards,
      personalRecords,
      goals,
      goalHistory,
      workoutsDone: workoutStats.completedWorkouts.length,
      caloriesBurned,
      efficiency,
      streak,
      coachReviewCount,
      newCoachReviewCount,
      weeklyVolume,
      activitySources: {
        workouts: workouts.length,
        calories: calorieLogs.length,
        messages: 0,
      },
    };
  }, [calorieLogs, period, profileQuery.data, resolvedMemberId, selectedPointKey, workouts]);

  const addBodyMetric = useCallback(async (entry: Omit<BodyMetricEntry, "id" | "recordedAt"> & { recordedAt?: string }) => {
    if (!derived.profile) return;
    const value = Number(entry.value);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Please enter a valid metric value");
    }
    const nextMetrics = [
      ...derived.profile.body_metrics,
      {
        ...entry,
        id: `metric-${Date.now()}`,
        recordedAt: entry.recordedAt || new Date().toISOString(),
      },
    ];
    await saveProfilePatch({ body_metrics: nextMetrics });
  }, [derived.profile, saveProfilePatch]);

  const saveGoals = useCallback(async (goals: CoachGoal[]) => {
    if (!derived.profile) return;
    await saveProfilePatch({ coach_goals: goals });
  }, [derived.profile, saveProfilePatch]);

  const addPersonalRecord = useCallback(async (record: Omit<PersonalRecord, "id" | "achievedAt"> & { achievedAt?: string }) => {
    if (!derived.profile) return;
    const weight = Number(record.weight);
    if (!Number.isFinite(weight) || weight <= 0) {
      throw new Error("Please enter a valid PR weight");
    }
    const nextRecords = [
      ...derived.profile.personal_records,
      {
        ...record,
        id: `pr-${Date.now()}`,
        achievedAt: record.achievedAt || new Date().toISOString(),
      },
    ];
    await saveProfilePatch({ personal_records: nextRecords });
  }, [derived.profile, saveProfilePatch]);

  return {
    period,
    showComparison,
    selectedPointKey,
    connectionState,
    pendingCount,
    setPeriod,
    setShowComparison,
    setSelectedPointKey,
    saveGoals,
    addBodyMetric,
    addPersonalRecord,
    flushQueue,
    isLoading: profileQuery.isLoading || workoutsLoading || calorieLoading,
    isError: profileQuery.isError,
    ...derived,
  };
}
