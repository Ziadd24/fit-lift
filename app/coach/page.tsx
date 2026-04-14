"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CoachLayout } from "@/components/layout/CoachLayout";
import { useListMembers, useListSessions, useUpdateMember, useSearchUnassignedMembers, useAssignMember } from "@/lib/api-hooks";
import { useClientContext } from "@/lib/use-client-context";
import { Button, Badge, Input, Label } from "@/components/ui/PremiumComponents";
import {
  Users, Activity, CalendarCheck,
  MessageSquare, ChevronLeft, ChevronRight,
  Tag, Calendar, Smartphone, Mail, User, Star, MapPin,
  Clock, Search, Edit2, UserPlus, Megaphone, X,
  Flame, Dumbbell, GripVertical, Plus, ChevronDown, TrendingUp,
  Utensils, ChevronRight as ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/use-auth";
import type { Member } from "@/lib/supabase";
import { DEFAULT_ACTIVITIES, FEATURED_ACTIVITY, PERIOD_DATA, DEMO_EXERCISES } from "@/lib/coach-mock-data";
import type { ActivityItem } from "@/lib/coach-mock-data";
import { WorkoutExerciseCard } from "@/components/ui/WorkoutExerciseCard";
import type { WorkoutExercise } from "@/components/ui/WorkoutExerciseCard";

type TimePeriod = "Day" | "Week" | "Month";

/* ─── SVG Sparkline ─── */
function Sparkline({ values, color = "#7CFC00" }: { values: number[]; color?: string }) {
  const w = 60, h = 24;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Multi-color Conic Ring ─── */
function OverviewRing({ size = 120, segments = [
    { pct: 0.60, color: "#7CFC00" },
    { pct: 0.25, color: "#8B5CF6" },
    { pct: 0.15, color: "#F59E0B" },
  ] }: { size?: number, segments?: {pct: number, color: string}[] }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  let cumPct = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={9} />
      {segments.map(({ pct, color }) => {
        const offset = circ * (1 - pct);
        const rotation = cumPct * 360;
        cumPct += pct;
        return (
          <circle
            key={color}
            cx={cx} cy={cy} r={r}
            fill="none" stroke={color} strokeWidth={9}
            strokeDasharray={`${circ * pct} ${circ}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
            style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
          />
        );
      })}
    </svg>
  );
}

/* ─── Simple circular ring ─── */
function CircleRing({ percent, color, size = 56, thickness = 5 }: { percent: number; color: string; size?: number; thickness?: number }) {
  const r = (size - thickness * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={thickness} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={thickness}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

/* ─── Semi-circle Gauge ─── */
function SemiGauge({ percent = 95.5 }: { percent?: number }) {
  const w = 200, h = 100, r = 80;
  const cx = w / 2, cy = h;
  const circ = Math.PI * r; // half circle
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={12} strokeLinecap="round" />
      <path d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`} fill="none" stroke="url(#gaugeGrad)" strokeWidth={12} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7CFC00" />
          <stop offset="75%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Activity item ─── */
function ActivityItem({
  icon: Icon, iconBg, title, sub, pct,
  editMode, onDelete,
}: {
  icon: any; iconBg: string; title: string; sub: string; pct: number;
  editMode?: boolean; onDelete?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl transition-colors"
      style={{ background: "rgba(255,255,255,0.03)", marginBottom: 8 }}
    >
      {editMode && <GripVertical className="w-4 h-4 text-[#5A5A5A] cursor-grab flex-shrink-0" />}
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: "Inter,sans-serif" }}>{title}</p>
        <p className="text-xs" style={{ color: "#8B8B8B", fontFamily: "Inter,sans-serif" }}>{sub}</p>
      </div>
      {editMode ? (
        <button onClick={onDelete} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors">
          <X className="w-3.5 h-3.5 text-red-400 hover:text-red-400" />
        </button>
      ) : (
        <div style={{ position: "relative", width: 20, height: 20 }}>
          <CircleRing percent={pct} color="#7CFC00" size={20} thickness={3} />
        </div>
      )}
    </div>
  );
}

/* ─── Skeleton Card ─── */
function SkeletonCard({ height = 280 }: { height?: number }) {
  return (
    <div className="dash-card p-6" style={{ height }}>
      <div className="space-y-3 animate-pulse">
        <div className="h-4 rounded-lg skeleton-shimmer w-1/3" />
        <div className="h-4 rounded-lg skeleton-shimmer w-2/3" />
        <div className="h-20 rounded-xl skeleton-shimmer w-full" />
        <div className="h-4 rounded-lg skeleton-shimmer w-1/2" />
      </div>
    </div>
  );
}

/* ─── Status colour for client cards ─── */
function clientStatus(m: Member) {
  return new Date(m.sub_expiry_date) > new Date() ? "#7CFC00" : "#ef4444";
}

/* ════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════ */
export default function CoachDashboard() {
  const router = useRouter();
  const { currentCoach } = useAuth();
  const { setSelectedClient } = useClientContext();
  const { data: membersPage, refetch: refetchMembers } = useListMembers();
  const { data: sessions } = useListSessions();
  const updateMemberMutation = useUpdateMember();

  const members: Member[] = membersPage?.members || [];

  /* ── UI State ── */
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("Week");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const periodData = PERIOD_DATA;
  const currentPeriodData = periodData[timePeriod];

  /* ── Daily calorie totals from Nutrition Tracker (localStorage) ── */
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [clientGoals, setClientGoals] = useState<Record<string, number>>({});
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState("");
  useEffect(() => {
    const load = () => {
      try {
        const key = `fitgym_cal_totals_${new Date().toISOString().split("T")[0]}`;
        const raw = localStorage.getItem(key);
        if (raw) setDailyTotals(JSON.parse(raw));
        
        const goalsRaw = localStorage.getItem("fitgym_client_goals");
        if (goalsRaw) setClientGoals(JSON.parse(goalsRaw));
      } catch {}
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);
  const [activeIdx, setActiveIdx] = useState(0);
  const [editActivity, setEditActivity] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Member>>({});
  const [broadcastText, setBroadcastText] = useState("");
  const carouselRef = useRef<HTMLDivElement>(null);

  /* ── Activity items — sourced from config, not hardcoded ── */
  const [activities, setActivities] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);

  /* ── Workout exercises — sourced from config ── */
  const [exercises, setExercises] = useState<WorkoutExercise[]>(DEMO_EXERCISES);

  /* ── Search & Assign Unassigned Members ── */
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const [debouncedAssignSearch, setDebouncedAssignSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAssignSearch(assignSearchQuery), 500);
    return () => clearTimeout(t);
  }, [assignSearchQuery]);

  const { data: unassignedPage, isLoading: isSearchingUnassigned } = useSearchUnassignedMembers(debouncedAssignSearch);
  const unassignedMembers = unassignedPage?.members || [];
  const assignMemberMutation = useAssignMember();

  const handleEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient.id) return;
    updateMemberMutation.mutate({ id: editingClient.id, data: editingClient }, {
      onSuccess: () => setIsEditClientOpen(false)
    });
  };

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.membership_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const safeIdx = filteredMembers.length > 0 ? ((activeIdx % filteredMembers.length) + filteredMembers.length) % filteredMembers.length : 0;
  const activeClient = filteredMembers[safeIdx] || null;
  const activeClientId = activeClient?.id || "default";
  const CALORIE_GOAL = clientGoals[activeClientId] || 2500;

  const handleSaveGoal = () => {
    const g = parseInt(tempGoal);
    if (g > 0) {
      const newGoals = { ...clientGoals, [activeClientId]: g };
      setClientGoals(newGoals);
      localStorage.setItem("fitgym_client_goals", JSON.stringify(newGoals));
    }
    setIsEditingGoal(false);
  };

  /* ── Sessions ── */
  const todaySessions = sessions?.filter((s: any) =>
    new Date(s.scheduled_at).toDateString() === new Date().toDateString()
  ) || [];
  const completedSessions = sessions?.filter((s: any) => s.status === "completed") || [];
  const progressPct = todaySessions.length > 0
    ? Math.round((todaySessions.filter((s: any) => s.status === "completed").length / todaySessions.length) * 100)
    : 0;

  /* ── Period switch with skeleton ── */
  const switchPeriod = (p: TimePeriod) => {
    if (p === timePeriod) return;
    setIsRefreshing(true);
    setTimeout(() => { setTimePeriod(p); setIsRefreshing(false); }, 400);
  };

  /* ── Client switch with skeleton ── */
  const switchClient = useCallback((idx: number) => {
    setIsRefreshing(true);
    setTimeout(() => {
      setActiveIdx(((idx % filteredMembers.length) + filteredMembers.length) % filteredMembers.length);
      setIsRefreshing(false);
    }, 300);
  }, [filteredMembers.length]);

  /* ── Scroll carousel to active card ── */
  useEffect(() => {
    if (carouselRef.current && filteredMembers.length > 0) {
      const card = carouselRef.current.children[safeIdx] as HTMLElement;
      card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [safeIdx, filteredMembers.length]);

  const cardStyle = {
    background: "var(--color-card)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "var(--radius-card)",
    boxShadow: "var(--shadow-card)",
  } as React.CSSProperties;

  return (
    <CoachLayout>
      <div style={{ fontFamily: "Inter, sans-serif" }}>

        {/* ══ HEADER ══ */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Inter,sans-serif", fontWeight: 700 }}>
              Welcome back, <span style={{ color: "#7CFC00" }}>{currentCoach?.name || "Coach"}</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "#8B8B8B" }}>Here's your coaching overview</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Period Toggle */}
            <div className="flex items-center p-1 gap-1 rounded-full overflow-x-auto no-scrollbar max-w-full" style={{ background: "#1A1A1F" }}>
              {(["Day","Week","Month"] as TimePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => switchPeriod(p)}
                  className="relative px-5 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide transition-all duration-300"
                  style={{
                    color: timePeriod === p ? "#000" : "#8B8B8B",
                    minWidth: 64, fontFamily: "Inter,sans-serif", letterSpacing: "0.5px"
                  }}
                >
                  {timePeriod === p && (
                    <motion.span
                      layoutId="period-pill"
                      className="absolute inset-0 rounded-full"
                      style={{ background: "#7CFC00", boxShadow: "0 2px 8px rgba(124,252,0,0.3)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10">{p}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-black transition-all"
              style={{ background: "#7CFC00", boxShadow: "0 0 20px rgba(124,252,0,0.3)", fontFamily: "Inter,sans-serif" }}
            >
              <UserPlus className="w-4 h-4" /> Add Client
            </button>
            <button
              onClick={() => setIsBroadcastOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white border transition-all hover:border-white/30"
              style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "Inter,sans-serif" }}
            >
              <Megaphone className="w-4 h-4" /> Broadcast
            </button>
          </div>
        </div>

        {/* ══ TOP GRID: Activity | Calories ══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

          {/* 1. Today's Activity */}
          <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
            <div style={{ ...cardStyle, padding: 24, height: 280, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-white" style={{ fontSize: 18 }}>Today's Activity</span>
                <button
                  onClick={() => { setEditActivity(!editActivity); setNewExTitle(""); setNewExSub(""); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border hover:bg-white/5"
                  style={{ 
                     color: editActivity ? "#000" : "#fff", 
                     background: editActivity ? "#7CFC00" : "transparent",
                     borderColor: editActivity ? "#7CFC00" : "rgba(255,255,255,0.1)"
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {editActivity ? "Done" : "Customize"}
                </button>
              </div>

              {/* Featured activity banner — data from config */}
              <div className="rounded-xl p-4 mb-3 relative overflow-hidden flex-shrink-0" style={{ background: FEATURED_ACTIVITY.gradient, height: 100 }}>
                <div className="font-bold text-white" style={{ fontSize: 28, fontWeight: 700 }}>{FEATURED_ACTIVITY.value}</div>
                <div className="text-xs text-white/80">{FEATURED_ACTIVITY.unit}</div>
                <div className="absolute bottom-3 left-4 px-3 py-1 rounded-xl text-xs font-semibold uppercase text-white" style={{ background: "rgba(0,0,0,0.35)" }}>{FEATURED_ACTIVITY.label}</div>
              </div>

              {/* Activity list — only first 1 visible, scrollable */}
              <div className="overflow-y-auto no-scrollbar flex-1" style={{ minHeight: 0 }}>
                {activities.map((a) => (
                  <ActivityItem key={a.id} icon={a.icon} iconBg={a.iconBg} title={a.title} sub={a.sub} pct={a.pct}
                    editMode={editActivity} onDelete={() => setActivities(prev => prev.filter((x) => x.id !== a.id))}
                  />
                ))}
                {editActivity && (
                  <div className="mt-2 p-3 rounded-xl border border-dashed border-[#7CFC00] bg-[#7CFC00]/5 flex flex-col gap-2">
                    <input 
                      type="text" 
                      placeholder="Exercise Name (e.g. Squat)" 
                      value={newExTitle}
                      onChange={e => setNewExTitle(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#7CFC00]" 
                    />
                    <input 
                      type="text" 
                      placeholder="Details (e.g. 3 sets × 10 reps)" 
                      value={newExSub}
                      onChange={e => setNewExSub(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#7CFC00]" 
                    />
                    <button 
                      onClick={() => {
                        if (newExTitle.trim()) {
                          setActivities([...activities, { id: Date.now(), title: newExTitle, sub: newExSub || "1 set × 10 reps", icon: Dumbbell, iconBg: "#7CFC00", pct: 0 }]);
                          setNewExTitle(""); setNewExSub("");
                        }
                      }}
                      className="w-full rounded-lg flex items-center justify-center gap-1.5 transition-colors hover:bg-[#7CFC00]/20"
                      style={{ height: 32, background: "rgba(124,252,0,0.15)", color: "#7CFC00", fontSize: 12, fontWeight: 600, fontFamily: "Inter,sans-serif" }}>
                      <Plus className="w-3.5 h-3.5" /> Add Custom Activity
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* 2. Calories Gauge Card — live from Nutrition Tracker */}
          <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
            <div style={{ ...cardStyle, padding: 24, height: 280, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div className="flex items-center justify-between w-full mb-3">
                <span className="font-semibold text-white" style={{ fontSize: 18 }}>Calories</span>
                <Link href="/coach/calories"
                  className="flex items-center gap-1 text-[11px] font-bold transition-opacity hover:opacity-80"
                  style={{ color: "#7CFC00" }}>
                  <Utensils className="w-3 h-3" /> Track <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="relative" style={{ marginTop: 8 }}>
                <SemiGauge percent={CALORIE_GOAL > 0 ? Math.min((dailyTotals.calories / CALORIE_GOAL) * 100, 100) : 0} />
                <div className="absolute" style={{ bottom: -4, left: "50%", transform: "translateX(-50%)" }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center -mt-6 mx-auto"
                    style={{ background: "rgba(124,252,0,0.15)", border: "2px solid rgba(124,252,0,0.3)" }}>
                    <Flame className="w-7 h-7" style={{ color: "#7CFC00" }} />
                  </div>
                </div>
              </div>

              {isEditingGoal ? (
                <div className="mt-2 text-center w-full px-4">
                  <input
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    placeholder="New Goal"
                    className="w-full text-center bg-transparent border-b border-[#7CFC00] text-xl font-bold text-white outline-none mb-2"
                  />
                  <div className="flex gap-2 justify-center">
                    <button onClick={handleSaveGoal} className="text-xs px-3 py-1 rounded bg-[#7CFC00] text-black font-semibold">Save</button>
                    <button onClick={() => setIsEditingGoal(false)} className="text-xs px-3 py-1 rounded bg-red-500/20 text-red-500 font-semibold">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {dailyTotals.calories > 0 ? (
                    <div className="mt-2 text-center">
                      <p className="font-bold text-white relative group" style={{ fontSize: 22, fontFamily: "Inter,sans-serif" }}>
                        {dailyTotals.calories.toLocaleString()} <span className="text-sm font-normal" style={{ color: "#8B8B8B" }}>kcal</span>
                      </p>
                      <p className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: "#8B8B8B", fontFamily: "Inter,sans-serif" }}>
                        {Math.min(Math.round((dailyTotals.calories / CALORIE_GOAL) * 100), 100)}% of {CALORIE_GOAL.toLocaleString()} goal
                        <button onClick={() => { setTempGoal(CALORIE_GOAL.toString()); setIsEditingGoal(true); }} className="hover:text-[#7CFC00]">
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 text-center">
                      <p className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: "#5A5A5A", fontFamily: "Inter,sans-serif" }}>
                        No meals today. Goal: {CALORIE_GOAL.toLocaleString()}
                        <button onClick={() => { setTempGoal(CALORIE_GOAL.toString()); setIsEditingGoal(true); }} className="hover:text-[#7CFC00]">
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </p>
                      <Link href="/coach/calories"
                        className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
                        style={{ background: "rgba(124,252,0,0.12)", color: "#7CFC00", border: "1px solid rgba(124,252,0,0.2)" }}>
                        <Utensils className="w-3 h-3" /> Log your first meal
                      </Link>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex justify-between w-full mt-3 px-2">
                <span className="text-[10px]" style={{ color: "#5A5A5A" }}>0</span>
                <span className="text-[10px]" style={{ color: "#5A5A5A" }}>{CALORIE_GOAL.toLocaleString()} kcal</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ══ CLIENT ROSTER CAROUSEL ══ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-white" style={{ fontSize: 20, fontFamily: "Inter,sans-serif" }}>Client Roster</h2>
              <span className="font-semibold text-black text-xs px-2.5 py-0.5 rounded-xl" style={{ background: "#7CFC00" }}>
                {filteredMembers.length}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => switchClient(safeIdx - 1)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ background: "rgba(22,22,26,0.8)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#7CFC00"; (e.currentTarget as HTMLElement).style.color = "#000"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(22,22,26,0.8)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => switchClient(safeIdx + 1)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ background: "rgba(22,22,26,0.8)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#7CFC00"; (e.currentTarget as HTMLElement).style.color = "#000"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(22,22,26,0.8)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Carousel with edge mask */}
          <div className="relative carousel-mask" style={{ height: 180 }}>
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto no-scrollbar h-full items-center px-4"
              style={{ scrollSnapType: "x mandatory", scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
            >
              {filteredMembers.map((member, idx) => {
                const selected = idx === safeIdx;
                const sColor = clientStatus(member);
                return (
                  <motion.button
                    key={member.id}
                    onClick={() => switchClient(idx)}
                    animate={{ scale: selected ? 1.05 : 1 }}
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="flex-shrink-0 flex flex-col items-center gap-2 p-4 transition-all"
                    style={{
                      width: 120, height: 160,
                      background: "#16161A",
                      border: selected ? `2px solid #7CFC00` : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 16,
                      boxShadow: selected ? "0 0 20px rgba(124,252,0,0.3)" : "0 4px 20px rgba(0,0,0,0.4)",
                      scrollSnapAlign: "start",
                    }}
                  >
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-black flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #7CFC00, #39FF14)",
                        border: `2px solid ${sColor}`,
                        boxShadow: `0 0 0 3px ${sColor}33`,
                      }}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-white font-semibold text-xs text-center w-full truncate px-1" style={{ fontFamily: "Inter,sans-serif" }}>
                      {member.name}
                    </p>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg"
                      style={{ background: "rgba(124,252,0,0.15)", color: "#7CFC00", fontFamily: "Inter,sans-serif" }}>
                      {member.membership_type || "Standard"}
                    </span>
                    <div className="flex items-center gap-1.5 mt-auto">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: sColor }} />
                      <span className="text-[10px]" style={{ color: "#8B8B8B" }}>
                        {new Date(member.sub_expiry_date) > new Date() ? "Active" : "Expired"}
                      </span>
                    </div>
                  </motion.button>
                );
              })}

              {/* Add Client card */}
              <button
                onClick={() => setIsAddOpen(true)}
                className="flex-shrink-0 flex flex-col items-center justify-center gap-2 transition-all"
                style={{
                  width: 120, height: 160,
                  background: "rgba(124,252,0,0.08)",
                  border: "2px dashed #7CFC00",
                  borderRadius: 16, scrollSnapAlign: "start",
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(124,252,0,0.15)" }}>
                  <Plus className="w-6 h-6" style={{ color: "#7CFC00" }} />
                </div>
                <span className="text-xs font-medium" style={{ color: "#7CFC00", fontFamily: "Inter,sans-serif" }}>Add New</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══ DETAIL + SCHEDULE ROW ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {isRefreshing ? (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SkeletonCard height={280} />
                </motion.div>
              ) : !activeClient ? (
                <div style={{ ...cardStyle, padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                  <Users className="w-10 h-10 mb-3 opacity-30 text-white" />
                  <p className="text-white font-semibold">No Clients Yet</p>
                  <p className="text-sm mt-1" style={{ color: "#8B8B8B" }}>Add a client to get started.</p>
                </div>
              ) : (
                <motion.div
                  key={activeClient.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <div style={{ ...cardStyle, padding: 24, background: "linear-gradient(135deg, rgba(124,252,0,0.04), #16161A)" }}>
                    {/* Header row */}
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <p className="font-bold uppercase tracking-widest text-[10px] mb-1" style={{ color: "#7CFC00" }}>Client Spotlight</p>
                        <h2 className="text-2xl font-bold text-white uppercase" style={{ fontFamily: "Inter,sans-serif" }}>{activeClient.name}</h2>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase"
                          style={{ border: "1px solid rgba(234,179,8,0.3)", background: "rgba(0,0,0,0.4)", color: "#F59E0B" }}>
                          <Star className="w-3 h-3 fill-current" /> CLIENT
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => router.push(`/coach/messages?memberId=${activeClient.id}`)}
                            className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors hover:bg-white/10"
                            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                            <MessageSquare className="w-3.5 h-3.5 text-white" />
                          </button>
                          <button onClick={() => { setEditingClient(activeClient); setIsEditClientOpen(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white border transition-colors hover:bg-white/10"
                            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                            Edit <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-5">
                      {[
                        { Icon: Tag, val: activeClient.membership_code || "—" },
                        { Icon: Calendar, val: `Joined ${new Date(activeClient.created_at || Date.now()).toLocaleDateString()}` },
                        { Icon: Smartphone, val: activeClient.phone || "—" },
                        { Icon: Mail, val: activeClient.email || "No email" },
                        { Icon: User, val: `Type: ${activeClient.membership_type}` },
                        { Icon: MapPin, val: "Local Branch" },
                      ].map(({ Icon, val }, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(124,252,0,0.1)", border: "1px solid rgba(124,252,0,0.2)" }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: "#7CFC00" }} />
                          </div>
                          <span className="text-xs font-semibold text-white truncate" style={{ fontFamily: "Inter,sans-serif" }}>{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white">Fitness Progress</span>
                        <span className="font-bold text-sm" style={{ color: "#7CFC00" }}>68%</span>
                      </div>
                      <div className="rounded-full overflow-hidden" style={{ height: 10, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <motion.div className="h-full rounded-full"
                          style={{ background: "linear-gradient(90deg, #7CFC00, #39FF14)", boxShadow: "0 0 10px rgba(124,252,0,0.5)" }}
                          initial={{ width: 0 }} animate={{ width: "68%" }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mission Schedule */}
          <div style={{ ...cardStyle, padding: 24, display: "flex", flexDirection: "column", borderLeft: "4px solid #7CFC00" }}>
            <h3 className="font-semibold text-white mb-0.5" style={{ fontSize: 18, fontFamily: "Inter,sans-serif" }}>Mission Schedule</h3>
            <p className="text-sm font-medium mb-5" style={{ color: "#7CFC00" }}>{new Date().toLocaleDateString()}</p>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
              {todaySessions.length > 0 ? todaySessions.map((s: any) => (
                <div key={s.id} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Clock className="w-3.5 h-3.5" style={{ color: "#7CFC00" }} />
                      {new Date(s.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: s.status === "completed" ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.1)", color: s.status === "completed" ? "#10B981" : "#8B8B8B" }}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">{s.member_name}</p>
                  <p className="text-xs mb-2" style={{ color: "#8B8B8B" }}>{s.session_type}</p>
                  <button onClick={() => router.push("/coach/schedule")} className="w-full text-xs py-1.5 rounded-lg border font-medium transition-colors hover:border-primary/50"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#8B8B8B" }}>
                    View Details
                  </button>
                </div>
              )) : (
                <div className="h-32 flex flex-col items-center justify-center" style={{ color: "#5A5A5A" }}>
                  <Calendar className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No missions today.</p>
                </div>
              )}
            </div>
            <button onClick={() => router.push("/coach/schedule")}
              className="w-full mt-4 py-2.5 rounded-xl font-semibold text-sm text-black transition-all"
              style={{ background: "#7CFC00", fontFamily: "Inter,sans-serif" }}>
              + New Entry
            </button>
          </div>
        </div>

        {/* ══ FULL ROSTER TABLE ══ */}
        <div style={{ ...cardStyle, overflow: "hidden" }}>
          <div className="p-5 flex flex-col lg:flex-row justify-between items-center gap-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-white italic uppercase" style={{ fontSize: 20, fontFamily: "Inter,sans-serif" }}>Client Roster</h2>
              <span className="font-bold text-xs px-2.5 py-0.5 rounded-full" style={{ background: "rgba(124,252,0,0.15)", color: "#7CFC00" }}>
                {filteredMembers.length}
              </span>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#5A5A5A" }} />
              <input
                type="text"
                placeholder="Filter by name or code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-full py-2 pl-10 pr-4 text-sm text-white outline-none transition-colors"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "Inter,sans-serif" }}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                  {["Client","Code","Status","Type","Actions"].map((h, i) => (
                    <th key={h} className="p-4 text-[10px] uppercase tracking-widest" style={{ color: "#5A5A5A", paddingLeft: i === 0 ? 24 : undefined, paddingRight: i === 4 ? 24 : undefined, textAlign: i === 4 ? "right" : undefined }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="border-b transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <td className="p-4" style={{ paddingLeft: 24 }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black"
                          style={{ background: "linear-gradient(135deg, #7CFC00, #39FF14)" }}>
                          {m.name.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-white" style={{ fontFamily: "Inter,sans-serif" }}>{m.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-mono" style={{ color: "#8B8B8B" }}>{m.membership_code}</td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: new Date(m.sub_expiry_date) > new Date() ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                          color: new Date(m.sub_expiry_date) > new Date() ? "#10B981" : "#ef4444"
                        }}>
                        {new Date(m.sub_expiry_date) > new Date() ? "Active" : "Expired"}
                      </span>
                    </td>
                    <td className="p-4 text-xs" style={{ color: "#8B8B8B" }}>{m.membership_type}</td>
                    <td className="p-4 text-right" style={{ paddingRight: 24 }}>
                      <button 
                         onClick={() => {
                           setSelectedClient(m.id, m.name);
                           router.push("/coach/calories");
                         }} 
                         className="text-xs font-bold mr-4 transition-colors hover:opacity-80" 
                         style={{ color: "#7CFC00" }}
                      >
                        Select
                      </button>
                      <button onClick={() => { setEditingClient(m); setIsEditClientOpen(true); }}
                        className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:border-white/30"
                        style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#8B8B8B" }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ══ WORKOUT TRACKER ══ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-white" style={{ fontSize: 20, fontFamily: "Inter,sans-serif" }}>Workout Tracker</h2>
              <p className="text-sm mt-0.5" style={{ color: "#8B8B8B" }}>Track client exercise sets in real-time</p>
            </div>
            <button
              onClick={() => setExercises(DEMO_EXERCISES)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
              style={{ background: "rgba(124,252,0,0.1)", color: "#7CFC00", border: "1px solid rgba(124,252,0,0.2)" }}
            >
              Reset Demo
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {exercises.map((ex) => (
              <WorkoutExerciseCard
                key={ex.id}
                exercise={ex}
                onChange={(updated) =>
                  setExercises((prev) =>
                    prev.map((e) => (e.id === updated.id ? updated : e))
                  )
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* ══ ASSIGN CLIENT MODAL ══ */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ ...cardStyle, width: "100%", maxWidth: 520, padding: 32, position: "relative" }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white uppercase" style={{ fontFamily: "Inter,sans-serif" }}>Assign Client to Roster</h2>
                <button onClick={() => setIsAddOpen(false)} style={{ color: "#8B8B8B" }}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <Input
                  placeholder="Search unassigned members by name or code..."
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                />
                <div className="max-h-60 overflow-y-auto space-y-2 mt-4 pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
                  {isSearchingUnassigned ? (
                     <div className="text-sm text-gray-400 text-center py-4">Searching...</div>
                  ) : unassignedMembers.length === 0 ? (
                     <div className="text-sm text-gray-500 text-center py-4">No unassigned members found.</div>
                  ) : (
                    unassignedMembers.map((m: Member) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5">
                        <div>
                          <div className="text-white font-bold">{m.name}</div>
                          <div className="text-xs text-gray-400">{m.membership_code}</div>
                        </div>
                        <button
                          onClick={() => assignMemberMutation.mutate({ id: m.id, action: "assign" }, { onSuccess: () => { refetchMembers(); setIsAddOpen(false); setAssignSearchQuery(""); }})}
                          disabled={assignMemberMutation.isPending}
                          className="px-4 py-1.5 rounded-lg text-sm font-bold text-black hover:opacity-80 disabled:opacity-50 transition-opacity"
                          style={{ background: "#7CFC00" }}
                        >
                          {assignMemberMutation.isPending ? "Assigning..." : "Assign"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ EDIT CLIENT MODAL ══ */}
      <AnimatePresence>
        {isEditClientOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditClientOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ ...cardStyle, width: "100%", maxWidth: 440, padding: 28, position: "relative" }}>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: "Inter,sans-serif" }}>Edit Client</h2>
                <button onClick={() => setIsEditClientOpen(false)} style={{ color: "#8B8B8B" }}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleEditClient} className="space-y-4">
                <div><Label>Full Name</Label><Input value={editingClient.name || ""} onChange={e => setEditingClient({ ...editingClient, name: e.target.value })} required /></div>
                <div><Label>Email</Label><Input type="email" value={editingClient.email || ""} onChange={e => setEditingClient({ ...editingClient, email: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={editingClient.phone || ""} onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })} /></div>
                <div><Label>Membership Type</Label><Input value={editingClient.membership_type || ""} onChange={e => setEditingClient({ ...editingClient, membership_type: e.target.value })} /></div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsEditClientOpen(false)}>Cancel</Button>
                  <button type="submit" disabled={updateMemberMutation.isPending} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-black" style={{ background: "#7CFC00" }}>
                    {updateMemberMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ BROADCAST MODAL ══ */}
      <AnimatePresence>
        {isBroadcastOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBroadcastOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ ...cardStyle, width: "100%", maxWidth: 420, padding: 28, position: "relative" }}>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-white uppercase" style={{ fontFamily: "Inter,sans-serif" }}>Broadcast</h2>
                <button onClick={() => setIsBroadcastOpen(false)} style={{ color: "#8B8B8B" }}><X className="w-5 h-5" /></button>
              </div>
              <textarea value={broadcastText} onChange={e => setBroadcastText(e.target.value)}
                placeholder="Type your message to all clients..."
                rows={4}
                className="w-full rounded-xl p-4 text-sm text-white resize-none outline-none transition-colors"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "Inter,sans-serif" }}
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setIsBroadcastOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#8B8B8B" }}>
                  Cancel
                </button>
                <button onClick={() => { alert("Broadcast coming soon!"); setIsBroadcastOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2"
                  style={{ background: "#7CFC00" }}>
                  <Megaphone className="w-4 h-4" /> Send to All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </CoachLayout>
  );
}
