"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, BarChart2, Eye, EyeOff, Flame, Plus, Signal, Star, Target, TrendingDown, TrendingUp, Trophy, WifiOff, Zap } from "lucide-react";
import { useProgressDashboard, type CoachGoal } from "@/lib/use-progress-dashboard";

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

function TrendChart({
  points,
  selectedKey,
  showComparison,
  onSelect,
}: {
  points: Array<{ key: string; shortLabel: string; value: number; previousValue: number }>;
  selectedKey: string | null;
  showComparison: boolean;
  onSelect: (key: string) => void;
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
        <g key={point.key} onClick={() => onSelect(point.key)} style={{ cursor: "pointer" }}>
          <circle cx={x(index)} cy={y(point.value)} r={selectedKey === point.key ? 7 : 5} fill={selectedKey === point.key ? "#FFFFFF" : "#7CFC00"} stroke="#111114" strokeWidth={2} />
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
  const tone = statusTone(connectionState);
  const filteredRecords = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return personalRecords;
    return personalRecords.filter((record) => record.exercise.toLowerCase().includes(needle));
  }, [personalRecords, search]);

  if (isLoading) {
    return <div style={{ ...cardStyle(), color: "#8B8B8B" }}>Loading your live progress dashboard...</div>;
  }

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(124,252,0,0.12)", border: "1px solid rgba(124,252,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={22} color="#7CFC00" />
          </div>
          <div>
            <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 800 }}>Progress Command Center</div>
            <div style={{ color: "#8B8B8B", fontSize: 14 }}>Live metrics now sync workouts, calories, goals, records, and coach feedback.</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 999, background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color, fontSize: 12, fontWeight: 800 }}>
            {connectionState === "offline" ? <WifiOff size={14} /> : <Signal size={14} />}
            <span>{tone.label}</span>
            {pendingCount > 0 && <span style={{ color: "#FFFFFF" }}>{pendingCount} pending</span>}
          </div>
          <button onClick={async () => { const metric = promptForMetric(); if (metric) await addBodyMetric(metric); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
            <span className="inline-flex items-center gap-2"><Plus size={14} /> Add metric</span>
          </button>
          <button onClick={async () => { const record = promptForRecord(); if (record) await addPersonalRecord(record); }} className="rounded-full border border-[#7CFC00]/20 bg-[#7CFC00]/10 px-4 py-2 text-sm font-semibold text-[#7CFC00]">
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
          <motion.div key={item.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} style={cardStyle()}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: item.tint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>{item.icon}</div>
            <div style={{ color: "#FFFFFF", fontSize: 26, fontWeight: 800 }}>{item.value.toLocaleString()}{item.suffix}</div>
            <div style={{ color: "#D1D1D4", fontSize: 13, fontWeight: 700, marginTop: 2 }}>{item.label}</div>
            <div style={{ color: "#727278", fontSize: 11, marginTop: 8 }}>{item.source}</div>
          </motion.div>
        ))}
      </div>

      <div style={cardStyle()}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" style={{ marginBottom: 18 }}>
          <div>
            <div style={{ color: "#FFFFFF", fontSize: 19, fontWeight: 800 }}>Performance Trend</div>
            <div style={{ color: "#8B8B8B", fontSize: 13 }}>Tap any point to reveal the workouts behind the number.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div style={{ display: "flex", background: "#1B1B20", borderRadius: 999, padding: 4 }}>
              {[
                { key: "weekly", label: "Weekly" },
                { key: "monthly", label: "Monthly" },
                { key: "yearly", label: "Yearly" },
              ].map((option) => (
                <button key={option.key} onClick={() => setPeriod(option.key as typeof period)} style={{ borderRadius: 999, border: "none", padding: "8px 14px", background: period === option.key ? "#7CFC00" : "transparent", color: period === option.key ? "#0A0A0C" : "#9A9AA0", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                  {option.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowComparison(!showComparison)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
              <span className="inline-flex items-center gap-2">{showComparison ? <Eye size={14} /> : <EyeOff size={14} />} Compare</span>
            </button>
          </div>
        </div>
        <TrendChart points={chartPoints} selectedKey={selectedPointKey} showComparison={showComparison} onSelect={setSelectedPointKey} />
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: 16 }}>
            <div style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 700 }}>{selectedPoint?.dateLabel || "Current slice"}</div>
            <div style={{ color: "#8B8B8B", fontSize: 12, marginTop: 4 }}>Volume comes from real set x rep x weight data.</div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div style={{ borderRadius: 14, background: "rgba(124,252,0,0.08)", padding: 14 }}>
                <div style={{ color: "#8B8B8B", fontSize: 11 }}>Current period</div>
                <div style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 800, marginTop: 4 }}>{(selectedPoint?.value || 0).toLocaleString()}</div>
              </div>
              <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.04)", padding: 14 }}>
                <div style={{ color: "#8B8B8B", fontSize: 11 }}>Previous period</div>
                <div style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 800, marginTop: 4 }}>{(selectedPoint?.previousValue || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div style={{ borderRadius: 16, background: "linear-gradient(180deg, rgba(124,252,0,0.08), rgba(124,252,0,0.02))", border: "1px solid rgba(255,255,255,0.06)", padding: 16 }}>
            <div style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Workouts behind this point</div>
            <div className="flex flex-col gap-3 max-h-[240px] overflow-y-auto">
              {selectedPoint?.workouts?.length ? selectedPoint.workouts.map((workout) => (
                <div key={workout.id} style={{ borderRadius: 14, padding: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 700 }}>{workout.title}</div>
                  <div style={{ color: "#8B8B8B", fontSize: 12, marginTop: 4 }}>{new Date(workout.created_at).toLocaleDateString()} · {workout.duration || "Session"} · {workout.status}</div>
                </div>
              )) : <div style={{ color: "#8B8B8B", fontSize: 13 }}>No workouts landed in this slice yet.</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-4">
        <div style={cardStyle()}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 800 }}>Body Metrics</div>
              <div style={{ color: "#8B8B8B", fontSize: 12 }}>Trend arrows use moving averages, not one noisy check-in.</div>
            </div>
            <button onClick={async () => { const metric = promptForMetric(); if (metric) await addBodyMetric(metric); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">Log metric</button>
          </div>
          {bodyMetricCards.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bodyMetricCards.map((metric) => (
                <div key={metric.label} style={{ borderRadius: 18, padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700 }}>{metric.label}</div>
                    <div style={{ color: "#6D6D72", fontSize: 11 }}>{metric.latest.source}</div>
                  </div>
                  <div style={{ color: "#FFFFFF", fontSize: 30, fontWeight: 800, marginTop: 10 }}>{metric.latest.value.toFixed(1)}<span style={{ color: "#9A9AA0", fontSize: 14, marginLeft: 6 }}>{metric.latest.unit}</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                    {metric.rising ? <TrendingUp size={14} color="#7CFC00" /> : <TrendingDown size={14} color="#FB7185" />}
                    <span style={{ color: metric.rising ? "#7CFC00" : "#FB7185", fontSize: 12, fontWeight: 700 }}>{metric.trendValue >= 0 ? "+" : ""}{metric.trendValue.toFixed(2)}{metric.latest.unit}</span>
                    <span style={{ color: "#6D6D72", fontSize: 12 }}>moving avg delta</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <div style={{ color: "#8B8B8B", fontSize: 13 }}>No body metrics yet. Add a manual entry to start live trend tracking.</div>}
        </div>

        <div style={cardStyle()}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 800 }}>Weekly Training Volume</div>
              <div style={{ color: "#8B8B8B", fontSize: 12 }}>Subtle past bars, neon current bar.</div>
            </div>
            <div style={{ color: "#7CFC00", fontSize: 15, fontWeight: 800 }}>{weeklyVolume.toLocaleString()} kg</div>
          </div>
          <div className="flex items-end gap-3 h-[220px]">
            {chartPoints.map((point, index) => {
              const max = Math.max(...chartPoints.map((item) => item.value), 1);
              const height = Math.max((point.value / max) * 180, 12);
              const current = index === chartPoints.length - 1;
              return (
                <div key={point.key} className="flex-1 flex flex-col items-center gap-3">
                  <div style={{ width: "100%", height, borderRadius: 18, background: current ? "linear-gradient(180deg, rgba(124,252,0,0.95), rgba(83,159,0,0.35))" : "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))", boxShadow: current ? "0 0 30px rgba(124,252,0,0.18)" : "none" }} />
                  <div style={{ color: current ? "#FFFFFF" : "#7C7C82", fontSize: 11, fontWeight: current ? 800 : 600 }}>{point.shortLabel}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
        <div style={cardStyle()}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <div style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 800 }}>Personal Records</div>
              <div style={{ color: "#8B8B8B", fontSize: 12 }}>Searchable database with attempt history and linked evidence.</div>
            </div>
            <div className="flex items-center gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercise" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" />
              <button onClick={async () => { const record = promptForRecord(); if (record) await addPersonalRecord(record); }} className="rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-4 py-2 text-sm font-semibold text-[#FDE68A]">Add PR</button>
            </div>
          </div>
          <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto">
            {filteredRecords.length ? filteredRecords.map((record) => {
              const previousBest = record.attempts?.[1]?.weight || 0;
              const isFresh = record.weight > previousBest && Date.now() - +new Date(record.achievedAt) < 1000 * 60 * 60 * 24 * 7;
              return (
                <div key={record.id} style={{ borderRadius: 18, padding: 16, background: isFresh ? "linear-gradient(180deg, rgba(245,158,11,0.12), rgba(245,158,11,0.03))" : "rgba(255,255,255,0.03)", border: `1px solid ${isFresh ? "rgba(245,158,11,0.24)" : "rgba(255,255,255,0.06)"}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 700 }}>{record.exercise}</div>
                      <div style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 800, marginTop: 4 }}>{record.weight.toFixed(1)} {record.unit}</div>
                      <div style={{ color: "#8B8B8B", fontSize: 12, marginTop: 4 }}>{new Date(record.achievedAt).toLocaleDateString()}</div>
                    </div>
                    {isFresh && <div style={{ borderRadius: 999, background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.24)", padding: "6px 10px", color: "#FDE68A", fontSize: 11, fontWeight: 800 }}>New PR</div>}
                  </div>
                  <div style={{ color: "#8B8B8B", fontSize: 12, marginTop: 10 }}>{record.videoUrl ? "Video evidence linked" : "No video linked"} · {record.attempts?.length || 0} attempts tracked</div>
                </div>
              );
            }) : <div style={{ color: "#8B8B8B", fontSize: 13 }}>No PR matches yet.</div>}
          </div>
        </div>

        <div style={cardStyle()}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <div style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 800 }}>Coach-Set Goals</div>
              <div style={{ color: "#8B8B8B", fontSize: 12 }}>Animated progress bars change color with completion risk.</div>
            </div>
            <button onClick={async () => { await saveGoals(promptForGoals(goals)); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">Edit targets</button>
          </div>
          <div className="flex flex-col gap-4">
            {goals.map((goal) => {
              const palette = goal.risk === "safe" ? { fill: "#7CFC00", chip: "rgba(124,252,0,0.12)", text: "#B9FF8B" } : goal.risk === "watch" ? { fill: "#F59E0B", chip: "rgba(245,158,11,0.12)", text: "#FCD34D" } : { fill: "#FB7185", chip: "rgba(251,113,133,0.12)", text: "#FDA4AF" };
              return (
                <div key={goal.id} style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", padding: 16 }}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700 }}>{goal.label}</div>
                      <div style={{ color: "#8B8B8B", fontSize: 12, marginTop: 4 }}>Source: {goal.source || "Dashboard activity"}</div>
                    </div>
                    <div style={{ borderRadius: 999, background: palette.chip, padding: "6px 10px", color: palette.text, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>{goal.risk}</div>
                  </div>
                  <div className="flex items-end justify-between gap-3 mb-3">
                    <div style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 800 }}>{goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}</div>
                    <div style={{ color: "#8B8B8B", fontSize: 12 }}>updated by {goal.updatedBy || "coach"}</div>
                  </div>
                  <div style={{ height: 12, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(goal.completion * 100, 100)}%` }} transition={{ duration: 0.75, ease: "easeOut" }} style={{ height: "100%", borderRadius: 999, background: palette.fill }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 18, borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.025)", padding: 16 }}>
            <div className="flex items-center gap-3">
              <div style={{ width: 34, height: 34, borderRadius: 12, background: "rgba(124,252,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}><Activity size={16} color="#7CFC00" /></div>
              <div>
                <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700 }}>Source Trace</div>
                <div style={{ color: "#8B8B8B", fontSize: 12 }}>Workouts drive volume, nutrition logs feed calorie goals, check-ins populate body metrics.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div style={cardStyle()}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 800 }}>Live Coach Feedback</div>
              <div style={{ color: "#8B8B8B", fontSize: 12 }}>Realtime coach reviews pulse here without a refresh.</div>
            </div>
            {isPrivate && <div style={{ borderRadius: 999, padding: "8px 12px", background: "rgba(124,252,0,0.12)", border: "1px solid rgba(124,252,0,0.2)", color: "#B9FF8B", fontSize: 12, fontWeight: 800 }}>{newCoachReviewCount} new reviews</div>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: "Coach feedback events", value: coachReviewCount, subtitle: "Messages from your coach", icon: <Target size={16} color="#7CFC00" /> },
              { label: "Realtime layer", value: connectionState === "offline" ? 0 : 1, subtitle: "Supabase websocket heartbeat", icon: <Signal size={16} color="#60A5FA" /> },
              { label: "Pending actions", value: pendingCount, subtitle: "Queued safely for reconnect", icon: <Activity size={16} color="#F59E0B" /> },
            ].map((item) => (
              <div key={item.label} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", padding: 16 }}>
                <div style={{ marginBottom: 10 }}>{item.icon}</div>
                <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 800 }}>{item.value}</div>
                <div style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 700, marginTop: 4 }}>{item.label}</div>
                <div style={{ color: "#8B8B8B", fontSize: 12, marginTop: 6 }}>{item.subtitle}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={cardStyle()}>
          <div style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Wearable Sources</div>
          <div className="flex flex-col gap-3">
            {[
              { label: "Apple Health", status: "Ready for token hookup" },
              { label: "Garmin", status: "Ready for token hookup" },
              { label: "Fitbit", status: "Ready for token hookup" },
              { label: "Manual Entry", status: "Active now" },
            ].map((item, index) => (
              <div key={item.label} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", background: index === 3 ? "rgba(124,252,0,0.08)" : "rgba(255,255,255,0.03)", padding: 14 }}>
                <div style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 700 }}>{item.label}</div>
                <div style={{ color: "#8B8B8B", fontSize: 12, marginTop: 4 }}>{item.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
