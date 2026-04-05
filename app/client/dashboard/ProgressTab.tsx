"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, TrendingUp, TrendingDown, Trophy, Zap, Calendar,
  Dumbbell, Flame, Activity, Star, ChevronDown, Target,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const BODY_STATS = [
  { label: "Body Weight", value: "78.4 kg", prev: "80.2 kg", unit: "kg", trend: -1.8, up: false },
  { label: "Body Fat", value: "17.2%", prev: "18.9%", unit: "%", trend: -1.7, up: false },
  { label: "Muscle Mass", value: "62.3 kg", prev: "60.1 kg", unit: "kg", trend: +2.2, up: true },
  { label: "BMI", value: "23.4", prev: "24.2", unit: "", trend: -0.8, up: false },
];

const PERSONAL_RECORDS = [
  { exercise: "Squat", weight: "120 kg", date: "Apr 2, 2026", icon: Dumbbell, color: "#7CFC00" },
  { exercise: "Bench Press", weight: "90 kg", date: "Mar 28, 2026", icon: Dumbbell, color: "#8B5CF6" },
  { exercise: "Deadlift", weight: "140 kg", date: "Mar 20, 2026", icon: Dumbbell, color: "#F59E0B" },
  { exercise: "Overhead Press", weight: "65 kg", date: "Apr 1, 2026", icon: Dumbbell, color: "#10B981" },
];

const MONTHLY_DATA = {
  labels: ["01", "02", "03", "04", "05", "06", "07"],
  current: [3, 5, 7, 4, 6, 8, 5],
  previous: [2, 4, 6, 3, 5, 6, 4],
};

const ACTIVITY_BREAKDOWN = [
  { label: "Strength", pct: 65, color: "#7CFC00" },
  { label: "Cardio", pct: 20, color: "#F59E0B" },
  { label: "Flexibility", pct: 15, color: "#8B5CF6" },
];

const WEEKLY_VOLUME = [
  { week: "W1", sets: 62 },
  { week: "W2", sets: 74 },
  { week: "W3", sets: 58 },
  { week: "W4", sets: 81 },
];

const maxVolume = Math.max(...WEEKLY_VOLUME.map(w => w.sets));

// ─── Inline chart for body weight trend ───────────────────────────────────────
const WEIGHT_POINTS = [80.2, 79.8, 79.3, 79.1, 78.7, 78.4];

function WeightSparkline() {
  const W = 200, H = 60;
  const min = Math.min(...WEIGHT_POINTS) - 0.5;
  const max = Math.max(...WEIGHT_POINTS) + 0.5;
  const getX = (i: number) => (i / (WEIGHT_POINTS.length - 1)) * W;
  const getY = (v: number) => H - ((v - min) / (max - min)) * H;
  const path = WEIGHT_POINTS.map((v, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(v)}`).join(" ");
  const area = path + ` L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 60 }}>
      <defs>
        <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wGrad)" />
      <path d={path} fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {WEIGHT_POINTS.map((v, i) => (
        <circle key={i} cx={getX(i)} cy={getY(v)} r={3} fill="#EF4444" stroke="#0D0D10" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

// ─── Donut chart for activity breakdown ────────────────────────────────────────
function ActivityDonut() {
  const size = 120, cx = 60, cy = 60, r = 44;
  const circ = 2 * Math.PI * r;
  let cumPct = 0;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      {ACTIVITY_BREAKDOWN.map(({ pct, color }) => {
        const dash = circ * (pct / 100);
        const rotation = cumPct * 360;
        cumPct += pct / 100;
        return (
          <circle key={color} cx={cx} cy={cy} r={r} fill="none"
            stroke={color} strokeWidth={10}
            strokeDasharray={`${dash} ${circ}`} strokeDashoffset={0}
            strokeLinecap="butt"
            style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }} />
        );
      })}
    </svg>
  );
}

// ─── Stats card ────────────────────────────────────────────────────────────────
function StatCard({ stat, delay }: { stat: typeof BODY_STATS[0]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 20px" }}
    >
      <div style={{ fontSize: 11, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>{stat.label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#FFFFFF", marginBottom: 6 }}>{stat.value}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
        {stat.up
          ? <TrendingUp size={12} color="#7CFC00" />
          : <TrendingDown size={12} color="#EF4444" />}
        <span style={{ color: stat.up ? "#7CFC00" : "#EF4444", fontWeight: 600 }}>
          {stat.up ? "+" : ""}{stat.trend}{stat.unit}
        </span>
        <span style={{ color: "#5A5A5A" }}>vs last month</span>
      </div>
    </motion.div>
  );
}

// ─── Main ProgressTab ─────────────────────────────────────────────────────────
export default function ProgressTab({ isPrivate }: { isPrivate: boolean }) {
  const [period, setPeriod] = useState<"Week" | "Month" | "All">("Month");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BarChart2 size={26} color="#7CFC00" />
          <span style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF" }}>Your Progress</span>
        </div>
        {/* Period toggle */}
        <div style={{ display: "flex", background: "#1A1A1F", borderRadius: 24, padding: 4, gap: 2 }}>
          {(["Week", "Month", "All"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                background: period === p ? "#7CFC00" : "transparent",
                color: period === p ? "#000" : "#8B8B8B",
                fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
                transition: "all 0.2s ease",
              }}
            >{p}</button>
          ))}
        </div>
      </motion.div>

      {/* Quick KPI strip */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { icon: <Trophy size={18} color="#F59E0B" />, bg: "rgba(245,158,11,0.1)", value: "18", label: "Workouts Done" },
          { icon: <Flame size={18} color="#EF4444" />, bg: "rgba(239,68,68,0.1)", value: "5,420", label: "kcal Burned" },
          { icon: <Zap size={18} color="#7CFC00" />, bg: "rgba(124,252,0,0.1)", value: "93%", label: "Efficiency" },
          { icon: <Star size={18} color="#8B5CF6" />, bg: "rgba(139,92,246,0.1)", value: "5", label: "Day Streak" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 + 0.1 }}
            style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              {kpi.icon}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: "#8B8B8B" }}>{kpi.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Performance chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF" }}>Performance Trend</span>
          {isPrivate && (
            <div style={{ fontSize: 12, color: "#7CFC00", background: "rgba(124,252,0,0.1)", border: "1px solid rgba(124,252,0,0.2)", borderRadius: 8, padding: "4px 10px" }}>
              Coach Reviewed
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
          {[{ label: "This Month", color: "#7CFC00", dashed: false }, { label: "Last Month", color: "#8B8B8B", dashed: true }].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 20, height: l.dashed ? 2 : 3, background: l.color, borderRadius: 2, opacity: l.dashed ? 0.6 : 1 }} />
              <span style={{ fontSize: 12, color: "#8B8B8B" }}>{l.label}</span>
            </div>
          ))}
        </div>
        <ProgressChartSVG />
      </motion.div>

      {/* Two column: body stats + PRs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Body Stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", marginBottom: 16 }}>Body Metrics</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {BODY_STATS.map((s, i) => <StatCard key={s.label} stat={s} delay={i * 0.05 + 0.2} />)}
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: "#8B8B8B", marginBottom: 6 }}>Weight Trend (last 6 logs)</div>
            <WeightSparkline />
          </div>
        </motion.div>

        {/* PRs */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Trophy size={18} color="#F59E0B" />
            Personal Records
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PERSONAL_RECORDS.map((pr, i) => (
              <motion.div key={pr.exercise}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 + 0.3 }}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${pr.color}20`, border: `1px solid ${pr.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <pr.icon size={18} color={pr.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>{pr.exercise}</div>
                  <div style={{ fontSize: 11, color: "#5A5A5A", marginTop: 2 }}>{pr.date}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: pr.color }}>{pr.weight}</div>
              </motion.div>
            ))}
          </div>

          {/* Activity breakdown */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", marginBottom: 12 }}>Activity Breakdown</div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <ActivityDonut />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ACTIVITY_BREAKDOWN.map(a => (
                  <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#8B8B8B", flex: 1 }}>{a.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: a.color }}>{a.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Weekly Volume bars */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", marginBottom: 20 }}>Weekly Training Volume</div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 100 }}>
          {WEEKLY_VOLUME.map((w, i) => (
            <div key={w.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#8B8B8B" }}>{w.sets}</div>
              <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(w.sets / maxVolume) * 100}%` }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{
                    width: "100%",
                    background: i === WEEKLY_VOLUME.length - 1
                      ? "linear-gradient(180deg, #7CFC00, #39FF14)"
                      : "linear-gradient(180deg, rgba(124,252,0,0.4), rgba(124,252,0,0.1))",
                    borderRadius: "6px 6px 0 0",
                    boxShadow: i === WEEKLY_VOLUME.length - 1 ? "0 -4px 12px rgba(124,252,0,0.3)" : "none",
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: i === WEEKLY_VOLUME.length - 1 ? "#7CFC00" : "#5A5A5A", fontWeight: i === WEEKLY_VOLUME.length - 1 ? 700 : 400 }}>{w.week}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Goals */}
      {isPrivate && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ background: "rgba(124,252,0,0.04)", border: "1px solid rgba(124,252,0,0.2)", borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Target size={18} color="#7CFC00" /> Coach-Set Goals
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Weekly Workouts", current: 4, target: 5, color: "#7CFC00" },
              { label: "Daily Protein (g)", current: 145, target: 180, color: "#F59E0B" },
              { label: "Monthly Calorie Deficit", current: 4200, target: 6000, color: "#8B5CF6" },
            ].map(goal => {
              const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100);
              return (
                <div key={goal.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: "#FFFFFF", fontWeight: 500 }}>{goal.label}</span>
                    <span style={{ color: goal.color, fontWeight: 700 }}>{goal.current} / {goal.target} — {pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      style={{ height: "100%", background: `linear-gradient(90deg, ${goal.color}, ${goal.color}cc)`, borderRadius: 4 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Inline mini performance chart ────────────────────────────────────────────
function ProgressChartSVG() {
  const W = 600, H = 160;
  const PAD = { top: 16, right: 16, bottom: 24, left: 36 };
  const cw = W - PAD.left - PAD.right, ch = H - PAD.top - PAD.bottom;
  const maxVal = 12;
  const getX = (i: number) => PAD.left + (i / (MONTHLY_DATA.labels.length - 1)) * cw;
  const getY = (v: number) => PAD.top + ch - (v / maxVal) * ch;
  const buildPath = (d: number[]) => d.map((v, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(v)}`).join(" ");

  const areaPath = buildPath(MONTHLY_DATA.current)
    + ` L ${getX(MONTHLY_DATA.current.length - 1)} ${PAD.top + ch} L ${getX(0)} ${PAD.top + ch} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7CFC00" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#7CFC00" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 3, 6, 9, 12].map(v => (
        <line key={v} x1={PAD.left} y1={getY(v)} x2={W - PAD.right} y2={getY(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      <path d={areaPath} fill="url(#pGrad)" />
      <path d={buildPath(MONTHLY_DATA.previous)} fill="none" stroke="#8B8B8B" strokeWidth={2} strokeDasharray="5,4" opacity={0.5} />
      <path d={buildPath(MONTHLY_DATA.current)} fill="none" stroke="#7CFC00" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {MONTHLY_DATA.labels.map((label, i) => (
        <text key={label} x={getX(i)} y={H - 4} fill="#5A5A5A" fontSize={10} textAnchor="middle">{label}</text>
      ))}
      {MONTHLY_DATA.current.map((v, i) => (
        <circle key={i} cx={getX(i)} cy={getY(v)} r={4} fill="#7CFC00" stroke="#16161A" strokeWidth={2} />
      ))}
    </svg>
  );
}
