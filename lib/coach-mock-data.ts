/**
 * coach-mock-data.ts
 * ---------------------------------------------------------
 * Single source of truth for all "demo / placeholder" data
 * shown on the Coach (Captain) dashboard.
 *
 * To swap the coach profile or add clients, only change
 * this file — the UI components read from these objects.
 */

import { Activity, Dumbbell, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { WorkoutExercise } from "@/components/ui/WorkoutExerciseCard";

/* ─── Activity Item Shape ───────────────────────────────── */
export interface ActivityItem {
  id: number;
  title: string;
  sub: string;
  /** Lucide icon component */
  icon: LucideIcon;
  iconBg: string;
  /** 0–100 completion % */
  pct: number;
}

/* ─── Dashboard Period Snapshots ────────────────────────── */
export interface PeriodSnapshot {
  overview: {
    total: string;
    calories: string;
    protein: string;
    carbs: string;
    ring: { pct: number; color: string }[];
  };
  output: {
    cal: { val: string; data: number[] };
    weight: { val: string; data: number[] };
  };
}

/* ─── Default Activity List ─────────────────────────────── */
export const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: 1,
    title: "Squats",
    sub: "10 sets of squats",
    icon: Dumbbell,
    iconBg: "#8B5CF6",
    pct: 80,
  },
  {
    id: 2,
    title: "Low Lunges",
    sub: "3 sets × 12 reps",
    icon: Activity,
    iconBg: "#F59E0B",
    pct: 60,
  },
  {
    id: 3,
    title: "Battling Rope",
    sub: "5 min intervals",
    icon: TrendingUp,
    iconBg: "#10B981",
    pct: 45,
  },
];

/* ─── Featured Activity Banner ──────────────────────────── */
export const FEATURED_ACTIVITY = {
  label: "MMA",
  value: "1,250",
  unit: "Sets/Week",
  gradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
};

/* ─── Period Data ────────────────────────────────────────── */
export const PERIOD_DATA: Record<"Day" | "Week" | "Month", PeriodSnapshot> = {
  Day: {
    overview: {
      total: "+5%",
      calories: "+1.2%",
      protein: "+0.5%",
      carbs: "+1.8%",
      ring: [
        { pct: 0.5, color: "#7CFC00" },
        { pct: 0.3, color: "#8B5CF6" },
        { pct: 0.2, color: "#F59E0B" },
      ],
    },
    output: {
      cal: { val: "-400 kcal", data: [2, 4, 3, 5, 4, 7, 6, 8, 5] },
      weight: { val: "-0.2 kg", data: [8, 7.9, 7.9, 7.8, 7.8, 7.7, 7.7, 7.6, 7.6] },
    },
  },
  Week: {
    overview: {
      total: "+23%",
      calories: "+1.25%",
      protein: "+3.43%",
      carbs: "+2.12%",
      ring: [
        { pct: 0.6, color: "#7CFC00" },
        { pct: 0.25, color: "#8B5CF6" },
        { pct: 0.15, color: "#F59E0B" },
      ],
    },
    output: {
      cal: { val: "-1,234 kcal", data: [4, 7, 3, 9, 6, 11, 8, 13, 10] },
      weight: { val: "-1.2 kg", data: [10, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.8] },
    },
  },
  Month: {
    overview: {
      total: "+45%",
      calories: "+5.2%",
      protein: "+8.1%",
      carbs: "+6.4%",
      ring: [
        { pct: 0.4, color: "#7CFC00" },
        { pct: 0.4, color: "#8B5CF6" },
        { pct: 0.2, color: "#F59E0B" },
      ],
    },
    output: {
      cal: { val: "-5,400 kcal", data: [3, 8, 6, 12, 10, 16, 14, 20, 18] },
      weight: { val: "-3.5 kg", data: [12, 11, 9, 8.5, 7, 6, 5.5, 4, 3] },
    },
  },
};

/* ─── Example Workout Exercises (shown in Coach page) ───── */
export const DEMO_EXERCISES: WorkoutExercise[] = [
  {
    id: "barbell-bench-press",
    name: "Barbell Bench Press",
    iconEmoji: "🏋️",
    durationMinutes: 3,
    type: "Unilateral",
    sets: [
      { id: 1, previous: "5 x 50kg", reps: 5, kg: 55, completed: true },
      { id: 2, previous: "5 x 70kg", reps: 5, kg: 75, completed: true },
      { id: 3, previous: "5 x 85kg", reps: 7, kg: 85, completed: true },
      { id: 4, previous: "6 x 90kg", reps: 7, kg: 90, completed: true },
    ],
  },
  {
    id: "barbell-squat",
    name: "Barbell Back Squat",
    iconEmoji: "🦵",
    durationMinutes: 4,
    type: "Bilateral",
    sets: [
      { id: 1, previous: "5 x 60kg", reps: 5, kg: 70, completed: false },
      { id: 2, previous: "5 x 80kg", reps: 5, kg: 90, completed: false },
      { id: 3, previous: "5 x 100kg", reps: 5, kg: 100, completed: false },
    ],
  },
];
