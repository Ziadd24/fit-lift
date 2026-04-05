"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Crown, Play, CheckCircle2, Clock, ChevronDown,
  ChevronUp, Flame, Target, RotateCcw, Plus, Minus, Timer,
  Trophy, Zap, Edit3, Trash2
} from "lucide-react";
import { useListWorkouts, useCreateWorkout, useUpdateWorkout, useDeleteWorkout } from "@/lib/api-hooks";

// ─── Data ─────────────────────────────────────────────────────────────────────
const WORKOUTS = [
  {
    id: 1,
    title: "Leg Day — Heavy Squats",
    coachAssigned: true,
    status: "in-progress",
    duration: "45 min",
    calories: 380,
    muscles: ["Quads", "Glutes", "Hamstrings"],
    difficulty: "Hard",
    sets: [
      { exercise: "Barbell Back Squat", sets: 5, reps: "5", weight: "100kg", done: true },
      { exercise: "Romanian Deadlift", sets: 4, reps: "8", weight: "80kg", done: true },
      { exercise: "Leg Press", sets: 3, reps: "12", weight: "140kg", done: false },
      { exercise: "Leg Curl", sets: 3, reps: "15", weight: "50kg", done: false },
    ],
  },
  {
    id: 2,
    title: "Upper Body — Bench Press",
    coachAssigned: true,
    status: "todo",
    duration: "60 min",
    calories: 320,
    muscles: ["Chest", "Shoulders", "Triceps"],
    difficulty: "Medium",
    sets: [
      { exercise: "Flat Bench Press", sets: 4, reps: "8", weight: "80kg", done: false },
      { exercise: "Incline DB Press", sets: 3, reps: "10", weight: "30kg", done: false },
      { exercise: "Cable Fly", sets: 3, reps: "12", weight: "15kg", done: false },
      { exercise: "Tricep Pushdown", sets: 3, reps: "15", weight: "25kg", done: false },
      { exercise: "Overhead Press", sets: 3, reps: "8", weight: "50kg", done: false },
    ],
  },
  {
    id: 3,
    title: "Active Recovery & Stretch",
    coachAssigned: false,
    status: "todo",
    duration: "20 min",
    calories: 80,
    muscles: ["Full Body", "Mobility"],
    difficulty: "Easy",
    sets: [
      { exercise: "PNF Hip Flexor Stretch", sets: 2, reps: "60s", weight: "—", done: false },
      { exercise: "World's Greatest Stretch", sets: 3, reps: "5/side", weight: "—", done: false },
      { exercise: "Foam Roll IT Band", sets: 1, reps: "90s/side", weight: "—", done: false },
    ],
  },
];

const WEEK_PLAN = [
  { day: "Mon", label: "Legs", done: true, color: "#7CFC00" },
  { day: "Tue", label: "Rest", done: true, color: "#5A5A5A" },
  { day: "Wed", label: "Upper", done: true, color: "#8B5CF6" },
  { day: "Thu", label: "Cardio", done: false, color: "#F59E0B" },
  { day: "Fri", label: "Upper", done: false, color: "#8B5CF6" },
  { day: "Sat", label: "Legs", done: false, color: "#7CFC00" },
  { day: "Sun", label: "Rest", done: false, color: "#5A5A5A" },
];

const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const difficultyColor: Record<string, string> = {
  Easy: "#10B981",
  Medium: "#F59E0B",
  Hard: "#EF4444",
};

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  todo: { bg: "rgba(255,255,255,0.1)", color: "#8B8B8B", label: "To Do" },
  "in-progress": { bg: "rgba(139,92,246,0.2)", color: "#8B5CF6", label: "In Progress" },
  done: { bg: "rgba(16,185,129,0.2)", color: "#10B981", label: "Done" },
};

// ─── Rest Timer ───────────────────────────────────────────────────────────────
function RestTimer() {
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(90);
  const [initial] = useState(90);

  useEffect(() => {
    if (!active) return;
    if (seconds <= 0) { setActive(false); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [active, seconds]);

  const pct = (seconds / initial) * 100;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 16px" }}>
      <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
        <svg width={64} height={64} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={32} cy={32} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
          <circle cx={32} cy={32} r={r} fill="none" stroke={seconds <= 10 ? "#EF4444" : "#7CFC00"} strokeWidth={5}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: seconds <= 10 ? "#EF4444" : "#FFFFFF" }}>
          {seconds}s
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", marginBottom: 4 }}>Rest Timer</div>
        <div style={{ fontSize: 12, color: "#8B8B8B" }}>90 seconds recommended</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => { setSeconds(s => Math.min(s + 15, initial)); }}
          style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "none", color: "#8B8B8B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => { if (active) { setActive(false); setSeconds(initial); } else { setSeconds(initial); setActive(true); } }}
          style={{ width: 32, height: 32, borderRadius: "50%", background: active ? "rgba(239,68,68,0.2)" : "rgba(124,252,0,0.2)", border: `1px solid ${active ? "rgba(239,68,68,0.4)" : "rgba(124,252,0,0.4)"}`, color: active ? "#EF4444" : "#7CFC00", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {active ? <RotateCcw size={14} /> : <Play size={14} />}
        </button>
      </div>
    </div>
  );
}

// ─── Workout Card ─────────────────────────────────────────────────────────────
function WorkoutCard({ workout, isPrivate, delay, onEdit, onDelete }: { workout: any; isPrivate: boolean; delay: number; onEdit?: () => void; onDelete?: () => void; }) {
  const [expanded, setExpanded] = useState(workout.status === "in-progress");
  const [setsDone, setSetsDone] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    workout.sets.forEach((s, i) => { init[i] = s.done; });
    return init;
  });

  const completedSets = Object.values(setsDone).filter(Boolean).length;
  const totalSets = workout.sets.length;
  const completionPct = Math.round((completedSets / totalSets) * 100);
  const sc = statusConfig[workout.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.07, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{ marginBottom: 16 }}
    >
      <div
        style={{
          background: "#16161A",
          border: `1px solid ${workout.coachAssigned && isPrivate ? "rgba(124,252,0,0.2)" : "rgba(255,255,255,0.06)"}`,
          borderLeft: workout.coachAssigned && isPrivate ? "3px solid #7CFC00" : "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          onClick={() => setExpanded(!expanded)}
          style={{ padding: "20px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}
        >
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(124,252,0,0.1)", border: "1px solid rgba(124,252,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Dumbbell size={22} color="#7CFC00" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>{workout.title}</span>
              {workout.coachAssigned && isPrivate && (
                <span style={{ fontSize: 10, color: "#7CFC00", background: "rgba(124,252,0,0.1)", border: "1px solid rgba(124,252,0,0.2)", borderRadius: 6, padding: "2px 6px", display: "flex", alignItems: "center", gap: 3 }}>
                  <Crown size={8} /> Coach
                </span>
              )}
              <span style={{ fontSize: 10, background: `${difficultyColor[workout.difficulty]}20`, color: difficultyColor[workout.difficulty], borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>{workout.difficulty}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#8B8B8B", fontSize: 12 }}>
                <Clock size={12} /> {workout.duration}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#8B8B8B", fontSize: 12 }}>
                <Flame size={12} color="#F59E0B" style={{ color: "#F59E0B" }} /> {workout.calories} kcal
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {workout.muscles.map(m => (
                  <span key={m} style={{ fontSize: 10, color: "#8B5CF6", background: "rgba(139,92,246,0.15)", borderRadius: 6, padding: "2px 6px" }}>{m}</span>
                ))}
              </div>
            </div>
          </div>
          {/* Progress ring + status */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ position: "relative", width: 44, height: 44 }}>
              {(() => {
                const r2 = 18, circ2 = 2 * Math.PI * r2;
                const offset2 = circ2 - (completionPct / 100) * circ2;
                return (
                  <svg width={44} height={44} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={22} cy={22} r={r2} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
                    <circle cx={22} cy={22} r={r2} fill="none" stroke="#7CFC00" strokeWidth={4}
                      strokeDasharray={circ2} strokeDashoffset={offset2} strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 0.6s ease" }} />
                  </svg>
                );
              })()}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#FFFFFF" }}>
                {completionPct}%
              </div>
            </div>
            <div style={{ background: sc.bg, color: sc.color, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>{sc.label}</div>
            <button onClick={(e) => { e.stopPropagation(); if (onEdit) onEdit(); }} style={{ background: "none", border: "none", color: "#8B8B8B", cursor: "pointer", display: "flex" }}><Edit3 size={16} /></button>
            <button onClick={(e) => { e.stopPropagation(); if (onDelete) onDelete(); }} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", display: "flex" }}><Trash2 size={16} /></button>
            {expanded ? <ChevronUp size={16} color="#8B8B8B" /> : <ChevronDown size={16} color="#8B8B8B" />}
          </div>
        </div>

        {/* Expanded sets */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ padding: "0 24px 20px" }}>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 16 }} />
                {/* Progress bar */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8B8B8B", marginBottom: 6 }}>
                    <span>{completedSets} of {totalSets} exercises completed</span>
                    <span style={{ color: "#7CFC00", fontWeight: 600 }}>{completionPct}%</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <motion.div
                      animate={{ width: `${completionPct}%` }}
                      transition={{ duration: 0.5 }}
                      style={{ height: "100%", background: "linear-gradient(90deg, #7CFC00, #39FF14)", borderRadius: 4 }}
                    />
                  </div>
                </div>

                {/* Sets table */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 64px 64px 80px 44px", gap: 8, padding: "6px 12px", marginBottom: 4 }}>
                    {["Exercise", "Sets", "Reps", "Weight", ""].map(h => (
                      <div key={h} style={{ fontSize: 10, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
                    ))}
                  </div>
                  {workout.sets.map((set, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.2 }}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 64px 64px 80px 44px",
                        gap: 8,
                        padding: "10px 12px",
                        background: setsDone[idx] ? "rgba(124,252,0,0.05)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${setsDone[idx] ? "rgba(124,252,0,0.15)" : "rgba(255,255,255,0.04)"}`,
                        borderRadius: 10,
                        marginBottom: 6,
                        alignItems: "center",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500, color: setsDone[idx] ? "#7CFC00" : "#FFFFFF" }}>{set.exercise}</div>
                      <div style={{ fontSize: 13, color: "#8B8B8B", textAlign: "center" }}>{set.sets}</div>
                      <div style={{ fontSize: 13, color: "#8B8B8B", textAlign: "center" }}>{set.reps}</div>
                      <div style={{ fontSize: 13, color: "#8B8B8B", textAlign: "center" }}>{set.weight}</div>
                      <button
                        onClick={() => setSetsDone(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${setsDone[idx] ? "#7CFC00" : "rgba(255,255,255,0.2)"}`, background: setsDone[idx] ? "rgba(124,252,0,0.15)" : "transparent", color: setsDone[idx] ? "#7CFC00" : "#5A5A5A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease" }}
                      >
                        {setsDone[idx] ? <CheckCircle2 size={14} /> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />}
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Rest Timer */}
                <RestTimer />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main WorkoutsTab ─────────────────────────────────────────────────────────
export default function WorkoutsTab({ isPrivate, memberId }: { isPrivate: boolean, memberId: number }) {
  const { data: dbWorkouts } = useListWorkouts(memberId);
  const createWorkoutMutation = useCreateWorkout();
  const updateWorkoutMutation = useUpdateWorkout();
  const deleteWorkoutMutation = useDeleteWorkout();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<any>(null);

  const displayWorkouts = dbWorkouts && dbWorkouts.length > 0 ? dbWorkouts : WORKOUTS;

  const todayPlan = WEEK_PLAN[TODAY_IDX % WEEK_PLAN.length];
  const streak = 5;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Dumbbell size={26} color="#7CFC00" />
          <span style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF" }}>Your Workouts</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "8px 14px" }}>
          <Zap size={16} color="#F59E0B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>{streak}-Day Streak</span>
        </div>
      </motion.div>

      {/* Weekly plan strip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "#8B8B8B", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 16 }}>This Week</div>
        <div style={{ display: "flex", gap: 8 }}>
          {WEEK_PLAN.map((day, i) => {
            const isToday = i === TODAY_IDX % WEEK_PLAN.length;
            return (
              <div
                key={day.day}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
              >
                <div style={{ fontSize: 11, color: isToday ? "#7CFC00" : "#5A5A5A", fontWeight: isToday ? 700 : 400 }}>{day.day}</div>
                <div style={{
                  width: "100%", padding: "8px 0", borderRadius: 10, background: isToday ? "rgba(124,252,0,0.1)" : "rgba(255,255,255,0.03)",
                  border: isToday ? "1px solid rgba(124,252,0,0.3)" : "1px solid rgba(255,255,255,0.04)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  position: "relative", overflow: "hidden",
                }}>
                  {day.done && <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(124,252,0,0.04)" }} />}
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: day.done ? "#7CFC00" : "rgba(255,255,255,0.15)" }} />
                  <span style={{ fontSize: 9, color: isToday ? "#7CFC00" : "#5A5A5A", textAlign: "center", lineHeight: 1.2 }}>{day.label}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Target size={14} color="#7CFC00" />
          <span style={{ fontSize: 12, color: "#8B8B8B" }}>
            Today: <span style={{ color: "#FFFFFF", fontWeight: 600 }}>{todayPlan.label}</span>
          </span>
        </div>
      </motion.div>

      {/* Workout cards */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#8B8B8B", textTransform: "uppercase", letterSpacing: "0.8px" }}>
            Assigned Workouts
          </div>
          <button
            onClick={() => { setEditingWorkout(null); setIsModalOpen(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#7CFC00", border: "none", borderRadius: 10, padding: "6px 12px", color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
          >
            <Plus size={14} /> Add Workout
          </button>
        </div>
        {displayWorkouts.map((w: any, i: number) => (
          <WorkoutCard 
            key={w.id} 
            workout={w} 
            isPrivate={isPrivate} 
            delay={i} 
            onEdit={() => { setEditingWorkout(w); setIsModalOpen(true); }}
            onDelete={() => { if(confirm("Delete workout?")) deleteWorkoutMutation.mutate({ id: w.id }); }}
          />
        ))}
      </div>

      {/* Workout Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: "#1A1A1F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400, maxHeight: "90vh", overflowY: "auto" }}
            >
              <h2 style={{ color: "#FFF", marginBottom: 20 }}>{editingWorkout ? "Edit Workout" : "Add Workout"}</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get("title") as string;
                const duration = formData.get("duration") as string;
                const calories = parseInt(formData.get("calories") as string);
                
                const data = {
                  title, duration, calories,
                  status: "todo", difficulty: "Medium",
                  muscles: ["Unknown"],
                  sets: [
                    { exercise: "Sample Exercise", sets: 3, reps: "10", weight: "20kg", done: false }
                  ]
                };

                if (editingWorkout) {
                  updateWorkoutMutation.mutate(
                    { id: editingWorkout.id, data },
                    {
                      onSuccess: () => setIsModalOpen(false),
                      onError: () => alert("Cannot save workout: Database table 'client_workouts' is missing! Please run the SQL script in your Supabase dashboard.")
                    }
                  );
                }
                else {
                  createWorkoutMutation.mutate(
                    { member_id: memberId, ...data, coach_assigned: false },
                    {
                      onSuccess: () => setIsModalOpen(false),
                      onError: () => alert("Cannot save workout: Database table 'client_workouts' is missing! Please run the SQL script in your Supabase dashboard.")
                    }
                  );
                }
              }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", color: "#8B8B8B", fontSize: 13, marginBottom: 8 }}>Workout Title</label>
                  <input name="title" defaultValue={editingWorkout?.title || ""} required style={{ width: "100%", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", color: "#8B8B8B", fontSize: 13, marginBottom: 8 }}>Duration</label>
                  <input name="duration" defaultValue={editingWorkout?.duration || "45 min"} required style={{ width: "100%", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", color: "#8B8B8B", fontSize: 13, marginBottom: 8 }}>Calories (kcal)</label>
                  <input name="calories" type="number" defaultValue={editingWorkout?.calories || 300} required style={{ width: "100%", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }} />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.05)", color: "#FFF", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={createWorkoutMutation.isPending || updateWorkoutMutation.isPending} style={{ flex: 1, padding: 12, background: "#7CFC00", color: "#000", fontWeight: 600, border: "none", borderRadius: 8, cursor: "pointer" }}>Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
