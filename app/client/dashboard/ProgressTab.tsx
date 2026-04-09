"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, TrendingUp, TrendingDown, Trophy, Zap, Target,
  Dumbbell, Flame, Star, ChevronDown, Eye, EyeOff,
  Weight, Activity,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const BODY_STATS = [
  { label: "Body Weight", value: "78.4", unit: "kg", prev: "80.2", trend: -1.8, up: false, color: "#EF4444" },
  { label: "Body Fat", value: "17.2", unit: "%", prev: "18.9", trend: -1.7, up: false, color: "#F59E0B" },
  { label: "Muscle Mass", value: "62.3", unit: "kg", prev: "60.1", trend: +2.2, up: true, color: "#7CFC00" },
  { label: "BMI", value: "23.4", unit: "", prev: "24.2", trend: -0.8, up: false, color: "#8B5CF6" },
];

const PERSONAL_RECORDS = [
  { exercise: "Squat", weight: "120 kg", date: "Apr 2, 2026", color: "#7CFC00" },
  { exercise: "Bench Press", weight: "90 kg", date: "Mar 28, 2026", color: "#8B5CF6" },
  { exercise: "Deadlift", weight: "140 kg", date: "Mar 20, 2026", color: "#F59E0B" },
  { exercise: "Overhead Press", weight: "65 kg", date: "Apr 1, 2026", color: "#10B981" },
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

const WEIGHT_POINTS = [80.2, 79.8, 79.3, 79.1, 78.7, 78.4];

// ─── Goal Setting Modal ─────────────────────────────────────────────────────
function GoalSettingModal({ isOpen, onClose, currentGoals, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  currentGoals: Array<{ label: string; current: number; target: number; unit: string; color: string }>;
  onSave: (goals: Array<{ label: string; current: number; target: number; unit: string; color: string }>) => void;
}) {
  const [goals, setGoals] = useState(currentGoals);

  const handleSave = () => {
    onSave(goals);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#16161A] border border-white/5 rounded-xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-white text-xl font-bold mb-4">Set Your Goals</h2>
            <div className="space-y-4 mb-6">
              {goals.map((goal, index) => (
                <div key={goal.label} className="space-y-2">
                  <label className="text-white text-sm font-medium">{goal.label}</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={goal.target}
                      onChange={(e) => {
                        const newGoals = [...goals];
                        newGoals[index].target = Number(e.target.value);
                        setGoals(newGoals);
                      }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="Target"
                    />
                    <span className="text-[#8B8B8B] text-sm self-center">{goal.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-white/5 text-white py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-[#7CFC00] text-black py-2 rounded-lg font-medium hover:bg-[#65E000] transition-colors"
              >
                Save Goals
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Weight Sparkline ──────────────────────────────────────────────────────────
function WeightSparkline() {
  const W = 200, H = 56;
  const min = Math.min(...WEIGHT_POINTS) - 0.5;
  const max = Math.max(...WEIGHT_POINTS) + 0.5;
  const getX = (i: number) => (i / (WEIGHT_POINTS.length - 1)) * W;
  const getY = (v: number) => H - ((v - min) / (max - min)) * H;
  const path = WEIGHT_POINTS.map((v, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(v)}`).join(" ");
  const area = path + ` L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 56 }}>
      <defs>
        <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.28" />
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

// ─── Performance Chart ─────────────────────────────────────────────────────────
function PerformanceChartSVG({ showComparison }: { showComparison: boolean }) {
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
          <stop offset="0%" stopColor="#7CFC00" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#7CFC00" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 3, 6, 9, 12].map(v => (
        <line key={v} x1={PAD.left} y1={getY(v)} x2={W - PAD.right} y2={getY(v)}
          stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      <path d={areaPath} fill="url(#pGrad)" />
      {showComparison && (
        <path d={buildPath(MONTHLY_DATA.previous)} fill="none"
          stroke="#8B8B8B" strokeWidth={2} strokeDasharray="5,4" opacity={0.5} />
      )}
      <path d={buildPath(MONTHLY_DATA.current)} fill="none"
        stroke="#7CFC00" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {MONTHLY_DATA.labels.map((label, i) => (
        <text key={label} x={getX(i)} y={H - 4} fill="#5A5A5A" fontSize={10} textAnchor="middle">{label}</text>
      ))}
      {MONTHLY_DATA.current.map((v, i) => (
        <circle key={i} cx={getX(i)} cy={getY(v)} r={4} fill="#7CFC00" stroke="#16161A" strokeWidth={2} />
      ))}
    </svg>
  );
}

// ─── Body Metrics Carousel ─────────────────────────────────────────────────────
function BodyMetricsCarousel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
    setActiveIdx(idx);
  };

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginBottom: 12 }}>Body Metrics</div>

      {/* Snap carousel */}
      <div
        ref={scrollRef}
        className="snap-carousel swipe-hint"
        onScroll={handleScroll}
        style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}
      >
        {BODY_STATS.map((stat, i) => (
          <div
            key={stat.label}
            className="snap-card"
            style={{ width: "100%", minWidth: "100%", padding: "20px", background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}
          >
            <div style={{ fontSize: 11, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#FFFFFF", lineHeight: 1, marginBottom: 6 }}>
              {stat.value}<span style={{ fontSize: 18, color: "#8B8B8B", fontWeight: 400 }}> {stat.unit}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              {stat.up
                ? <TrendingUp size={14} color="#7CFC00" />
                : <TrendingDown size={14} color="#EF4444" />}
              <span style={{ color: stat.up ? "#7CFC00" : "#EF4444", fontSize: 13, fontWeight: 700 }}>
                {stat.up ? "+" : ""}{stat.trend}{stat.unit}
              </span>
              <span style={{ color: "#5A5A5A", fontSize: 13 }}>vs last month</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.abs(parseFloat(stat.value)) / (parseFloat(stat.value) + 20) * 100, 90)}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ height: "100%", background: stat.color, borderRadius: 3 }}
              />
            </div>
            {stat.label === "Body Weight" && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: "#5A5A5A", marginBottom: 4 }}>Trend (6 logs)</div>
                <WeightSparkline />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
        {BODY_STATS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === activeIdx ? 18 : 6,
              height: 6,
              borderRadius: 3,
              background: i === activeIdx ? "#7CFC00" : "rgba(255,255,255,0.15)",
              transition: "all 0.25s ease",
              cursor: "pointer",
            }}
            onClick={() => {
              scrollRef.current?.scrollTo({ left: i * scrollRef.current.offsetWidth, behavior: "smooth" });
              setActiveIdx(i);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Activity Breakdown (horizontal bars, replacing donut) ────────────────────
function ActivityBreakdownBars() {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", marginBottom: 12 }}>Activity Breakdown</div>
      {ACTIVITY_BREAKDOWN.map(a => (
        <div key={a.label} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
            <span style={{ color: "#8B8B8B" }}>{a.label}</span>
            <span style={{ color: a.color, fontWeight: 700 }}>{a.pct}%</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${a.pct}%` }}
              transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ height: "100%", background: a.color, borderRadius: 4 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ProgressTab ─────────────────────────────────────────────────────────
export default function ProgressTab({ isPrivate }: { isPrivate: boolean }) {
  const [period, setPeriod] = useState<"Week" | "Month" | "All">("Month");
  const [showComparison, setShowComparison] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [userGoals, setUserGoals] = useState([
    { label: "Daily Calories", current: 1850, target: 2200, unit: "kcal", color: "#7CFC00" },
    { label: "Protein Goal", current: 145, target: 180, unit: "g", color: "#10B981" },
    { label: "Weekly Workouts", current: 4, target: 5, unit: "", color: "#8B5CF6" },
    { label: "Water Intake", current: 6, target: 8, unit: "glasses", color: "#F59E0B" },
  ]);

  return (
    <div className="flex flex-col gap-5 md:gap-8 px-0">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BarChart2 size={24} color="#7CFC00" />
          <span style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>Your Progress</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Goal Setting Button */}
          <button
            onClick={() => setIsGoalModalOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(124,252,0,0.1)", border: "1px solid rgba(124,252,0,0.3)",
              borderRadius: 10, padding: "8px 12px", color: "#7CFC00",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}
          >
            <Target size={14} />
            Set Goals
          </button>
          {/* Period toggle */}
          <div style={{ display: "flex", background: "#1A1A1F", borderRadius: 20, padding: 4, gap: 2 }}>
            {(["Week", "Month", "All"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: "6px 12px", borderRadius: 16, border: "none", cursor: "pointer",
                background: period === p ? "#7CFC00" : "transparent",
                color: period === p ? "#000" : "#8B8B8B",
                fontSize: 12, fontWeight: 700, fontFamily: "Inter, sans-serif",
                transition: "all 0.2s ease", minHeight: 32,
              }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <Trophy size={17} color="#F59E0B" />, bg: "rgba(245,158,11,0.1)", value: "18", label: "Workouts Done" },
          { icon: <Flame size={17} color="#EF4444" />, bg: "rgba(239,68,68,0.1)", value: "5,420", label: "kcal Burned" },
          { icon: <Zap size={17} color="#7CFC00" />, bg: "rgba(124,252,0,0.1)", value: "93%", label: "Efficiency" },
          { icon: <Star size={17} color="#8B5CF6" />, bg: "rgba(139,92,246,0.1)", value: "5", label: "Day Streak" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px" }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              {kpi.icon}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF", marginBottom: 2 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: "#8B8B8B" }}>{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart from Home Tab */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: "#16161A",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: 24,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 600, color: "#FFFFFF" }}>Performance</span>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "8px 14px",
              color: "#8B8B8B",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "'Inter', sans-serif",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#7CFC00")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8B8B8B")}
          >
            Month
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 3, background: "#7CFC00", borderRadius: 2 }} />
            <span style={{ fontSize: 12, color: "#8B8B8B" }}>This Month</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 20,
                height: 2,
                background: "#8B8B8B",
                borderRadius: 2,
                opacity: 0.5,
                backgroundImage: "repeating-linear-gradient(90deg, #8B8B8B 0, #8B8B8B 4px, transparent 4px, transparent 8px)",
              }}
            />
            <span style={{ fontSize: 12, color: "#8B8B8B" }}>Last Month</span>
          </div>
        </div>

        <PerformanceChartSVG showComparison={true} />
      </motion.div>

      {/* Performance chart with comparison toggle */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>Performance Trend</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isPrivate && (
              <div style={{ fontSize: 11, color: "#7CFC00", background: "rgba(124,252,0,0.1)", border: "1px solid rgba(124,252,0,0.2)", borderRadius: 8, padding: "4px 8px" }}>
                Coach Reviewed
              </div>
            )}
            <button
              onClick={() => setShowComparison(!showComparison)}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "6px 10px",
                borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                background: showComparison ? "rgba(255,255,255,0.08)" : "transparent",
                color: showComparison ? "#FFFFFF" : "#8B8B8B",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
              }}
              title="Toggle last month comparison"
            >
              {showComparison ? <Eye size={13} /> : <EyeOff size={13} />}
              Compare
            </button>
          </div>
        </div>
        {showComparison && (
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 18, height: 3, background: "#7CFC00", borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: "#8B8B8B" }}>This Month</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 18, height: 2, background: "#8B8B8B", borderRadius: 2, opacity: 0.6 }} />
              <span style={{ fontSize: 11, color: "#8B8B8B" }}>Last Month</span>
            </div>
          </div>
        )}
        <PerformanceChartSVG showComparison={showComparison} />
      </motion.div>

      {/* Body metrics carousel + PRs side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Body metrics snap carousel (mobile) / grid (desktop) */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
          {/* Mobile: snap carousel */}
          <div className="block lg:hidden">
            <BodyMetricsCarousel />
          </div>
          {/* Desktop: 2x2 grid */}
          <div className="hidden lg:block">
            <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginBottom: 14 }}>Body Metrics</div>
            <div className="grid grid-cols-2 gap-3">
              {BODY_STATS.map((stat, i) => (
                <motion.div key={stat.label}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 + 0.2 }}
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: "14px 16px" }}
                >
                  <div style={{ fontSize: 10, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>{stat.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>{stat.value}<span style={{ fontSize: 13, color: "#8B8B8B", fontWeight: 400 }}> {stat.unit}</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {stat.up ? <TrendingUp size={12} color="#7CFC00" /> : <TrendingDown size={12} color="#EF4444" />}
                    <span style={{ fontSize: 11, color: stat.up ? "#7CFC00" : "#EF4444", fontWeight: 700 }}>
                      {stat.up ? "+" : ""}{stat.trend}{stat.unit}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: "#8B8B8B", marginBottom: 6 }}>Weight Trend (last 6 logs)</div>
              <WeightSparkline />
            </div>
          </div>
        </motion.div>

        {/* PRs + Activity Breakdown */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Trophy size={16} color="#F59E0B" /> Personal Records
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PERSONAL_RECORDS.map((pr, i) => (
              <motion.div key={pr.exercise}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 + 0.3 }}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${pr.color}20`, border: `1px solid ${pr.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Dumbbell size={16} color={pr.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>{pr.exercise}</div>
                  <div style={{ fontSize: 11, color: "#5A5A5A", marginTop: 2 }}>{pr.date}</div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: pr.color, flexShrink: 0 }}>{pr.weight}</div>
              </motion.div>
            ))}
          </div>
          {/* Activity breakdown horizontal bars (replaced donut) */}
          <ActivityBreakdownBars />
        </motion.div>
      </div>

      {/* Weekly Volume bars */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginBottom: 16 }}>Weekly Training Volume</div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 100 }}>
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

      {/* Coach-Set Goals */}
      {isPrivate && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ background: "rgba(124,252,0,0.04)", border: "1px solid rgba(124,252,0,0.2)", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Target size={16} color="#7CFC00" /> Coach-Set Goals
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Weekly Workouts", current: 4, target: 5, color: "#7CFC00", unit: "" },
              { label: "Daily Protein", current: 145, target: 180, color: "#F59E0B", unit: "g" },
              { label: "Monthly Calorie Deficit", current: 4200, target: 6000, color: "#8B5CF6", unit: "kcal" },
            ].map(goal => {
              const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100);
              return (
                <div key={goal.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: "#FFFFFF", fontWeight: 500 }}>{goal.label}</span>
                    <span style={{ color: goal.color, fontWeight: 700 }}>{goal.current} / {goal.target}{goal.unit} — {pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      style={{ height: "100%", background: goal.color, borderRadius: 4 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Goal Setting Modal */}
      <GoalSettingModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        currentGoals={userGoals}
        onSave={setUserGoals}
      />
    </div>
  );
}
