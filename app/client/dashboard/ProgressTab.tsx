"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, BarChart2, Eye, EyeOff, Flame, Info, Plus, Signal, Star, Target, TrendingDown, TrendingUp, Trophy, WifiOff, Zap } from "lucide-react";
import { useProgressDashboard, type CoachGoal } from "@/lib/use-progress-dashboard";
import { SECONDARY_TEXT_COLOR, TOUCH_TARGET_SIZE } from "@/lib/accessibility";
import { LazyRenderSection, SkeletonBlock, useDashboardMotion } from "@/lib/performance";

function cardStyle() {
  return {
    background: "#16161A",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 18,
  } as React.CSSProperties;
}

function statusTone(state: "online" | "offline" | "syncing") {
  if (state === "offline") return { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.22)", color: "#FCA5A5", label: "Offline queue" };
  if (state === "syncing") return { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.22)", color: "#FDE68A", label: "Syncing" };
  return { bg: "rgba(124,252,0,0.12)", border: "rgba(124,252,0,0.22)", color: "#B9FF8B", label: "Realtime live" };
}

function ProgressLoadingState() {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <div style={cardStyle()}>
        <SkeletonBlock width={220} height={26} />
        <SkeletonBlock width="52%" height={14} style={{ marginTop: 10 }} />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} style={cardStyle()}>
            <SkeletonBlock width={38} height={38} radius={12} />
            <SkeletonBlock width="55%" height={28} style={{ marginTop: 12 }} />
            <SkeletonBlock width="72%" height={14} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
      <div style={{ ...cardStyle(), minHeight: 360 }}>
        <SkeletonBlock width={180} height={20} />
        <SkeletonBlock width="100%" height={240} style={{ marginTop: 18 }} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SkeletonBlock width="100%" height={280} style={{ background: "#16161A" }} />
        <SkeletonBlock width="100%" height={280} style={{ background: "#16161A" }} />
      </div>
    </div>
  );
}

function GoalHistoryChart({ points }: { points: Array<{ label: string; current: number; target: number }> }) {
  if (!points.length) {
    return <div style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>Not enough history yet.</div>;
  }

  const width = 220;
  const height = 72;
  const max = Math.max(...points.flatMap((point) => [point.current, point.target]), 1);
  const x = (index: number) => (index / Math.max(points.length - 1, 1)) * (width - 8) + 4;
  const y = (value: number) => height - (value / max) * (height - 16) - 8;
  const currentPath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.current)}`).join(" ");
  const targetPath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.target)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 72 }}>
      <path d={targetPath} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={2} strokeDasharray="4 5" />
      <path d={currentPath} fill="none" stroke="#7CFC00" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendChart({
  points,
  selectedKey,
  showComparison,
  onSelect,
  hoveredKey,
  onHover,
}: {
  points: Array<{ key: string; shortLabel: string; value: number; previousValue: number }>;
  selectedKey: string | null;
  showComparison: boolean;
  onSelect: (key: string) => void;
  hoveredKey: string | null;
  onHover: (key: string | null) => void;
}) {
  const width = 680;
  const height = 200;
  const pad = { top: 14, right: 14, bottom: 28, left: 36 };
  const chartWidth = width - pad.left - pad.right;
  const chartHeight = height - pad.top - pad.bottom;
  const max = Math.max(...points.flatMap((point) => [point.value, point.previousValue]), 1);
  const x = (index: number) => pad.left + (index / Math.max(points.length - 1, 1)) * chartWidth;
  const y = (value: number) => pad.top + chartHeight - (value / max) * chartHeight;
  const buildPath = (values: number[]) => values.map((value, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(value)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7CFC00" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7CFC00" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((step) => {
        const lineY = pad.top + chartHeight - chartHeight * step;
        return <line key={step} x1={pad.left} x2={width - pad.right} y1={lineY} y2={lineY} stroke="rgba(255,255,255,0.05)" />;
      })}
      <path d={`${buildPath(points.map((point) => point.value))} L ${x(points.length - 1)} ${pad.top + chartHeight} L ${x(0)} ${pad.top + chartHeight} Z`} fill="url(#progressFill)" />
      {showComparison && <path d={buildPath(points.map((point) => point.previousValue))} fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth={2} strokeDasharray="6 6" />}
      <path d={buildPath(points.map((point) => point.value))} fill="none" stroke="#7CFC00" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, index) => (
        <g
          key={point.key}
          onClick={() => onSelect(point.key)}
          onMouseEnter={() => onHover(point.key)}
          onMouseLeave={() => onHover(null)}
          style={{ cursor: "pointer" }}
        >
          <circle cx={x(index)} cy={y(point.value)} r={selectedKey === point.key || hoveredKey === point.key ? 7 : 5} fill={selectedKey === point.key || hoveredKey === point.key ? "#FFFFFF" : "#7CFC00"} stroke="#111114" strokeWidth={2} />
          <text x={x(index)} y={height - 8} textAnchor="middle" fill={selectedKey === point.key ? "#FFFFFF" : "#74747A"} fontSize={11}>
            {point.shortLabel}
          </text>
        </g>
      ))}
    </svg>
  );
}

function promptForMetric() {
  const metric = window.prompt("Metric name", "Body Weight");
  if (!metric) return null;
  const valueRaw = window.prompt("Value", "78.4");
  if (!valueRaw) return null;
  const unit = window.prompt("Unit", metric === "Body Fat" ? "%" : "kg") || "";
  const source = window.prompt("Source", "manual") || "manual";
  return { metric, value: Number(valueRaw), unit, source, note: null };
}

function promptForRecord() {
  const exercise = window.prompt("Exercise", "Squat");
  if (!exercise) return null;
  const weight = window.prompt("Best weight", "120");
  if (!weight) return null;
  const videoUrl = window.prompt("Video evidence URL (optional)", "") || null;
  const notes = window.prompt("Notes (optional)", "") || null;
  return { exercise, weight: Number(weight), unit: "kg", videoUrl, notes };
}

function promptForGoals(goals: Array<CoachGoal & { current: number; completion: number; risk: string }>) {
  return goals.map((goal) => {
    const nextValue = window.prompt(`${goal.label} target (${goal.unit || "value"})`, String(goal.target));
    return { ...goal, target: nextValue ? Number(nextValue) : goal.target };
  }).map(({ current, completion, risk, ...goal }) => goal);
}

export default function ProgressTab({ isPrivate, memberId }: { isPrivate: boolean; memberId?: number }) {
  const {
    isLoading,
    period,
    showComparison,
    chartPoints,
    selectedPoint,
    selectedPointKey,
    bodyMetricCards,
    personalRecords,
    goals,
    goalHistory,
    workoutsDone,
    caloriesBurned,
    efficiency,
    streak,
    coachReviewCount,
    newCoachReviewCount,
    weeklyVolume,
    connectionState,
    pendingCount,
    setPeriod,
    setShowComparison,
    setSelectedPointKey,
    addBodyMetric,
    addPersonalRecord,
    saveGoals,
  } = useProgressDashboard(memberId);

  const [search, setSearch] = useState("");
  const [recordFilter, setRecordFilter] = useState<"upper" | "lower" | "30d" | "all">("all");
  const [hoveredPointKey, setHoveredPointKey] = useState<string | null>(null);
  const [showRiskInfo, setShowRiskInfo] = useState(false);
  const { disableHeavyAnimations } = useDashboardMotion();
  const tone = statusTone(connectionState);
  const filteredRecords = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return personalRecords.filter((record) => {
      const matchesSearch = !needle || record.exercise.toLowerCase().includes(needle);
      const lowerName = record.exercise.toLowerCase();
      const isUpper = /(bench|press|row|pull|curl|tricep|shoulder|chest|back)/.test(lowerName);
      const isLower = /(squat|deadlift|leg|hamstring|glute|calf|lunge)/.test(lowerName);
      const within30Days = Date.now() - +new Date(record.achievedAt) <= 1000 * 60 * 60 * 24 * 30;

      if (recordFilter === "upper") return matchesSearch && isUpper;
      if (recordFilter === "lower") return matchesSearch && isLower;
      if (recordFilter === "30d") return matchesSearch && within30Days;
      return matchesSearch;
    });
  }, [personalRecords, recordFilter, search]);
  const activePoint = chartPoints.find((point) => point.key === hoveredPointKey) || selectedPoint;

  if (isLoading) {
    return <ProgressLoadingState />;
  }

  return (
    <div className={disableHeavyAnimations ? "reduced-motion flex flex-col gap-4 md:gap-5" : "flex flex-col gap-4 md:gap-5"}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(124,252,0,0.12)", border: "1px solid rgba(124,252,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={22} color="#7CFC00" />
          </div>
          <div>
            <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 800 }}>Progress Command Center</div>
            <div style={{ color: SECONDARY_TEXT_COLOR, fontSize: 14 }}>Live metrics now sync workouts, calories, goals, records, and coach feedback.</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 999, background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color, fontSize: 12, fontWeight: 800 }}>
            {connectionState === "offline" ? <WifiOff size={14} /> : <Signal size={14} />}
            <span>{tone.label}</span>
            {pendingCount > 0 && <span style={{ color: "#FFFFFF" }}>{pendingCount} pending</span>}
          </div>
          <button onClick={async () => { const metric = promptForMetric(); if (metric) await addBodyMetric(metric); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white" aria-label="Add a new body metric">
            <span className="inline-flex items-center gap-2"><Plus size={14} /> Add metric</span>
          </button>
          <button onClick={async () => { const record = promptForRecord(); if (record) await addPersonalRecord(record); }} className="rounded-full border border-[#7CFC00]/20 bg-[#7CFC00]/10 px-4 py-2 text-sm font-semibold text-[#7CFC00]" aria-label="Add a new personal record">
            <span className="inline-flex items-center gap-2"><Trophy size={14} /> Add PR</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
          { label: "Workouts Done", value: workoutsDone, suffix: "", icon: <Trophy size={17} color="#F59E0B" />, tint: "rgba(245,158,11,0.12)", source: "Workout completions" },
          { label: "Calories Burned", value: caloriesBurned, suffix: "", icon: <Flame size={17} color="#FB7185" />, tint: "rgba(251,113,133,0.12)", source: "Workout calorie entries" },
          { label: "Efficiency", value: efficiency, suffix: "%", icon: <Zap size={17} color="#7CFC00" />, tint: "rgba(124,252,0,0.12)", source: "Completed sets / planned sets" },
          { label: "Current Streak", value: streak, suffix: "d", icon: <Star size={17} color="#A78BFA" />, tint: "rgba(167,139,250,0.12)", source: "Consecutive workout days" },
        ].map((item, index) => (
          <motion.div key={item.label} initial={disableHeavyAnimations ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: disableHeavyAnimations ? 0 : index * 0.04, duration: disableHeavyAnimations ? 0 : 0.25 }} style={{ ...cardStyle(), minHeight: 148 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: item.tint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>{item.icon}</div>
            <div style={{ color: "#FFFFFF", fontSize: 26, fontWeight: 800 }}>{item.value.toLocaleString()}{item.suffix}</div>
            <div style={{ color: "#D1D1D4", fontSize: 13, fontWeight: 700, marginTop: 2 }}>{item.label}</div>
            <div style={{ color: "#727278", fontSize: 11, marginTop: 8 }}>{item.source}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}