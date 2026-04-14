"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dumbbell, Crown, Play, CheckCircle2, Clock, ChevronDown,
  ChevronUp, Flame, Target, RotateCcw, Plus, Minus, Timer,
  Trophy, Zap, Edit3, Trash2, Mic, MicOff, X, Pause,
} from "lucide-react";
import { useListWorkouts, useCreateWorkout, useUpdateWorkout, useDeleteWorkout } from "@/lib/api-hooks";
import { WorkoutExerciseCard } from "@/components/ui/WorkoutExerciseCard";

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
      { exercise: "Barbell Back Squat", sets: 5, reps: "5", weight: 100, unit: "kg", done: true },
      { exercise: "Romanian Deadlift", sets: 4, reps: "8", weight: 80, unit: "kg", done: true },
      { exercise: "Leg Press", sets: 3, reps: "12", weight: 140, unit: "kg", done: false },
      { exercise: "Leg Curl", sets: 3, reps: "15", weight: 50, unit: "kg", done: false },
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
      { exercise: "Flat Bench Press", sets: 4, reps: "8", weight: 80, unit: "kg", done: false },
      { exercise: "Incline DB Press", sets: 3, reps: "10", weight: 30, unit: "kg", done: false },
      { exercise: "Cable Fly", sets: 3, reps: "12", weight: 15, unit: "kg", done: false },
      { exercise: "Tricep Pushdown", sets: 3, reps: "15", weight: 25, unit: "kg", done: false },
      { exercise: "Overhead Press", sets: 3, reps: "8", weight: 50, unit: "kg", done: false },
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
      { exercise: "PNF Hip Flexor Stretch", sets: 2, reps: "60s", weight: 0, unit: "—", done: false },
      { exercise: "World's Greatest Stretch", sets: 3, reps: "5/side", weight: 0, unit: "—", done: false },
      { exercise: "Foam Roll IT Band", sets: 1, reps: "90s/side", weight: 0, unit: "—", done: false },
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

// ─── Floating Rest Timer FAB ───────────────────────────────────────────────────
function FloatingRestTimer() {
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(90);
  const [initial] = useState(90);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!active) return;
    if (seconds <= 0) {
      setActive(false);
      // Vibrate on finish (Android Chrome)
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      return;
    }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [active, seconds]);

  const pct = (seconds / initial) * 100;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const timeColor = seconds <= 10 ? "#EF4444" : "#7CFC00";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const timeStr = min > 0 ? `${min}:${sec.toString().padStart(2, "0")}` : `${seconds}s`;

  return (
    <>
      {/* Sticky timer header when active */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="lg:hidden"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              background: "rgba(13,13,16,0.97)",
              backdropFilter: "blur(12px)",
              borderBottom: `1px solid ${timeColor}30`,
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <svg width={48} height={48} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
              <circle cx={24} cy={24} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
              <circle cx={24} cy={24} r={r} fill="none" stroke={timeColor} strokeWidth={4}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
            </svg>
            <div>
              <div style={{ fontSize: 11, color: "#8B8B8B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rest Timer</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: timeColor, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{timeStr}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button
                onClick={() => { setSeconds(s => Math.min(s + 15, 180)); }}
                style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "none", color: "#8B8B8B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => { setActive(false); setSeconds(initial); }}
                style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop inline timer card */}
      <div className="hidden lg:flex" style={{ alignItems: "center", gap: 12, background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 16px" }}>
        <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
          <svg width={56} height={56} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={28} cy={28} r={22} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
            <circle cx={28} cy={28} r={22} fill="none" stroke={timeColor} strokeWidth={5}
              strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: timeColor }}>{timeStr}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", marginBottom: 2 }}>Rest Timer</div>
          <div style={{ fontSize: 12, color: "#8B8B8B" }}>90 seconds recommended</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setSeconds(s => Math.min(s + 15, 180))}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "none", color: "#8B8B8B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plus size={14} />
          </button>
          <button onClick={() => { if (active) { setActive(false); setSeconds(initial); } else { setSeconds(initial); setActive(true); } }}
            style={{ width: 36, height: 36, borderRadius: "50%", background: active ? "rgba(239,68,68,0.2)" : "rgba(124,252,0,0.2)", border: `1px solid ${active ? "rgba(239,68,68,0.4)" : "rgba(124,252,0,0.4)"}`, color: active ? "#EF4444" : "#7CFC00", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {active ? <RotateCcw size={14} /> : <Play size={14} />}
          </button>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        className="fab lg:hidden"
        onClick={() => { if (!active) { setSeconds(initial); setActive(true); } else { setActive(false); setSeconds(initial); } }}
        style={{
          bottom: 90,
          right: 20,
          width: 56,
          height: 56,
          background: active ? "#EF4444" : "#7CFC00",
        }}
      >
        {active
          ? <Pause size={22} color="#fff" />
          : <Timer size={22} color="#000" />
        }
      </button>
    </>
  );
}

// ─── Voice Logger ──────────────────────────────────────────────────────────────
function VoiceButton({ onResult }: { onResult: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recogRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) setSupported(false);
  }, []);

  const toggle = () => {
    if (!supported) {
      alert("Voice logging isn't supported in this browser. Use your keyboard mic button instead.");
      return;
    }
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onResult(text);
    };
    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);
    recogRef.current = recog;
    recog.start();
    setListening(true);
    // Vibrate to confirm start (Android)
    if (navigator.vibrate) navigator.vibrate(50);
  };

  return (
    <button
      onClick={toggle}
      title={supported ? "Log by voice" : "Voice not supported — use keyboard mic"}
      style={{
        width: 36, height: 36, borderRadius: "50%",
        background: listening ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${listening ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
        color: listening ? "#EF4444" : "#5A5A5A",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {listening ? <MicOff size={15} /> : <Mic size={15} />}
    </button>
  );
}

// ─── Exercise Card (mobile-first) ─────────────────────────────────────────────
function ExerciseCard({ ex, idx, onSetToggle, onWeightChange }: {
  ex: any; idx: number;
  onSetToggle: (exIdx: number, setIdx: number) => void;
  onWeightChange: (exIdx: number, delta: number) => void;
}) {
  const completedSets = (ex.completedSets as boolean[]).filter(Boolean).length;
  const isBodyweight = ex.unit === "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      style={{
        background: "#16161A",
        border: `1px solid ${completedSets === ex.sets ? "rgba(124,252,0,0.25)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 14,
        padding: "16px",
        marginBottom: 10,
      }}
    >
      {/* Exercise name + voice */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: completedSets === ex.sets ? "#7CFC00" : "#FFFFFF" }}>
            {ex.exercise}
          </div>
          <div style={{ fontSize: 12, color: "#8B8B8B", marginTop: 2 }}>
            {ex.sets} sets · {ex.reps} reps{!isBodyweight ? ` · ${ex.weight}${ex.unit}` : ""}
          </div>
        </div>
        <VoiceButton onResult={(text) => {
          // parse spoken weight like "80 kilos" or "3 sets"
          console.log("Voice input:", text);
        }} />
      </div>

      {/* Set tap buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: isBodyweight ? 0 : 12 }}>
        {(ex.completedSets as boolean[]).map((done: boolean, si: number) => (
          <button
            key={si}
            className={cn("set-btn", done && "done")}
            onClick={() => onSetToggle(idx, si)}
          >
            {done ? <CheckCircle2 size={16} /> : <span style={{ fontSize: 10 }}>Set</span>}
            {!done && <span>{si + 1}</span>}
          </button>
        ))}
      </div>

      {/* Weight adjuster */}
      {!isBodyweight && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="touch-target"
            onClick={() => onWeightChange(idx, -2.5)}
            style={{ width: 40, height: 40, minWidth: 40, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#8B8B8B", cursor: "pointer", fontSize: 18 }}
          >
            −
          </button>
          <div style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>
            {ex.weight} {ex.unit}
          </div>
          <button
            className="touch-target"
            onClick={() => onWeightChange(idx, +2.5)}
            style={{ width: 40, height: 40, minWidth: 40, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#8B8B8B", cursor: "pointer", fontSize: 18 }}
          >
            +
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Workout Card ─────────────────────────────────────────────────────────────
function WorkoutCard({ workout, isPrivate, delay, onEdit, onDelete }: {
  workout: any; isPrivate: boolean; delay: number; onEdit?: () => void; onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(workout.status === "in-progress");
  const [editingExercise, setEditingExercise] = useState<any>(null);

  // Per-set completion state (array of booleans per exercise)
  const [exerciseState, setExerciseState] = useState<{ completedSets: boolean[]; weight: number; nameStr: string; typeStr: string; duration: number }[]>(() =>
    workout.sets.map((s: any) => ({
      completedSets: Array.from({ length: s.sets }, (_, i) => i < (s.done ? s.sets : 0)),
      weight: s.weight ?? 0,
      nameStr: s.exercise,
      typeStr: s.unit === "—" ? "Bodyweight" : "Bilateral",
      duration: 5,
    }))
  );

  const totalSets = exerciseState.reduce((a, e) => a + (e ? e.completedSets.length : 0), 0);
  const completedTotal = exerciseState.reduce((a, e) => a + (e ? e.completedSets.filter(Boolean).length : 0), 0);
  const completionPct = totalSets > 0 ? Math.round((completedTotal / totalSets) * 100) : 0;
  const sc = statusConfig[workout.status];

  const handleSetToggle = (exIdx: number, setIdx: number) => {
    setExerciseState(prev => {
      const next = prev.map((e, i) => i === exIdx
        ? { ...e, completedSets: e.completedSets.map((v, j) => j === setIdx ? !v : v) }
        : e
      );
      // Vibrate on mobile
      if (navigator.vibrate) navigator.vibrate(30);
      return next;
    });
  };

  const handleWeightChange = (exIdx: number, delta: number) => {
    setExerciseState(prev => prev.map((e, i) =>
      i === exIdx ? { ...e, weight: Math.max(0, +(e.weight + delta).toFixed(1)) } : e
    ));
  };

  // Merge state into sets for display
  const setsWithState = workout.sets.map((s: any, i: number) => ({
    ...s,
    originalIndex: i,
    completedSets: exerciseState[i]?.completedSets ?? [],
    weight: exerciseState[i]?.weight ?? s.weight,
    exercise: exerciseState[i]?.nameStr ?? s.exercise,
    type: exerciseState[i]?.typeStr ?? "Bilateral",
    durationMinutes: exerciseState[i]?.duration ?? 5,
  })).filter((s:any) => exerciseState[s.originalIndex] !== null);

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
          style={{ padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
        >
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(124,252,0,0.1)", border: "1px solid rgba(124,252,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Dumbbell size={20} color="#7CFC00" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>{workout.title}</span>
              {workout.coachAssigned && isPrivate && (
                <span style={{ fontSize: 10, color: "#7CFC00", background: "rgba(124,252,0,0.1)", border: "1px solid rgba(124,252,0,0.2)", borderRadius: 6, padding: "2px 6px", display: "flex", alignItems: "center", gap: 3 }}>
                  <Crown size={8} /> Coach
                </span>
              )}
              <span style={{ fontSize: 10, background: `${difficultyColor[workout.difficulty]}20`, color: difficultyColor[workout.difficulty], borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                {workout.difficulty}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#8B8B8B", fontSize: 12 }}>
                <Clock size={11} /> {workout.duration}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#8B8B8B", fontSize: 12 }}>
                <Flame size={11} color="#F59E0B" /> {workout.calories} kcal
              </div>
            </div>
          </div>
          {/* Completion ring */}
          <div style={{ position: "relative", width: 42, height: 42, flexShrink: 0 }}>
            {(() => {
              const r2 = 17, circ2 = 2 * Math.PI * r2;
              const offset2 = circ2 - (completionPct / 100) * circ2;
              return (
                <svg width={42} height={42} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={21} cy={21} r={r2} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
                  <circle cx={21} cy={21} r={r2} fill="none" stroke="#7CFC00" strokeWidth={4}
                    strokeDasharray={circ2} strokeDashoffset={offset2} strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.5s ease" }} />
                </svg>
              );
            })()}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#FFFFFF" }}>
              {completionPct}%
            </div>
          </div>
          {expanded ? <ChevronUp size={16} color="#8B8B8B" /> : <ChevronDown size={16} color="#8B8B8B" />}
        </div>

        {/* Full-width resume button for in-progress */}
        {workout.status === "in-progress" && !expanded && (
          <div style={{ padding: "0 20px 16px" }}>
            <button
              onClick={() => setExpanded(true)}
              style={{
                width: "100%", height: 48, borderRadius: 12,
                background: "linear-gradient(135deg, #7CFC00, #39FF14)",
                border: "none", color: "#000", fontWeight: 800,
                fontSize: 14, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", gap: 8,
                letterSpacing: "0.5px",
              }}
            >
              <Play size={16} fill="#000" /> RESUME WORKOUT
            </button>
          </div>
        )}

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ padding: "0 16px 16px" }}>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }} />

                {/* Progress bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8B8B8B", marginBottom: 6 }}>
                    <span>{completedTotal} of {totalSets} sets completed</span>
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

                {/* Exercise cards using the new table format component */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {setsWithState.map((ex: any, i: number) => {
                    const origIdx = ex.originalIndex;
                    const exerciseData = {
                      id: ex.exercise + origIdx,
                      name: ex.exercise,
                      durationMinutes: ex.durationMinutes,
                      type: ex.type,
                      sets: Array.from({ length: ex.sets }).map((_, si) => ({
                        id: si + 1,
                        previous: `${ex.reps} x ${ex.weight}${ex.unit}`,
                        reps: parseInt(ex.reps) || 0,
                        kg: ex.weight,
                        completed: ex.completedSets[si] || false
                      }))
                    };
                    
                    return (
                      <WorkoutExerciseCard
                        key={origIdx}
                        exercise={exerciseData}
                        onMenuAction={(action) => {
                          if (action === "edit") {
                            setEditingExercise({ index: origIdx, data: exerciseData });
                          } else if (action === "remove") {
                            if (confirm("Remove this exercise from your workout?")) {
                              setExerciseState(prev => {
                                const next = [...prev];
                                next[origIdx] = null as any; // filter out nulls in setsWithState
                                return next;
                              });
                            }
                          }
                        }}
                        onChange={(updated) => {
                          // Allow internal unmanaged state to update the global card state if necessary
                          updated.sets.forEach((set, setIdx) => {
                             if (set.completed !== ex.completedSets[setIdx]) {
                               handleSetToggle(origIdx, setIdx);
                             }
                          });
                        }}
                      />
                    );
                  })}
                </div>

                {/* Exercise Edit Modal inside WorkoutCard */}
                <AnimatePresence>
                  {editingExercise && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
                      onClick={(e) => { e.stopPropagation(); setEditingExercise(null); }}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={e => e.stopPropagation()}
                        style={{ background: "#1A1A1F", border: "1px solid rgba(124,252,0,0.3)", borderRadius: "20px", padding: 24, width: "100%", maxWidth: 400 }}
                      >
                        <h3 style={{ color: "#FFF", marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Edit Exercise</h3>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          setExerciseState(prev => {
                            const next = [...prev];
                            if(next[editingExercise.index]) {
                              next[editingExercise.index] = {
                                ...next[editingExercise.index],
                                nameStr: formData.get("name") as string,
                                typeStr: formData.get("type") as string,
                                duration: parseInt(formData.get("duration") as string),
                              };
                            }
                            return next;
                          });
                          setEditingExercise(null);
                        }}>
                          <div style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", color: "#8B8B8B", fontSize: 13, marginBottom: 4 }}>Exercise Name</label>
                            <input name="name" defaultValue={editingExercise.data.name} required style={{ width: "100%", padding: "10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }} />
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", color: "#8B8B8B", fontSize: 13, marginBottom: 4 }}>Type (e.g. Bilateral)</label>
                            <input name="type" defaultValue={editingExercise.data.type} style={{ width: "100%", padding: "10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }} />
                          </div>
                          <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", color: "#8B8B8B", fontSize: 13, marginBottom: 4 }}>Duration (mins)</label>
                            <input name="duration" type="number" defaultValue={editingExercise.data.durationMinutes} style={{ width: "100%", padding: "10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF" }} />
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" onClick={() => setEditingExercise(null)} style={{ flex: 1, padding: 10, background: "rgba(255,255,255,0.05)", color: "#FFF", border: "none", borderRadius: 8 }}>Cancel</button>
                            <button type="submit" style={{ flex: 1, padding: 10, background: "#7CFC00", color: "#000", fontWeight: 700, border: "none", borderRadius: 8 }}>Save Update</button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Action row */}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={onEdit} style={{ flex: 1, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#8B8B8B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13 }}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={onDelete} style={{ flex: 1, height: 40, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13 }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
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
  
  const [isWeeklyPlanModalOpen, setIsWeeklyPlanModalOpen] = useState(false);
  const [localWeekPlan, setLocalWeekPlan] = useState(WEEK_PLAN);

  const [localTasks, setLocalTasks] = useState([
    { id: 1, title: "Complete leg day workout", completed: true, priority: "high" },
    { id: 2, title: "Log daily calories", completed: false, priority: "medium" },
    { id: 3, title: "Update body measurements", completed: false, priority: "low" },
    { id: 4, title: "Review coach feedback", completed: true, priority: "high" },
  ]);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);

  const displayWorkouts = dbWorkouts && dbWorkouts.length > 0 ? dbWorkouts : WORKOUTS;
  const todayPlan = localWeekPlan[TODAY_IDX % localWeekPlan.length];
  const streak = 5;

  return (
    <div className="flex flex-col gap-5 md:gap-8 px-0 md:px-0">

      {/* Floating rest timer (FAB on mobile, inline on desktop) */}
      <FloatingRestTimer />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Dumbbell size={24} color="#7CFC00" />
          <span style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>Your Workouts</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "8px 12px" }}>
          <Zap size={14} color="#F59E0B" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B" }}>{streak}-Day Streak</span>
        </div>
      </div>

      {/* Weekly strip */}
      <div style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#8B8B8B", textTransform: "uppercase", letterSpacing: "0.8px" }}>This Week</div>
          <button 
            onClick={() => setIsWeeklyPlanModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 4, color: "#8B8B8B", fontSize: 11, fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", transition: "color 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.color = "#7CFC00"}
            onMouseOut={(e) => e.currentTarget.style.color = "#8B8B8B"}
          >
            <Edit3 size={12} /> Edit Plan
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {localWeekPlan.map((day, i) => {
            const isToday = i === TODAY_IDX % localWeekPlan.length;
            return (
              <div key={day.day} className="flex-shrink-0 w-[50px] flex flex-col items-center gap-2">
                <div style={{ fontSize: 11, color: isToday ? "#7CFC00" : "#5A5A5A", fontWeight: isToday ? 700 : 400 }}>{day.day}</div>
                <div style={{
                  width: "100%", padding: "10px 0", borderRadius: 10,
                  background: isToday ? "rgba(124,252,0,0.1)" : "rgba(255,255,255,0.03)",
                  border: isToday ? "1px solid rgba(124,252,0,0.3)" : "1px solid rgba(255,255,255,0.04)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative",
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: day.done ? "#7CFC00" : "rgba(255,255,255,0.15)" }} />
                  <span style={{ fontSize: 9, color: isToday ? "#7CFC00" : "#5A5A5A", textAlign: "center" }}>{day.label}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <Target size={12} color="#7CFC00" />
          <span style={{ fontSize: 12, color: "#8B8B8B" }}>Today: <span style={{ color: "#FFFFFF", fontWeight: 600 }}>{todayPlan.label}</span></span>
        </div>
      </div>

      {/* Workout cards (Assigned Workouts) moved up here */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#8B8B8B", textTransform: "uppercase", letterSpacing: "0.8px" }}>Assigned Workouts</div>
          <button
            onClick={() => { setEditingWorkout(null); setIsModalOpen(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#7CFC00", border: "none", borderRadius: 10, padding: "8px 14px", color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700, minHeight: 40 }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {displayWorkouts.map((w: any, i: number) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              isPrivate={isPrivate}
              delay={i}
              onEdit={() => { setEditingWorkout(w); setIsModalOpen(true); }}
              onDelete={() => { if (confirm("Delete workout?")) deleteWorkoutMutation.mutate({ id: w.id }); }}
            />
          ))}
        </div>
      </motion.div>

      {/* Current Tasks Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: "#16161A",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: 24
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Target size={20} color="#7CFC00" />
            <span style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF" }}>Current Tasks</span>
            <span style={{ fontSize: 14, color: "#8B8B8B" }}>
              Done 50%
            </span>
          </div>
          <button 
            onClick={() => setIsTasksModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 4, color: "#8B8B8B", fontSize: 12, fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", transition: "color 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.color = "#7CFC00"}
            onMouseOut={(e) => e.currentTarget.style.color = "#8B8B8B"}
          >
            <Edit3 size={14} /> Edit
          </button>
        </div>

        {/* Task Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {["all", "pending", "completed"].map((filter) => (
            <button
              key={filter}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.05)",
                color: "#8B8B8B",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize"
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        {localTasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 + 0.3 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              borderBottom: i < localTasks.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none"
            }}
          >
            <button
              onClick={() => {
                setLocalTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
              }}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                border: `2px solid ${task.completed ? "#7CFC00" : "rgba(255,255,255,0.2)"}`,
                background: task.completed ? "#7CFC00" : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {task.completed && <CheckCircle2 size={12} color="#000" />}
            </button>
            <span style={{
              flex: 1,
              fontSize: 14,
              color: task.completed ? "#8B8B8B" : "#FFFFFF",
              textDecoration: task.completed ? "line-through" : "none"
            }}>
              {task.title}
            </span>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: task.priority === "high" ? "#EF4444" : task.priority === "medium" ? "#F59E0B" : "#7CFC00"
            }} />
          </motion.div>
        ))}

        <button
          onClick={() => setIsTasksModalOpen(true)}
          style={{
            width: "100%",
            marginTop: 16,
            height: 40,
            borderRadius: 10,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#8B8B8B",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 14
          }}
        >
          <Edit3 size={16} /> Manage Tasks
        </button>
      </motion.div>

      {/* Removed old workout cards duplicate block from here */}

      {/* Workout Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            onClick={() => setIsModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#1A1A1F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px 20px 0 0", padding: 28, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto" }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />
              <h2 style={{ color: "#FFF", marginBottom: 20, fontSize: 18, fontWeight: 700 }}>{editingWorkout ? "Edit Workout" : "Add Workout"}</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  title: formData.get("title") as string,
                  duration: formData.get("duration") as string,
                  calories: parseInt(formData.get("calories") as string),
                  status: "todo", difficulty: "Medium",
                  muscles: ["Unknown"],
                  sets: [{ exercise: "Sample Exercise", sets: 3, reps: "10", weight: 20, unit: "kg", done: false }],
                };
                if (editingWorkout) {
                  updateWorkoutMutation.mutate({ id: editingWorkout.id, data }, { onSuccess: () => setIsModalOpen(false), onError: () => alert("Cannot save.") });
                } else {
                  createWorkoutMutation.mutate({ member_id: memberId, ...data, coach_assigned: false }, { onSuccess: () => setIsModalOpen(false), onError: () => alert("Cannot save.") });
                }
              }}>
                {[
                  { name: "title", label: "Workout Title", type: "text", def: editingWorkout?.title || "" },
                  { name: "duration", label: "Duration", type: "text", def: editingWorkout?.duration || "45 min" },
                  { name: "calories", label: "Calories (kcal)", type: "number", def: editingWorkout?.calories || 300 },
                ].map(f => (
                  <div key={f.name} style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", color: "#8B8B8B", fontSize: 13, marginBottom: 8 }}>{f.label}</label>
                    <input name={f.name} type={f.type} defaultValue={f.def} required style={{ width: "100%", padding: "13px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: 15, fontFamily: "Inter, sans-serif", minHeight: 48 }} />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 14, background: "rgba(255,255,255,0.05)", color: "#FFF", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 15, minHeight: 52 }}>Cancel</button>
                  <button type="submit" disabled={createWorkoutMutation.isPending || updateWorkoutMutation.isPending} style={{ flex: 1, padding: 14, background: "#7CFC00", color: "#000", fontWeight: 700, border: "none", borderRadius: 12, cursor: "pointer", fontSize: 15, minHeight: 52 }}>Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Weekly Plan Editor Modal */}
      <AnimatePresence>
        {isWeeklyPlanModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setIsWeeklyPlanModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#1A1A1F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: 24, width: "100%", maxWidth: 400, maxHeight: "90vh", overflowY: "auto" }}
            >
              <h3 style={{ color: "#FFF", marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Edit Weekly Plan</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newPlan = localWeekPlan.map((day) => ({
                  ...day,
                  label: formData.get(`label-${day.day}`) as string,
                  done: formData.get(`done-${day.day}`) === "on",
                }));
                // Set the local color logic
                newPlan.forEach(d => {
                  if (d.label?.toLowerCase().includes("rest")) d.color = "#5A5A5A";
                  else if (d.label?.toLowerCase().includes("leg")) d.color = "#7CFC00";
                  else if (d.label?.toLowerCase().includes("pull") || d.label?.toLowerCase().includes("upper")) d.color = "#8B5CF6";
                  else d.color = "#F59E0B";
                });
                setLocalWeekPlan(newPlan);
                setIsWeeklyPlanModalOpen(false);
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                  {localWeekPlan.map(day => (
                    <div key={day.day} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ width: 40, fontSize: 13, fontWeight: 700, color: day.color }}>{day.day}</div>
                      <input name={`label-${day.day}`} defaultValue={day.label} style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: 13 }} />
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "#8B8B8B", fontSize: 12 }}>
                        Done
                        <input type="checkbox" name={`done-${day.day}`} defaultChecked={day.done} style={{ width: 16, height: 16, accentColor: "#7CFC00" }} />
                      </label>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setIsWeeklyPlanModalOpen(false)} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", color: "#FFF", border: "none", borderRadius: "12px" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", background: "#7CFC00", color: "#000", fontWeight: 700, border: "none", borderRadius: "12px" }}>Save Plan</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tasks Editor Modal */}
      <AnimatePresence>
        {isTasksModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setIsTasksModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#1A1A1F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: 24, width: "100%", maxWidth: 450, maxHeight: "90vh", overflowY: "auto" }}
            >
              <h3 style={{ color: "#FFF", marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Edit Tasks</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updatedTasks = localTasks.map(t => ({
                  ...t,
                  title: formData.get(`task-${t.id}-title`) as string,
                  priority: formData.get(`task-${t.id}-pri`) as string,
                }));
                // Filter out any explicitly deleted from a state action if needed
                // Or just save edits:
                setLocalTasks(updatedTasks);
                setIsTasksModalOpen(false);
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                  {localTasks.map(task => (
                    <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <button type="button" onClick={() => setLocalTasks(prev => prev.filter(p => p.id !== task.id))} style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <Trash2 size={16} />
                      </button>
                      <input name={`task-${task.id}-title`} defaultValue={task.title} style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: 13 }} />
                      <select name={`task-${task.id}-pri`} defaultValue={task.priority} style={{ padding: "8px", borderRadius: "6px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: 12 }}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  ))}
                </div>
                
                <button type="button" onClick={() => {
                  setLocalTasks(prev => [...prev, { id: Date.now(), title: "New Task", completed: false, priority: "medium" }]);
                }} style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: "12px", color: "#8B8B8B", fontSize: 13, marginBottom: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Plus size={16} /> Add Task
                </button>

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setIsTasksModalOpen(false)} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", color: "#FFF", border: "none", borderRadius: "12px", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: "12px", background: "#7CFC00", color: "#000", fontWeight: 700, border: "none", borderRadius: "12px", cursor: "pointer" }}>Save Tasks</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
