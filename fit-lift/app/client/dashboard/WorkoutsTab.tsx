"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dumbbell, Crown, Play, CheckCircle2, Clock, ChevronDown,
  ChevronUp, Flame, Target, RotateCcw, Plus, Minus, Timer,
  Trophy, Zap, Edit3, Trash2, Mic, MicOff, X, Pause,
} from "lucide-react";
import { useListWorkouts, useCreateWorkout, useUpdateWorkout, useDeleteWorkout, useListTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/lib/api-hooks";

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

const DEFAULT_WEEK_PLAN = [
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
function ExerciseCard({ ex, idx, onUpdateExercise, onRemove }: {
  ex: any; idx: number; onUpdateExercise: (newEx: any) => void; onRemove?: () => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const sets = ex.setsDetails || [];
  
  const updateSet = (sIdx: number, updates: any) => {
     const newSets = [...sets];
     newSets[sIdx] = { ...newSets[sIdx], ...updates };
     onUpdateExercise({ ...ex, setsDetails: newSets });
  };
  
  const addSet = () => {
     const prev = sets.length > 0 ? sets[sets.length - 1] : { weight: 0, reps: 0, done: false };
     onUpdateExercise({ ...ex, setsDetails: [...sets, { weight: prev.weight, reps: prev.reps, done: false }] });
     if (navigator.vibrate) navigator.vibrate(20);
  };

  const removeSet = (sIdx: number) => {
     const newSets = sets.filter((_: any, i: number) => i !== sIdx);
     onUpdateExercise({ ...ex, setsDetails: newSets });
  };

  return (
    <div style={{ background: "#16161A", borderRadius: 14, padding: 16, marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
         <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, marginRight: 12 }}>
           {isEditingTitle ? (
              <input 
                 autoFocus
                 type="text" 
                 value={ex.exercise} 
                 onChange={(e) => onUpdateExercise({ ...ex, exercise: e.target.value })}
                 onBlur={() => setIsEditingTitle(false)}
                 onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                 style={{ fontSize: 16, fontWeight: 700, color: "#4DA8DA", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(77,168,218,0.5)", borderRadius: 6, padding: "4px 8px", outline: "none", width: "100%" }} 
              />
           ) : (
              <span style={{ fontSize: 16, fontWeight: 700, color: "#4DA8DA", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                 {ex.exercise}
              </span>
           )}
           <button 
              onClick={() => setIsEditingTitle(!isEditingTitle)} 
              style={{ background: isEditingTitle ? "#7CFC00" : "rgba(255,255,255,0.05)", border: "none", color: isEditingTitle ? "#000" : "#8B8B8B", borderRadius: 6, padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}
           >
              {isEditingTitle ? <CheckCircle2 size={14} /> : <Edit3 size={14} />}
              {isEditingTitle ? "Save" : "Edit"}
           </button>
         </div>
         <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#4DA8DA", background: "rgba(77,168,218,0.1)", padding: "4px 8px", borderRadius: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
               🎯 {sets.length > 0 ? sets[0].weight : 0} {ex.unit || 'kg'}
            </span>
            <button onClick={onRemove} style={{ color: "#EF4444", background: "rgba(239,68,68,0.1)", borderRadius: 6, padding: 6, border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
               <Trash2 size={16} />
            </button>
         </div>
      </div>
      
      {/* Table Header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.5fr 1.5fr 1fr 24px", gap: 8, fontSize: 12, color: "#8B8B8B", fontWeight: 600, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
         <div style={{ textAlign: "center" }}>Set</div>
         <div>Previous</div>
         <div style={{ textAlign: "center" }}>kg</div>
         <div style={{ textAlign: "center" }}>Rep</div>
         <div style={{ textAlign: "center" }}><CheckCircle2 size={14} style={{ margin: "0 auto" }}/></div>
         <div />
      </div>
      
      {/* Rows */}
      {sets.map((s: any, sIdx: number) => (
         <div key={sIdx} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.5fr 1.5fr 1fr 24px", gap: 8, alignItems: "center", fontSize: 14, color: "#FFF", marginBottom: 8, background: s.done ? "rgba(124,252,0,0.1)" : "transparent", borderRadius: 8, padding: "8px 0" }}>
           <div style={{ textAlign: "center", fontWeight: 700 }}>{sIdx + 1}</div>
           <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No Previous</div>
           
           <div style={{ textAlign: "center", display: "flex", justifyContent: "center" }}>
              <input type="number" value={s.weight} onChange={(e) => updateSet(sIdx, { weight: parseFloat(e.target.value)||0 })} style={{ width: 44, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "4px 0", color: "#FFF", fontWeight: 700, textAlign: "center", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }} />
           </div>
           
           <div style={{ textAlign: "center", display: "flex", justifyContent: "center" }}>
              <input type="number" value={s.reps} onChange={(e) => updateSet(sIdx, { reps: parseInt(e.target.value)||0 })} style={{ width: 44, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "4px 0", color: "#FFF", fontWeight: 700, textAlign: "center", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }} />
           </div>
           
           <div style={{ display: "flex", justifyContent: "center" }}>
              <button 
                onClick={() => {
                  updateSet(sIdx, { done: !s.done });
                  if (!s.done && navigator.vibrate) navigator.vibrate(30);
                }} 
                style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: s.done ? "#7CFC00" : "rgba(255,255,255,0.05)", cursor: "pointer", border: s.done ? "none" : "1px solid rgba(255,255,255,0.1)" }}>
                 <CheckCircle2 size={16} color={s.done ? "#000" : "#8B8B8B"} />
              </button>
           </div>
           
           <div style={{ display: "flex", justifyContent: "center" }}>
              <button 
                onClick={() => removeSet(sIdx)} 
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", padding: 4 }}>
                 <X size={14} />
              </button>
           </div>
         </div>
      ))}
      
      <button onClick={addSet} style={{ width: "100%", padding: 12, marginTop: 8, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 10, color: "#FFF", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
         <Plus size={14} /> Add a Set
      </button>
    </div>
  );
}

// ─── Workout Card ─────────────────────────────────────────────────────────────
function WorkoutCard({ workout, isPrivate, delay, onEdit, onDelete, updateWorkoutMutation }: {
  workout: any; isPrivate: boolean; delay: number; onEdit?: () => void; onDelete?: () => void; updateWorkoutMutation: any;
}) {
  const [expanded, setExpanded] = useState(workout.status === "in-progress");

  // Format the existing sets into the new detailed structure
  const [detailedExercises, setDetailedExercises] = useState<any[]>(() => {
    return (workout.sets || []).map((ex: any) => {
      if (ex.setsDetails) return ex;
      return {
        ...ex,
        setsDetails: Array.from({ length: Number(ex.sets) || 1 }, () => ({
          weight: parseFloat(ex.weight) || 0,
          reps: parseInt(ex.reps) || 0,
          done: false
        }))
      };
    });
  });

  const updateExercise = (eIdx: number, newEx: any) => {
     const next = [...detailedExercises];
     next[eIdx] = newEx;
     setDetailedExercises(next);
  };

  const removeExercise = (eIdx: number) => {
     setDetailedExercises(prev => prev.filter((_, i) => i !== eIdx));
  };

  const totalSets = detailedExercises.reduce((a: number, ex: any) => a + (ex.setsDetails?.length || 0), 0);
  const completedTotal = detailedExercises.reduce((a: number, ex: any) => a + (ex.setsDetails?.filter((s:any) => s.done).length || 0), 0);
  const completionPct = totalSets > 0 ? Math.round((completedTotal / totalSets) * 100) : 0;
  
  const finishSession = () => {
     if (workout.id) {
       updateWorkoutMutation.mutate({ 
          id: workout.id, 
          data: { sets: detailedExercises, status: completionPct === 100 ? "done" : workout.status }
       });
     }
     setExpanded(false);
  };

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
             <svg width={42} height={42} style={{ transform: "rotate(-90deg)" }}>
               <circle cx={21} cy={21} r={17} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
               <circle cx={21} cy={21} r={17} fill="none" stroke="#7CFC00" strokeWidth={4}
                 strokeDasharray={2 * Math.PI * 17} strokeDashoffset={(2 * Math.PI * 17) - (completionPct / 100) * (2 * Math.PI * 17)} strokeLinecap="round"
                 style={{ transition: "stroke-dashoffset 0.5s ease" }} />
             </svg>
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

                {/* Exercise cards */}
                {detailedExercises.map((ex: any, i: number) => (
                  <ExerciseCard
                    key={i}
                    ex={ex}
                    idx={i}
                    onUpdateExercise={(newEx) => updateExercise(i, newEx)}
                    onRemove={() => removeExercise(i)}
                  />
                ))}

                <button onClick={() => setDetailedExercises([...detailedExercises, { exercise: "New Exercise", unit: "kg", setsDetails: [{ weight: 0, reps: 0, done: false }] }])} style={{ width: "100%", padding: 12, marginBottom: 16, background: "transparent", border: "1px dashed rgba(124,252,0,0.4)", borderRadius: 10, color: "#7CFC00", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                   <Plus size={16} color="#7CFC00"/> Add Exercise
                </button>

                {/* Action row */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={onEdit} style={{ flex: 1, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#8B8B8B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 14, fontWeight: 600 }}>
                    <Edit3 size={16} /> Edit Info
                  </button>
                  <button onClick={finishSession} style={{ flex: 1, height: 44, borderRadius: 10, background: "#4DA8DA", border: "none", color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 14, fontWeight: 700 }}>
                    <CheckCircle2 size={16} /> Finish Saving
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

  const { data: dbTasks } = useListTasks(memberId);
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<any>(null);
  
  const [weekPlan, setWeekPlan] = useState(DEFAULT_WEEK_PLAN);
  const [isEditingWeek, setIsEditingWeek] = useState(false);
  
  const [taskFilter, setTaskFilter] = useState("all");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const displayWorkouts = dbWorkouts && dbWorkouts.length > 0 ? dbWorkouts : WORKOUTS;
  const todayPlan = weekPlan[TODAY_IDX % weekPlan.length];
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
            onClick={() => setIsEditingWeek(!isEditingWeek)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: isEditingWeek ? "#7CFC00" : "rgba(255,255,255,0.05)", color: isEditingWeek ? "#000" : "#8B8B8B", border: isEditingWeek ? "none" : "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          >
            {isEditingWeek ? <CheckCircle2 size={12}/> : <Edit3 size={12} />} {isEditingWeek ? "Save" : "Edit"}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {weekPlan.map((day, i) => {
            const isToday = i === TODAY_IDX % weekPlan.length;
            return (
              <div key={day.day} className="flex-shrink-0 w-[50px] flex flex-col items-center gap-2">
                <div style={{ fontSize: 11, color: isToday ? "#7CFC00" : "#5A5A5A", fontWeight: isToday ? 700 : 400 }}>{day.day}</div>
                <div style={{
                  width: "100%", padding: "10px 0", borderRadius: 10, minHeight: 46,
                  background: isToday ? "rgba(124,252,0,0.1)" : "rgba(255,255,255,0.03)",
                  border: isToday ? "1px solid rgba(124,252,0,0.3)" : "1px solid rgba(255,255,255,0.04)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, position: "relative",
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: day.done ? "#7CFC00" : "rgba(255,255,255,0.15)" }} />
                  {isEditingWeek ? (
                     <input 
                       autoFocus={i === 0}
                       value={day.label}
                       onChange={(e) => {
                          const next = [...weekPlan];
                          next[i] = { ...next[i], label: e.target.value };
                          setWeekPlan(next);
                       }}
                       style={{ width: "90%", fontSize: 9, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(124,252,0,0.3)", borderRadius: 4, textAlign: "center", outline: "none", color: "#FFF", padding: 2 }} 
                     />
                  ) : (
                     <span style={{ fontSize: 9, color: isToday ? "#7CFC00" : "#5A5A5A", textAlign: "center" }}>{day.label}</span>
                  )}
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

      {/* Workout cards */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#8B8B8B", textTransform: "uppercase", letterSpacing: "0.8px" }}>Assigned Workouts</div>
          <button
            onClick={() => { setEditingWorkout(null); setIsModalOpen(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#7CFC00", border: "none", borderRadius: 10, padding: "8px 14px", color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700, minHeight: 40 }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {displayWorkouts.map((w: any, i: number) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            isPrivate={isPrivate}
            delay={i}
            updateWorkoutMutation={updateWorkoutMutation}
            onEdit={() => { setEditingWorkout(w); setIsModalOpen(true); }}
            onDelete={() => { if (confirm("Delete workout?")) deleteWorkoutMutation.mutate({ id: w.id }); }}
          />
        ))}
      </div>

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
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Target size={20} color="#7CFC00" />
          <span style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF" }}>Current Tasks</span>
          <span style={{ fontSize: 14, color: "#8B8B8B" }}>
            Done {dbTasks?.length ? Math.round((dbTasks.filter((t:any) => t.status === "completed").length / dbTasks.length) * 100) : 0}%
          </span>
        </div>

        {/* Task Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {["all", "pending", "completed"].map((filter) => (
            <button
              key={filter}
              onClick={() => setTaskFilter(filter)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: `1px solid ${taskFilter === filter ? "#7CFC00" : "rgba(255,255,255,0.08)"}`,
                background: taskFilter === filter ? "rgba(124,252,0,0.1)" : "rgba(255,255,255,0.05)",
                color: taskFilter === filter ? "#7CFC00" : "#8B8B8B",
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

        {/* Dynamic Tasks */}
        {(dbTasks || []).filter((t: any) => 
           taskFilter === "all" ? true : taskFilter === "pending" ? t.status !== "completed" : t.status === "completed"
        ).map((task: any, i: number) => {
           const isEditingThis = editingTaskId === task.id;
           const isCompleted = task.status === "completed";
           return (
             <motion.div
               key={task.id}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.05 + 0.3 }}
               style={{
                 display: "flex",
                 alignItems: "center",
                 gap: 12,
                 padding: "16px 0",
                 borderBottom: "1px solid rgba(255,255,255,0.04)"
               }}
             >
               <button
                 onClick={() => {
                   updateTaskMutation.mutate({ id: task.id, data: { status: isCompleted ? "pending" : "completed" } });
                   if (!isCompleted && navigator.vibrate) navigator.vibrate(40);
                 }}
                 style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${isCompleted ? "#7CFC00" : "rgba(255,255,255,0.2)"}`, background: isCompleted ? "#7CFC00" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
               >
                 {isCompleted && <CheckCircle2 size={14} color="#000" />}
               </button>
               
               {isEditingThis ? (
                  <input autoFocus value={editingTaskTitle} onChange={e => setEditingTaskTitle(e.target.value)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid #7CFC00", color: "#FFF", padding: "6px 10px", borderRadius: 8, outline: "none", fontSize: 14 }} />
               ) : (
                  <span style={{ flex: 1, fontSize: 14, color: isCompleted ? "#8B8B8B" : "#FFFFFF", textDecoration: isCompleted ? "line-through" : "none" }}>
                    {task.title}
                  </span>
               )}
               
               <div style={{ display: "flex", gap: 8 }}>
                 {isEditingThis ? (
                    <>
                       <button onClick={() => { updateTaskMutation.mutate({ id: task.id, data: { title: editingTaskTitle } }); setEditingTaskId(null); }} style={{ background: "#7CFC00", border: "none", borderRadius: 6, padding: "4px 8px", color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Save</button>
                       <button onClick={() => setEditingTaskId(null)} style={{ background: "transparent", border: "1px solid #8B8B8B", borderRadius: 6, padding: "4px 8px", color: "#8B8B8B", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                    </>
                 ) : (
                    <>
                       <button onClick={() => { setEditingTaskId(task.id); setEditingTaskTitle(task.title); }} style={{ background: "transparent", border: "none", color: "#8B8B8B", cursor: "pointer" }}><Edit3 size={16} /></button>
                       <button onClick={() => { if(confirm("Remove this task?")) deleteTaskMutation.mutate({ id: task.id }); }} style={{ background: "transparent", border: "none", color: "#EF4444", cursor: "pointer" }}><Trash2 size={16} /></button>
                    </>
                 )}
               </div>
             </motion.div>
           );
        })}

        {isAddingTask ? (
           <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <input autoFocus value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Task description..." style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", padding: "10px 14px", borderRadius: 10, outline: "none", fontSize: 14 }} />
              <button 
                onClick={() => { 
                   if (newTaskTitle.trim()) {
                      createTaskMutation.mutate({ member_id: memberId, title: newTaskTitle, status: "pending", type: "todo" }, {
                         onSuccess: () => { setIsAddingTask(false); setNewTaskTitle(""); }
                      });
                   }
                }}
                disabled={createTaskMutation.isPending}
                style={{ background: "#7CFC00", border: "none", borderRadius: 10, padding: "0 16px", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >
                 Add
              </button>
           </div>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            style={{ width: "100%", marginTop: 16, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.1)", color: "#8B8B8B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 600 }}
          >
            <Plus size={16} /> Add New Task
          </button>
        )}
      </motion.div>



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
              <h2 style={{ color: "#FFF", marginBottom: 20, fontSize: 18, fontWeight: 700 }}>{editingWorkout ? "Edit Session Details" : "Create New Workout Session"}</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  title: formData.get("title") as string,
                  duration: formData.get("duration") as string,
                  calories: parseInt(formData.get("calories") as string),
                  status: "todo", difficulty: "Medium",
                  muscles: ["Unknown"],
                  sets: editingWorkout ? editingWorkout.sets : [],
                };
                if (editingWorkout) {
                  updateWorkoutMutation.mutate({ id: editingWorkout.id, data }, { onSuccess: () => setIsModalOpen(false) });
                } else {
                  createWorkoutMutation.mutate({ member_id: memberId, ...data, coach_assigned: false }, { onSuccess: () => setIsModalOpen(false) });
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
    </div>
  );
}
