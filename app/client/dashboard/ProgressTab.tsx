"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, BarChart2, Eye, EyeOff, Flame, Info, Plus, Signal, Star, Target, TrendingDown, TrendingUp, Trophy, Trash, WifiOff, Zap } from "lucide-react";
import { useProgressDashboard, type CoachGoal } from "@/lib/use-progress-dashboard";
import { SECONDARY_TEXT_COLOR, TOUCH_TARGET_SIZE } from "@/lib/accessibility";
import { LazyRenderSection, SkeletonBlock, useDashboardMotion } from "@/lib/performance";
import { useClientLanguage } from "@/lib/client-language";

function cardStyle() {
  return {
    background: "#16161A",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 18,
  } as React.CSSProperties;
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const width = 92;
  const height = 28;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - ((point - min) / range) * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function statusTone(state: "online" | "offline" | "syncing") {
  if (state === "offline") return { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.22)", color: "#FCA5A5", key: "offline" as const };
  if (state === "syncing") return { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.22)", color: "#FDE68A", key: "syncing" as const };
  return { bg: "rgba(124,252,0,0.12)", border: "rgba(124,252,0,0.22)", color: "#B9FF8B", key: "live" as const };
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
  const { language } = useClientLanguage();
  if (!points.length) {
    return <div style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>{language === "ar" ? "لسه مفيش بيانات كفاية." : "Not enough history yet."}</div>;
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


export default function ProgressTab({ isPrivate, memberId }: { isPrivate: boolean; memberId?: number }) {
  const { language } = useClientLanguage();
  const isArabic = language === "ar";
  const {
    isLoading,
    period,
    showComparison,
    chartPoints,
    selectedPoint,
    selectedPointKey,
    bodyMetricCards,
    profile,
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
    deleteBodyMetric,
    addPersonalRecord,
    saveGoals,
  } = useProgressDashboard(memberId);

  const [search, setSearch] = useState("");
  const [recordFilter, setRecordFilter] = useState<"upper" | "lower" | "30d" | "all">("all");
  const [hoveredPointKey, setHoveredPointKey] = useState<string | null>(null);
  const [showRiskInfo, setShowRiskInfo] = useState(false);
  const { disableHeavyAnimations } = useDashboardMotion();
  const tone = statusTone(connectionState);
  const toneLabel =
    tone.key === "offline"
      ? (isArabic ? "في انتظار المزامنة" : "Offline queue")
      : tone.key === "syncing"
        ? (isArabic ? "جارٍ المزامنة" : "Syncing")
        : (isArabic ? "محدّث لحظيًا" : "Realtime live");
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
            <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 800 }}>{isArabic ? "مركز التقدم" : "Progress Command Center"}</div>
            <div style={{ color: SECONDARY_TEXT_COLOR, fontSize: 14 }}>{isArabic ? "هنا بتتابع التمرين والسعرات والأهداف والأرقام الشخصية وملاحظات الكوتش." : "Live metrics now sync workouts, calories, goals, records, and coach feedback."}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 999, background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color, fontSize: 12, fontWeight: 800 }}>
            {connectionState === "offline" ? <WifiOff size={14} /> : <Signal size={14} />}
            <span>{toneLabel}</span>
            {pendingCount > 0 && <span style={{ color: "#FFFFFF" }}>{isArabic ? `${pendingCount} مستني` : `${pendingCount} pending`}</span>}
          </div>
          <button onClick={async () => { const weight = window.prompt(isArabic ? "اكتب وزنك بالكيلو" : "Enter your weight (kg)", ""); if (weight && !isNaN(Number(weight))) { try { await addBodyMetric({ metric: "Body Weight", value: Number(weight), unit: "kg", source: "manual", note: null }); alert(isArabic ? "الوزن اتسجل." : "Weight saved!"); } catch (e) { alert(isArabic ? "مش قادرين نحفظ الوزن دلوقتي." : "Error saving weight. Please try again."); } } }} className="rounded-full border border-[#7CFC00]/20 bg-[#7CFC00]/10 px-4 py-2 text-sm font-semibold text-[#7CFC00]" aria-label={isArabic ? "سجّل الوزن" : "Add weight"}>
            <span className="inline-flex items-center gap-2"><Plus size={14} /> {isArabic ? "سجّل الوزن" : "Add Weight"}</span>
          </button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#5A5A5A", marginTop: 4 }}>{isArabic ? "اضغط على «سجّل الوزن» عشان تضيف وزنك الحالي وتتابع التغير في الرسم البياني." : 'Click "Add Weight" to log your body weight. Track progress over time in the chart below.'}</div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { key: "workouts", label: isArabic ? "تمارين خلصتها" : "Workouts Done", value: `${workoutsDone}`, delta: isArabic ? `${streak} يوم متواصل` : `${streak}d streak`, color: "#F59E0B", points: [0, 1, 1, 2, 1, 3, Math.max(workoutsDone, 1)] },
          { key: "calories", label: isArabic ? "سعرات اتحرقت" : "Calories Burned", value: `${caloriesBurned.toLocaleString()} kcal`, delta: isArabic ? "إجمالي الأسبوع" : `Week total`, color: "#FB7185", points: [1200, 1850, 1930, 2010, 1840, 2060, caloriesBurned || 1920] },
          { key: "efficiency", label: isArabic ? "نسبة الالتزام" : "Efficiency", value: `${efficiency}%`, delta: isArabic ? "نسبة إنهاء الجولات" : "Set completion rate", color: "#7CFC00", points: [78, 82, 85, 88, 91, 90, efficiency || 85] },
          { key: "streak", label: isArabic ? "السلسلة الحالية" : "Current Streak", value: isArabic ? `${streak} يوم` : `${streak} days`, delta: isArabic ? "أيام متتالية" : "Consecutive days", color: "#A78BFA", points: [0, 1, 2, 3, 4, 5, Math.max(streak, 1)] },
        ].map((card) => (
          <motion.div
            key={card.key}
            initial={disableHeavyAnimations ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: disableHeavyAnimations ? 0 : 0.25 }}
            style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 18 }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{card.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", marginTop: 6 }}>{card.value}</div>
                <div style={{ fontSize: 12, color: card.color, marginTop: 4, fontWeight: 700 }}>{card.delta}</div>
              </div>
              <Sparkline points={card.points} color={card.color} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Weight Tracking Section */}
      {bodyMetricCards && bodyMetricCards.length > 0 && (
        <div style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20 }}>
          {(() => {
            const weightCard = bodyMetricCards.find((m) => m.label === "Body Weight");
            if (!weightCard) return null;
            const points = weightCard.history || [];
            const hasEnoughData = points.length >= 2;
            return (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <TrendingDown size={20} color="#7CFC00" />
                    <span style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 700 }}>{isArabic ? "تقدم الوزن" : "Weight Progress"}</span>
                  </div>
                  <div style={{ color: "#8B8B8B", fontSize: 13 }}>
                    {weightCard.latest?.value} {weightCard.latest?.unit}
                  </div>
                </div>
                
                {/* Simple Weight Chart */}
                <div style={{ height: 120, marginBottom: 16 }}>
                  {!hasEnoughData ? (
                    <div style={{ color: "#5A5A5A", fontSize: 13, textAlign: "center", padding: 40 }}>
                      {isArabic ? "سجّل وزنين على الأقل عشان يظهر خط التغير." : "Add at least 2 weight entries to see your trend chart"}
                    </div>
                  ) : (
                    (() => {
                      const chartPoints = points.slice(-7);
                      const min = Math.min(...chartPoints);
                      const max = Math.max(...chartPoints);
                      const range = max - min || 1;
                      const width = 280;
                      const height = 80;
                      const path = chartPoints.map((value, index) => {
                        const x = (index / Math.max(chartPoints.length - 1, 1)) * width;
                        const y = height - ((value - min) / range) * (height - 10) - 5;
                        return `${index === 0 ? "M" : "L"}${x},${y}`;
                      }).join(" ");
                      
                      return (
                        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%" }}>
                          <path d={path} fill="none" stroke="#7CFC00" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                          {chartPoints.map((value, index) => {
                            const x = (index / Math.max(chartPoints.length - 1, 1)) * width;
                            const y = height - ((value - min) / range) * (height - 10) - 5;
                            return <circle key={index} cx={x} cy={y} r={4} fill="#7CFC00" />;
                          })}
                        </svg>
                      );
                    })()
                  )}
                </div>

                {/* Recent Weight History */}
                <div>
                  <div style={{ fontSize: 11, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>{isArabic ? "آخر القياسات" : "Recent Entries"}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(() => {
                      const weightMetrics = (profile?.body_metrics || []).filter((m: any) => m.metric === "Body Weight").slice(-5).reverse();
                      return weightMetrics.map((entry: any) => (
                        <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                          <span style={{ color: "#8B8B8B", fontSize: 13 }}>
                            {entry.recordedAt ? new Date(entry.recordedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : (isArabic ? "غير معروف" : "Unknown")}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 14 }}>{entry.value} {entry.unit}</span>
                            <button onClick={() => deleteBodyMetric(entry.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#5A5A5A" }} aria-label={isArabic ? "احذف القياس" : "Delete weight entry"}>
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
