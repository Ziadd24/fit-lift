"use client";
import React, { memo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SECONDARY_TEXT_COLOR, TOUCH_TARGET_SIZE, useAccessibleDialog } from "@/lib/accessibility";
import { LazyRenderSection, SkeletonBlock, useDashboardMotion } from "@/lib/performance";
import { getErrorMessage, showConfirmToast } from "@/lib/feedback";
import {
  Dumbbell, Crown, Play, CheckCircle2, Clock, ChevronDown,
  ChevronUp, Flame, Target, Plus, Edit3, Trash2, RotateCcw,
} from "lucide-react";
import { useListWorkouts, useCreateWorkout, useUpdateWorkout, useDeleteWorkout } from "@/lib/api-hooks";
import { WorkoutExerciseCard } from "@/components/ui/WorkoutExerciseCard";
import { toast } from "react-hot-toast";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface LocalTask {
  id: number;
  title: string;
  completed: boolean;
  priority: string;
}

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
  { day: "Mon", label: "Legs", done: false, color: "#7CFC00" },
  { day: "Tue", label: "Rest", done: false, color: "#5A5A5A" },
  { day: "Wed", label: "Upper", done: false, color: "#8B5CF6" },
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
  todo: { bg: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)", label: "To Do" },
  "in-progress": { bg: "rgba(139,92,246,0.2)", color: "#8B5CF6", label: "In Progress" },
  in_progress: { bg: "rgba(139,92,246,0.2)", color: "#8B5CF6", label: "In Progress" },
  done: { bg: "rgba(16,185,129,0.2)", color: "#10B981", label: "Done" },
  completed: { bg: "rgba(16,185,129,0.2)", color: "#10B981", label: "Done" },
  pending: { bg: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)", label: "To Do" },
};

function normalizeWorkoutStatus(status: unknown) {
  if (status === "in_progress") return "in-progress";
  if (status === "completed") return "done";
  if (status === "pending") return "todo";
  return typeof status === "string" && statusConfig[status] ? status : "todo";
}

function normalizeWorkoutSet(rawSet: any) {
  const totalSets =
    typeof rawSet?.sets === "number" && Number.isFinite(rawSet.sets) && rawSet.sets > 0
      ? rawSet.sets
      : 1;

  return {
    exercise: typeof rawSet?.exercise === "string" && rawSet.exercise.trim() ? rawSet.exercise : "Exercise",
    sets: totalSets,
    reps: rawSet?.reps != null ? String(rawSet.reps) : "10",
    weight: typeof rawSet?.weight === "number" && Number.isFinite(rawSet.weight) ? rawSet.weight : 0,
    unit: typeof rawSet?.unit === "string" && rawSet.unit.trim() ? rawSet.unit : "kg",
    done: Boolean(rawSet?.done),
  };
}

function normalizeWorkout(workout: any) {
  const safeSets = Array.isArray(workout?.sets) ? workout.sets.map(normalizeWorkoutSet) : [];

  return {
    ...workout,
    title: typeof workout?.title === "string" && workout.title.trim() ? workout.title : "Untitled Workout",
    status: normalizeWorkoutStatus(workout?.status),
    duration: typeof workout?.duration === "string" && workout.duration.trim() ? workout.duration : "45 min",
    calories: typeof workout?.calories === "number" && Number.isFinite(workout.calories) ? workout.calories : 0,
    difficulty:
      typeof workout?.difficulty === "string" && difficultyColor[workout.difficulty]
        ? workout.difficulty
        : "Medium",
    muscles: Array.isArray(workout?.muscles) ? workout.muscles.filter(Boolean) : [],
    sets: safeSets,
  };
}

function containsArabic(text: string) {
  return /[\u0600-\u06FF]/.test(text);
}

function containsLatin(text: string) {
  return /[A-Za-z]/.test(text);
}

function getPreferredLanguage() {
  if (typeof document !== "undefined") {
    const docLang = document.documentElement.lang?.trim().toLowerCase();
    if (docLang) return docLang;
  }
  if (typeof navigator !== "undefined") {
    return navigator.language?.toLowerCase() || "en";
  }
  return "en";
}

function isArabicLanguage(language: string) {
  return language.startsWith("ar");
}

function localizeWorkoutTitle(title: string, language: string, index: number) {
  const trimmed = title.trim();
  if (!trimmed) {
    return isArabicLanguage(language) ? `تمرين ${index}` : `Workout ${index}`;
  }

  if (isArabicLanguage(language)) {
    return trimmed;
  }

  if (!containsArabic(trimmed)) {
    return trimmed;
  }

  if (containsLatin(trimmed)) {
    const stripped = trimmed
      .replace(/[\u0600-\u06FF]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^[\-–—:]+|[\-–—:]+$/g, "")
      .trim();

    if (stripped) return stripped;
  }

  return `Workout ${index}`;
}

function getDefaultExercise(language: string, exerciseIndex: number) {
  const isArabic = isArabicLanguage(language);
  return {
    exercise: isArabic ? `تمرين ${exerciseIndex}` : `Exercise ${exerciseIndex}`,
    sets: 4,
    reps: "10",
    weight: 20,
    unit: "kg",
    done: false,
  };
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

type UndoEntry = {
  id: string;
  label: string;
  undo: () => void;
};

function WorkoutCardSkeleton() {
  return (
    <div style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <SkeletonBlock width={46} height={46} radius={999} />
        <div style={{ flex: 1 }}>
          <SkeletonBlock width="58%" height={18} />
          <SkeletonBlock width="38%" height={12} style={{ marginTop: 10 }} />
        </div>
        <SkeletonBlock width={42} height={42} radius={999} />
      </div>
      <div style={{ marginTop: 18 }}>
        <SkeletonBlock width="100%" height={10} radius={999} />
        <SkeletonBlock width="100%" height={74} style={{ marginTop: 14 }} />
        <SkeletonBlock width="100%" height={74} style={{ marginTop: 12 }} />
      </div>
    </div>
  );
}

function WorkoutsLoadingState() {
  return (
    <div className="flex flex-col gap-5 md:gap-8 px-0 md:px-0">
      <div style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
        <SkeletonBlock width={90} height={12} />
        <div className="flex gap-2 overflow-hidden" style={{ marginTop: 16 }}>
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} style={{ width: 50, flexShrink: 0 }}>
              <SkeletonBlock width="100%" height={12} />
              <SkeletonBlock width="100%" height={58} style={{ marginTop: 10 }} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SkeletonBlock width={140} height={12} />
          <SkeletonBlock width={76} height={40} radius={10} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <WorkoutCardSkeleton key={index} />
          ))}
        </div>
      </div>
      <div style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
        <SkeletonBlock width={180} height={18} />
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} width="100%" height={22} radius={10} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Workout Card ─────────────────────────────────────────────────────────────
const WorkoutCard = memo(function WorkoutCard({ workout, isPrivate, delay, onEdit, onDelete, onQueueUndo, onAddExercise, onExerciseChange, language, updateWorkoutMutation }: {
  workout: any; isPrivate: boolean; delay: number; onEdit?: () => void; onDelete?: () => void;
  onQueueUndo?: (entry: UndoEntry) => void;
  onAddExercise?: () => void;
  onExerciseChange?: (workout: any, exerciseIndex: number, updated: any) => void;
  language: string;
  updateWorkoutMutation?: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const safeWorkoutSets = Array.isArray(workout.sets) ? workout.sets : [];
  const editExerciseDialogRef = useRef<HTMLDivElement>(null);
  const { titleId: editExerciseTitleId, descriptionId: editExerciseDescriptionId } = useAccessibleDialog(
    Boolean(editingExercise),
    editExerciseDialogRef,
    () => setEditingExercise(null)
  );

  // Per-set completion state (array of booleans per exercise)
  // Persisted in localStorage so checks survive page refresh until Finish is pressed
  const setsStorageKey = `workoutSets_${workout.id}`;
  type ExerciseStateEntry = { completedSets: boolean[]; weight: number; nameStr: string; typeStr: string; duration: number };
  const [exerciseState, setExerciseState] = useState<ExerciseStateEntry[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(setsStorageKey);
        if (saved) {
          const parsed: ExerciseStateEntry[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === safeWorkoutSets.length) {
            return parsed;
          }
        }
      } catch {}
    }
    return safeWorkoutSets.map((s: any) => ({
      completedSets: Array(s.sets).fill(false),
      weight: s.weight ?? 0,
      nameStr: s.exercise,
      typeStr: s.unit === "—" ? "Bodyweight" : "Bilateral",
      duration: 5,
    }));
  });

  const exerciseStateRef = useRef(exerciseState);
  exerciseStateRef.current = exerciseState;

  // Persist set completion to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(setsStorageKey, JSON.stringify(exerciseState));
    } catch {}
  }, [exerciseState, setsStorageKey]);

  // Sync exerciseState when workout.sets changes (add/remove exercises OR set count changes)
  // Uses JSON serialization to detect actual content changes, not just reference changes
  const prevSetsJsonRef = useRef(JSON.stringify(safeWorkoutSets.map((s: any) => ({ exercise: s.exercise, sets: s.sets }))));

  useEffect(() => {
    const current = exerciseStateRef.current;
    const newLength = safeWorkoutSets.length;
    const newSetsSignature = JSON.stringify(safeWorkoutSets.map((s: any) => ({ exercise: s.exercise, sets: s.sets })));

    // Skip if the actual exercise structure hasn't changed (avoid wiping completion on refetch)
    if (newSetsSignature === prevSetsJsonRef.current) return;
    prevSetsJsonRef.current = newSetsSignature;
    
    if (newLength > current.length) {
      // Add new exercises with empty completion state
      const newExercises = safeWorkoutSets.slice(current.length).map((s: any) => ({
        completedSets: Array(typeof s.sets === 'number' ? s.sets : 1).fill(false),
        weight: s.weight ?? 0,
        nameStr: s.exercise,
        typeStr: s.unit === "—" ? "Bodyweight" : "Bilateral",
        duration: 5,
      }));
      setExerciseState(prev => [...prev, ...newExercises]);
    } else if (newLength < current.length) {
      // Remove exercises that no longer exist
      setExerciseState(prev => prev.slice(0, newLength));
    } else {
      // Same number of exercises — check if set counts changed per exercise
      const needsUpdate = safeWorkoutSets.some((s: any, idx: number) => {
        const expectedCount = typeof s.sets === 'number' ? s.sets : 1;
        return !current[idx] || current[idx].completedSets.length !== expectedCount;
      });
      if (needsUpdate) {
        setExerciseState(prev =>
          safeWorkoutSets.map((s: any, idx: number) => {
            const expectedCount = typeof s.sets === 'number' ? s.sets : 1;
            const prevEntry = prev[idx];
            if (!prevEntry) {
              return {
                completedSets: Array(expectedCount).fill(false),
                weight: s.weight ?? 0,
                nameStr: s.exercise,
                typeStr: s.unit === "—" ? "Bodyweight" : "Bilateral",
                duration: 5,
              };
            }
            const oldLen = prevEntry.completedSets.length;
            if (oldLen === expectedCount) return prevEntry;
            // Preserve existing completion state where possible
            const newCompleted = Array(expectedCount).fill(false);
            for (let i = 0; i < Math.min(oldLen, expectedCount); i++) {
              newCompleted[i] = prevEntry.completedSets[i];
            }
            return { ...prevEntry, completedSets: newCompleted };
          })
        );
      }
    }
  }, [safeWorkoutSets.length, safeWorkoutSets]);

  const totalSets = exerciseState.reduce((a, e) => a + (e ? e.completedSets.length : 0), 0);
  const completedTotal = exerciseState.reduce((a, e) => a + (e ? e.completedSets.filter(Boolean).length : 0), 0);
  const completionPct = totalSets > 0 ? Math.round((completedTotal / totalSets) * 100) : 0;
  const sc = statusConfig[workout.status] ?? statusConfig.todo;
  const { disableHeavyAnimations } = useDashboardMotion();
  const isMobile = useIsMobile();

  const queueUndo = (label: string, undo: () => void) => {
    onQueueUndo?.({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label,
      undo,
    });
  };

  const handleSetToggle = (exIdx: number, setIdx: number) => {
    setExerciseState(prev => {
      const entry = prev[exIdx];
      if (!entry || setIdx < 0 || setIdx >= entry.completedSets.length) return prev;
      const exerciseLabel = safeWorkoutSets[exIdx]?.exercise || `Exercise ${exIdx + 1}`;
      const nextValue = !entry.completedSets[setIdx];
      const next = prev.map((e, i) => i === exIdx
        ? { ...e, completedSets: e.completedSets.map((v, j) => j === setIdx ? !v : v) }
        : e
      );
      // Vibrate on mobile
      if (navigator.vibrate) navigator.vibrate(30);
      setLiveAnnouncement(`${exerciseLabel}, set ${setIdx + 1} ${nextValue ? "completed" : "marked incomplete"}.`);
      
      return next;
    });
  };

  const handleExerciseSetAction = ({ action, exerciseName, setId, previous, next, exerciseId, exerciseOrigIdx }: any) => {
    if (action === "complete" || action === "skip" || action === "toggle") {
      // Use the direct origIdx passed from the render - much more reliable
      // than parsing from the exerciseId string
      let targetOrigIdx = -1;
      if (typeof exerciseOrigIdx === 'number' && exerciseOrigIdx >= 0) {
        targetOrigIdx = exerciseOrigIdx;
      } else {
        // Fallback: try to match by exercise name + index combo
        if (typeof exerciseId === 'string') {
          const idx = safeWorkoutSets.findIndex((s: any) => (s.exercise + String(safeWorkoutSets.indexOf(s))) === exerciseId);
          if (idx >= 0) {
            targetOrigIdx = idx;
          }
        }
      }
      if (targetOrigIdx < 0) return;

      setExerciseState(prev => {
        const entry = prev[targetOrigIdx];
        if (!entry) return prev;
        const setIndex = setId - 1;
        if (setIndex < 0 || setIndex >= entry.completedSets.length) return prev;
        // For toggle: flip the value. For complete/skip: use the specific value from next.
        const newCompleted = action === "toggle"
          ? !entry.completedSets[setIndex]
          : next.completed;
        return prev.map((item, idx) =>
          idx === targetOrigIdx
            ? {
                ...item,
                completedSets: item.completedSets.map((value, si) =>
                  si === setIndex ? newCompleted : value
                ),
              }
            : item
        );
      });

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        if (action === "toggle") navigator.vibrate(30);
        else navigator.vibrate(action === "complete" ? [30, 20, 30] : [20, 20, 20]);
      }

      queueUndo(
        `${exerciseName} set ${setId} ${action === "complete" ? "completed" : action === "skip" ? "skipped" : "toggled"}`,
        () => {
          setExerciseState(prev => {
            const entry = prev[targetOrigIdx];
            if (!entry) return prev;
            const setIndex = setId - 1;
            if (setIndex < 0 || setIndex >= entry.completedSets.length) return prev;
            return prev.map((item, idx) =>
              idx === targetOrigIdx
                ? {
                    ...item,
                    completedSets: item.completedSets.map((value, si) =>
                      si === setIndex ? previous.completed : value
                    ),
                  }
                : item
            );
          });
          setLiveAnnouncement(`${exerciseName}, set ${setId} restored.`);
        }
      );

      const actionLabel = action === "toggle"
        ? (next.completed ? "completed" : "marked incomplete")
        : (action === "complete" ? "completed" : "skipped");
      setLiveAnnouncement(
        `${exerciseName}, set ${setId} ${actionLabel}.`
      );
    }
  };

  const handleExerciseMenuAction = (action: string, exerciseId: string, exerciseName: string, origIdx: number) => {
    if (action === "edit" || action === "replace") {
      setEditingExercise({ index: origIdx, data: { ...setsWithState.find((item: any) => item.originalIndex === origIdx), name: exerciseName } });
      return;
    }

    if (action === "skip") {
      // Mark all sets as completed (so it counts toward 100%) - session only, not saved to DB
      setExerciseState(prev => prev.map((item, idx) =>
        idx === origIdx
          ? { ...item, completedSets: item.completedSets.map(() => true) }
          : item
      ));
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([20, 20, 20]);
      setLiveAnnouncement(`${exerciseName} skipped.`);
      return;
    }

    if (action === "remove") {
      showConfirmToast({
        message: `Remove ${exerciseName} from this workout?`,
        confirmLabel: "Remove",
        onConfirm: () => {
          // Capture the current safeWorkoutSets snapshot at confirm time
          // to avoid race condition between local state and server refetch
          const currentWorkoutSets = Array.isArray(workout.sets) ? workout.sets : [];
          const currentSets = currentWorkoutSets.filter((_: any, idx: number) => idx !== origIdx);
          updateWorkoutMutation.mutate({
            id: workout.id,
            data: { sets: currentSets },
          });
          // Immediately update exerciseState AND prevSetsJsonRef in sync
          // to prevent index misalignment during the refetch window
          setExerciseState(prev => {
            const next = prev.filter((_: any, idx: number) => idx !== origIdx);
            // Update the ref to match the new state immediately
            // so the useEffect doesn't try to re-sync with stale indices
            exerciseStateRef.current = next;
            return next;
          });
          // Update the signature ref to match the post-removal state
          // This prevents the useEffect from firing with mismatched indices
          prevSetsJsonRef.current = JSON.stringify(currentSets.map((s: any) => ({ exercise: s.exercise, sets: s.sets })));
          toast.success(`${exerciseName} removed.`);
        },
      });
    }
  };

  useEffect(() => {
    if (completionPct === 100 && totalSets > 0) {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([120, 40, 120]);
      setLiveAnnouncement(`${workout.title} finished.`);
      toast.success(`${workout.title} complete.`);
    }
  }, [completionPct, totalSets, workout.title]);

  const handleWeightChange = (exIdx: number, delta: number) => {
    setExerciseState(prev => prev.map((e, i) =>
      i === exIdx ? { ...e, weight: Math.max(0, +(e.weight + delta).toFixed(1)) } : e
    ));
  };

    const handleFinishWorkout = () => {
    // Mark workout as completed in the database
    const completedSets = workout.sets.map((s: any) => ({ ...s, done: true }));
    onExerciseChange?.(workout, 0, { 
      ...workout, 
      status: "done",
      sets: completedSets 
    });
    // Reset exercise completion state for next session
    setExerciseState(prev => prev.map(e => e ? { ...e, completedSets: e.completedSets.map(() => false) } : e));
    // Clear persisted set state so checks don't survive after finishing
    try { localStorage.removeItem(setsStorageKey); } catch {}
    // Close/collapse the workout after finishing
    setExpanded(false);
    toast.success(`${workout.title} finished! Great work!`);
  };

  // Merge state into sets for display
  // Build a name-based lookup to handle cases where exerciseState and safeWorkoutSets
  // have different lengths (e.g., during a remove operation before DB refetch)
  const exerciseStateByName = new Map<string, typeof exerciseState[0]>();
  exerciseState.forEach((entry, idx) => {
    if (entry) {
      // Use the DB exercise name as key for matching
      const dbExercise = safeWorkoutSets[idx]?.exercise;
      if (dbExercise) exerciseStateByName.set(dbExercise, entry);
    }
  });

  const setsWithState = safeWorkoutSets.map((s: any, i: number) => {
    // First try index-based lookup (normal case)
    const byIndex = exerciseState[i];
    // Then try name-based lookup (handles index misalignment after removal)
    const byName = exerciseStateByName.get(s.exercise);
    const matched = byIndex || byName;
    return {
      ...s,
      originalIndex: i,
      completedSets: matched?.completedSets ?? [],
      weight: matched?.weight ?? s.weight,
      exercise: matched?.nameStr ?? s.exercise,
      type: matched?.typeStr ?? "Bilateral",
      durationMinutes: matched?.duration ?? 5,
    };
  }).filter((s: any) => {
    const state = exerciseState[s.originalIndex];
    return state !== undefined && state !== null;
  });

  // Keep a ref to the latest setsWithState for use in callbacks (avoids stale closures)
  const setsWithStateRef = useRef(setsWithState);
  setsWithStateRef.current = setsWithState;

  return (
    <motion.div
      initial={disableHeavyAnimations ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: disableHeavyAnimations ? 0 : delay * 0.07, duration: disableHeavyAnimations ? 0 : 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{ marginBottom: 16 }}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">{liveAnnouncement}</div>
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
          style={{ padding: isMobile ? "14px 16px" : "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: isMobile ? 10 : 14 }}
        >
          <div style={{ width: isMobile ? 40 : 46, height: isMobile ? 40 : 46, borderRadius: "50%", background: "rgba(124,252,0,0.1)", border: "1px solid rgba(124,252,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Dumbbell size={isMobile ? 18 : 20} color="#7CFC00" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
              <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: "#FFFFFF" }}>{workout.title}</span>
              {workout.coachAssigned && isPrivate && (
                <span style={{ fontSize: 10, color: "#7CFC00", background: "rgba(124,252,0,0.1)", border: "1px solid rgba(124,252,0,0.2)", borderRadius: 6, padding: "2px 6px", display: "flex", alignItems: "center", gap: 3 }}>
                  <Crown size={8} /> Coach
                </span>
              )}
              <span style={{ fontSize: 10, background: `${difficultyColor[workout.difficulty]}20`, color: difficultyColor[workout.difficulty], borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                {workout.difficulty}
              </span>
            </div>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: SECONDARY_TEXT_COLOR, fontSize: isMobile ? 11 : 12 }}>
                <Flame size={11} color="#F59E0B" /> {workout.calories} kcal
              </div>
            </div>
          </div>
          {/* Completion ring */}
          <div style={{ position: "relative", width: isMobile ? 44 : 46, height: isMobile ? 44 : 46, flexShrink: 0 }}>
            {(() => {
              const r2 = isMobile ? 17 : 18, circ2 = 2 * Math.PI * r2;
              const offset2 = circ2 - (completionPct / 100) * circ2;
              const center = isMobile ? 22 : 23;
              return (
                <svg width={isMobile ? 44 : 46} height={isMobile ? 44 : 46} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={center} cy={center} r={r2} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
                  <circle cx={center} cy={center} r={r2} fill="none" stroke="#7CFC00" strokeWidth={4}
                    strokeDasharray={circ2} strokeDashoffset={offset2} strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.5s ease" }} />
                </svg>
              );
            })()}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 10 : 10, fontWeight: 800, color: "#FFFFFF" }}>
              {completionPct}%
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleFinishWorkout(); }}
            disabled={completionPct < 100}
            style={{
              marginLeft: 8,
              padding: "6px 12px",
              background: completionPct >= 100 ? "#7CFC00" : "rgba(124,252,0,0.3)",
              color: completionPct >= 100 ? "#000" : "rgba(0,0,0,0.5)",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: completionPct >= 100 ? "pointer" : "not-allowed",
              flexShrink: 0,
              opacity: completionPct >= 100 ? 1 : 0.6,
            }}
          >
            Finish
          </button>
          {expanded ? <ChevronUp size={16} color={SECONDARY_TEXT_COLOR} /> : <ChevronDown size={16} color={SECONDARY_TEXT_COLOR} />}
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={disableHeavyAnimations ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: disableHeavyAnimations ? 0 : 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ padding: `0 ${isMobile ? 12 : 16}px ${isMobile ? 12 : 16}px` }}>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }} />

                {/* Progress bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: SECONDARY_TEXT_COLOR, marginBottom: 6 }}>
                    <span>{completedTotal} of {totalSets} sets completed</span>
                    <span style={{ color: "#7CFC00", fontWeight: 600 }}>{completionPct}%</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <motion.div
                      animate={{ width: `${completionPct}%` }}
                      transition={{ duration: disableHeavyAnimations ? 0 : 0.5 }}
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
                        key={`ex-${origIdx}-${ex.exercise}`}
                        exercise={exerciseData}
                        language={language}
                        onMenuAction={(action) => handleExerciseMenuAction(action, exerciseData.id, exerciseData.name, origIdx)}
                        onSetAction={(payload) => handleExerciseSetAction({ ...payload, exerciseId: exerciseData.id, exerciseOrigIdx: origIdx })}
                        onChange={(updated) => {
                          // NOTE: Completion state is handled exclusively by onSetAction → handleExerciseSetAction
                          // to prevent double-toggle bugs. This handler only deals with structural changes.

                          // Detect and sync set count changes (add/remove sets)
                          const newSetCount = updated.sets.length;
                          const oldSetCount = ex.completedSets.length;
                          if (newSetCount !== oldSetCount) {
                            // Update exerciseState to match the new set count
                            setExerciseState(prev => {
                              const entry = prev[origIdx];
                              if (!entry) return prev;
                              const newCompleted = Array(newSetCount).fill(false);
                              for (let i = 0; i < Math.min(oldSetCount, newSetCount); i++) {
                                newCompleted[i] = updated.sets[i]?.completed || entry.completedSets[i] || false;
                              }
                              // Also handle any remaining completed from the updated.sets
                              for (let i = 0; i < newSetCount; i++) {
                                if (updated.sets[i]?.completed) newCompleted[i] = true;
                              }
                              return prev.map((e, idx) => idx === origIdx ? { ...e, completedSets: newCompleted } : e);
                            });
                            // Persist the new set count to the DB
                            const dbSets = [...workout.sets];
                            if (dbSets[origIdx]) {
                              dbSets[origIdx] = { ...dbSets[origIdx], sets: newSetCount };
                              onExerciseChange?.(workout, origIdx, { ...workout, sets: dbSets });
                            }
                          }
                          // Auto-save when all sets in exercise are completed
                          if (updated.sets.length > 0 && updated.sets.every((s: any) => s.completed)) {
                            const currentSets = [...workout.sets];
                            if (currentSets[origIdx]) {
                              // Use the DB set count, falling back to updated.sets length
                              const dbSetCount = currentSets[origIdx].sets || updated.sets.length;
                              currentSets[origIdx] = { ...currentSets[origIdx], done: true, sets: dbSetCount };
                              onExerciseChange?.(workout, origIdx, { ...workout, sets: currentSets });
                            }
                          }
                        }}
                      />
                    );
                  })}
                </div>

                {/* Exercise Edit Modal inside WorkoutCard */}
                <AnimatePresence>
                  {editingExercise && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1100, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}
                      onClick={(e) => { e.stopPropagation(); setEditingExercise(null); }}>
                      <motion.div
                        ref={editExerciseDialogRef}
                        initial={isMobile ? { opacity: 0, y: 80 } : { opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, ...(isMobile ? { y: 0 } : { scale: 1 }) }}
                        exit={isMobile ? { opacity: 0, y: 80 } : { opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                        onClick={e => e.stopPropagation()}
                        style={{ background: "#1A1A1F", border: "1px solid rgba(124,252,0,0.3)", borderRadius: isMobile ? "20px 20px 0 0" : "20px", padding: isMobile ? 20 : 24, width: "100%", maxWidth: isMobile ? "100%" : 400 }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={editExerciseTitleId}
                        aria-describedby={editExerciseDescriptionId}
                        tabIndex={-1}
                      >
                        {isMobile && <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 16px" }} />}
                        <h3 id={editExerciseTitleId} style={{ color: "#FFF", marginBottom: isMobile ? 12 : 8, fontSize: isMobile ? 17 : 18, fontWeight: 700 }}>
                          {isArabicLanguage(language) ? "تعديل التمرين" : "Edit Exercise"}
                        </h3>
                        <p id={editExerciseDescriptionId} className="sr-only">
                          {isArabicLanguage(language)
                            ? "حدّث تفاصيل التمرين المحدد. اضغط Escape للإغلاق."
                            : "Update the selected exercise details. Press Escape to close this dialog."}
                        </p>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          setExerciseState(prev => {
                            const next = [...prev];
                            if(next[editingExercise.index]) {
                              next[editingExercise.index] = {
                                ...next[editingExercise.index],
                                nameStr: formData.get("name") as string,
                              };
                            }
                            return next;
                          });
                          setEditingExercise(null);
                        }}>
                          <div style={{ marginBottom: isMobile ? 14 : 12 }}>
                            <label style={{ display: "block", color: SECONDARY_TEXT_COLOR, fontSize: isMobile ? 14 : 13, marginBottom: isMobile ? 6 : 4 }}>
                              {isArabicLanguage(language) ? "اسم التمرين" : "Exercise Name"}
                            </label>
                            <input aria-label="Exercise name" name="name" defaultValue={editingExercise.data.name} required style={{ width: "100%", padding: isMobile ? "14px 16px" : "10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: 16, minHeight: isMobile ? 48 : 40 }} />
                          </div>
                          <div style={{ display: "flex", gap: isMobile ? 8 : 8 }}>
                            <button type="button" onClick={() => setEditingExercise(null)} style={{ flex: 1, padding: isMobile ? 16 : 10, background: "rgba(255,255,255,0.05)", color: "#FFF", border: "none", borderRadius: 12, minHeight: isMobile ? 52 : TOUCH_TARGET_SIZE, fontSize: 16 }}>
                              {isArabicLanguage(language) ? "إلغاء" : "Cancel"}
                            </button>
                            <button type="submit" style={{ flex: 1, padding: isMobile ? 16 : 10, background: "#7CFC00", color: "#000", fontWeight: 700, border: "none", borderRadius: 12, minHeight: isMobile ? 52 : TOUCH_TARGET_SIZE, fontSize: 16 }}>
                              {isArabicLanguage(language) ? "حفظ" : "Save Update"}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Action row */}
                <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  <button aria-label={`Add exercise to ${workout.title}`} onClick={onAddExercise} style={{ flex: "1 1 100%", height: 42, borderRadius: 10, background: "rgba(124,252,0,0.1)", border: "1px solid rgba(124,252,0,0.22)", color: "#7CFC00", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontWeight: 700 }}>
                    <Plus size={14} /> {isArabicLanguage(language) ? "إضافة تمرين" : "Add Exercise"}
                  </button>
                  <button aria-label={`Edit ${workout.title}`} onClick={onEdit} style={{ flex: 1, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: SECONDARY_TEXT_COLOR, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13 }}>
                    <Edit3 size={14} /> {isArabicLanguage(language) ? "تعديل" : "Edit"}
                  </button>
                  <button aria-label={`Delete ${workout.title}`} onClick={onDelete} style={{ flex: 1, height: 40, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13 }}>
                    <Trash2 size={14} /> {isArabicLanguage(language) ? "حذف" : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

// ─── Main WorkoutsTab ─────────────────────────────────────────────────────────
export default function WorkoutsTab({ isPrivate, memberId, unitPreference = "kg" }: { isPrivate: boolean, memberId: number, unitPreference?: "kg" | "lbs" }) {
  const { data: dbWorkouts, isLoading } = useListWorkouts(memberId);
  const createWorkoutMutation = useCreateWorkout();
  const updateWorkoutMutation = useUpdateWorkout();
  const deleteWorkoutMutation = useDeleteWorkout();
  const { disableHeavyAnimations } = useDashboardMotion();
  const isMobile = useIsMobile();
  const workoutModalRef = useRef<HTMLDivElement>(null);
  const weeklyPlanModalRef = useRef<HTMLDivElement>(null);
  const tasksModalRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<any>(null);
  
  const [isWeeklyPlanModalOpen, setIsWeeklyPlanModalOpen] = useState(false);
  const [localWeekPlan, setLocalWeekPlan] = useState(() => {
    if (typeof window === 'undefined') return WEEK_PLAN;
    const saved = localStorage.getItem('workoutTabWeekPlan');
    const version = localStorage.getItem('workoutTabWeekPlanVersion');
    // Version "2" ensures stale data with hardcoded done:true values is cleared
    if (saved && version === '2') {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 7) return parsed;
      } catch {}
    }
    // Clear stale data and start fresh with all days unchecked
    localStorage.removeItem('workoutTabWeekPlan');
    localStorage.setItem('workoutTabWeekPlanVersion', '2');
    return WEEK_PLAN;
  });

  // Load tasks from localStorage or use defaults
  const [localTasks, setLocalTasks] = useState(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('workoutTabTasks');
    const lastReset = localStorage.getItem('workoutTabTasksLastReset');
    const today = new Date().toDateString();
    
    // Auto-reset if it's a new day
    if (saved && lastReset === today) {
      return JSON.parse(saved);
    }
    
    // Default tasks (all unchecked)
    return [
      { id: 1, title: "Complete leg day workout", completed: false, priority: "high" },
      { id: 2, title: "Log daily calories", completed: false, priority: "medium" },
      { id: 3, title: "Update body measurements", completed: false, priority: "low" },
      { id: 4, title: "Review coach feedback", completed: false, priority: "high" },
    ];
  });

  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [workoutFormError, setWorkoutFormError] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [language, setLanguage] = useState("en");
  const undoTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const { titleId: workoutModalTitleId, descriptionId: workoutModalDescriptionId } = useAccessibleDialog(
    isModalOpen,
    workoutModalRef,
    () => setIsModalOpen(false)
  );
  const { titleId: weeklyPlanTitleId, descriptionId: weeklyPlanDescriptionId } = useAccessibleDialog(
    isWeeklyPlanModalOpen,
    weeklyPlanModalRef,
    () => setIsWeeklyPlanModalOpen(false)
  );
  const { titleId: tasksModalTitleId, descriptionId: tasksModalDescriptionId } = useAccessibleDialog(
    isTasksModalOpen,
    tasksModalRef,
    () => setIsTasksModalOpen(false)
  );

  const todayPlan = localWeekPlan[TODAY_IDX % localWeekPlan.length];
  const formatWeight = useCallback((value: number, unit: string) => {
    if (unit === "—" || unit === "â€”") return unitPreference === "lbs" ? "bodyweight" : "bodyweight";
    if (unitPreference === "lbs") return `${Math.round(value * 2.20462)} lbs`;
    return `${value} kg`;
  }, [unitPreference]);

  const pushUndo = useCallback((entry: UndoEntry) => {
    setUndoStack(prev => [entry, ...prev].slice(0, 3));
    undoTimersRef.current[entry.id] = setTimeout(() => {
      setUndoStack(prev => prev.filter((item) => item.id !== entry.id));
      delete undoTimersRef.current[entry.id];
    }, 3000);
  }, []);

  const handleUndo = useCallback((entry: UndoEntry) => {
    const timeout = undoTimersRef.current[entry.id];
    if (timeout) {
      clearTimeout(timeout);
      delete undoTimersRef.current[entry.id];
    }
    entry.undo();
    setUndoStack(prev => prev.filter((item) => item.id !== entry.id));
    toast.success("Action undone.");
  }, []);

  useEffect(() => {
    return () => {
      Object.values(undoTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    setLanguage(getPreferredLanguage());
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && localTasks.length > 0) {
      localStorage.setItem('workoutTabTasks', JSON.stringify(localTasks));
      localStorage.setItem('workoutTabTasksLastReset', new Date().toDateString());
    }
  }, [localTasks]);

  // Save weekly plan to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && localWeekPlan.length > 0) {
      localStorage.setItem('workoutTabWeekPlan', JSON.stringify(localWeekPlan));
      localStorage.setItem('workoutTabWeekPlanVersion', '2');
    }
  }, [localWeekPlan]);

  // Manual reset function
  const handleResetLocalTasks = () => {
    setLocalTasks((prev: LocalTask[]) => prev.map((t: LocalTask) => ({ ...t, completed: false })));
    toast.success("All tasks reset");
  };

  const normalizedWorkouts = (Array.isArray(dbWorkouts) && dbWorkouts.length > 0
    ? dbWorkouts
    : []
  ).map((workout: any, index: number) => {
    const normalized = normalizeWorkout(workout);
    return {
      ...normalized,
      title: localizeWorkoutTitle(normalized.title, language, index + 1),
    };
  });

  const handleAddExercise = useCallback((workout: any) => {
    const nextExerciseNumber = Array.isArray(workout.sets) ? workout.sets.length + 1 : 1;
    const nextSets = [...(Array.isArray(workout.sets) ? workout.sets : []), getDefaultExercise(language, nextExerciseNumber)];

    updateWorkoutMutation.mutate(
      {
        id: workout.id,
        data: {
          sets: nextSets,
        },
      },
      {
        onSuccess: () => {
          toast.success(isArabicLanguage(language) ? "تمت إضافة التمرين." : "Exercise added.");
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, isArabicLanguage(language) ? "تعذر إضافة التمرين الآن." : "Couldn't add an exercise right now."));
        },
      }
    );
  }, [language, updateWorkoutMutation]);

  const handleExerciseChange = useCallback((workout: any, exerciseIndex: number, updated: any) => {
    // If the updated object comes from handleFinishWorkout (has status field), handle differently
    if (updated.status) {
      updateWorkoutMutation.mutate(
        {
          id: workout.id,
          data: {
            status: updated.status,
            sets: updated.sets,
          },
        },
        {
          onError: (error) => {
            toast.error(getErrorMessage(error, isArabicLanguage(language) ? "تعذر تحديث التمرين الآن." : "Couldn't update workout right now."));
          },
        }
      );
      return;
    }

    const currentSets = Array.isArray(workout.sets) ? [...workout.sets] : [];
    // Use the most common reps/weight across all sets, falling back to set #0
    const allSets = Array.isArray(updated.sets) ? updated.sets : [];
    const firstSet = allSets[0] || {};
    // Find the most frequently used reps and weight values
    const repsCount: Record<string, number> = {};
    const weightCount: Record<number, number> = {};
    allSets.forEach((s: any) => {
      if (s.reps != null) {
        const key = String(s.reps);
        repsCount[key] = (repsCount[key] || 0) + 1;
      }
      if (s.kg != null) {
        weightCount[s.kg] = (weightCount[s.kg] || 0) + 1;
      }
    });
    const mostCommonReps = Object.entries(repsCount).sort((a, b) => b[1] - a[1])[0]?.[0] || String(firstSet.reps ?? 10);
    const mostCommonWeight = Object.entries(weightCount).sort((a, b) => b[1] - a[1])[0]?.[0] || Number(firstSet.kg ?? 0);

    currentSets[exerciseIndex] = {
      ...(currentSets[exerciseIndex] || {}),
      exercise: updated.name,
      sets: allSets.length,
      reps: mostCommonReps,
      weight: Number(mostCommonWeight),
      unit: currentSets[exerciseIndex]?.unit || "kg",
      done: allSets.length > 0 && allSets.every((set: any) => Boolean(set.completed)),
    };

    updateWorkoutMutation.mutate(
      {
        id: workout.id,
        data: {
          sets: currentSets,
        },
      },
      {
        onError: (error) => {
          toast.error(getErrorMessage(error, isArabicLanguage(language) ? "تعذر تحديث المجموعات الآن." : "Couldn't update sets right now."));
        },
      }
    );
  }, [language, updateWorkoutMutation]);

  if (isLoading) {
    return <WorkoutsLoadingState />;
  }

  return (
    <div className={cn("flex flex-col gap-5 md:gap-8 px-0 md:px-0", disableHeavyAnimations && "reduced-motion")}>
      {undoStack.length > 0 && (
        <div style={{ position: "sticky", top: 12, zIndex: 70, display: "flex", flexDirection: "column", gap: 8 }}>
          {undoStack.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => handleUndo(entry)}
              style={{
                alignSelf: "flex-end",
                minHeight: 44,
                padding: "10px 14px",
                borderRadius: 14,
                border: "1px solid rgba(124,252,0,0.24)",
                background: "rgba(18,18,22,0.94)",
                color: "#FFFFFF",
                cursor: "pointer",
                boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
              }}
            >
              Undo: {entry.label}
            </button>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Dumbbell size={isMobile ? 20 : 24} color="#7CFC00" />
          <span style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#FFFFFF" }}>Your Workouts</span>
        </div>
      </div>

      {/* Weekly strip */}
      <div style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>This Week</div>
          <button 
            onClick={() => setIsWeeklyPlanModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-text-secondary)", fontSize: 11, fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", transition: "color 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.color = "#7CFC00"}
            onMouseOut={(e) => e.currentTarget.style.color = "var(--color-text-secondary)"}
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
                <button
                  onClick={() => setLocalWeekPlan(prev => prev.map((d, idx) => idx === i ? { ...d, done: !d.done } : d))}
                  aria-label={`${day.done ? "Unmark" : "Mark"} ${day.day} as done`}
                  aria-pressed={day.done}
                  style={{
                    width: "100%", padding: "10px 0", borderRadius: 10,
                    background: day.done ? "rgba(124,252,0,0.08)" : isToday ? "rgba(124,252,0,0.1)" : "rgba(255,255,255,0.03)",
                    border: isToday ? "1px solid rgba(124,252,0,0.3)" : day.done ? "1px solid rgba(124,252,0,0.2)" : "1px solid rgba(255,255,255,0.04)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative",
                    cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  {day.done
                    ? <CheckCircle2 size={18} color="#7CFC00" strokeWidth={2.5} />
                    : <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)" }} />
                  }
                  <span style={{ fontSize: 9, color: isToday ? "#7CFC00" : day.done ? "#7CFC00" : "#5A5A5A", textAlign: "center", lineHeight: 1.2 }}>{day.label}</span>
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <Target size={12} color="#7CFC00" />
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Today: <span style={{ color: "#FFFFFF", fontWeight: 600 }}>{todayPlan.label}</span></span>
        </div>
        {/* Weekly progress bar */}
        {(() => {
          const doneDays = localWeekPlan.filter(d => d.done).length;
          const totalDays = localWeekPlan.length;
          const weekPct = Math.round((doneDays / totalDays) * 100);
          return (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>
                <span>Weekly Progress</span>
                <span style={{ color: "#7CFC00", fontWeight: 600 }}>{doneDays}/{totalDays} days ({weekPct}%)</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                <motion.div
                  animate={{ width: `${weekPct}%` }}
                  transition={{ duration: 0.6 }}
                  style={{ height: "100%", background: "linear-gradient(90deg, #7CFC00, #39FF14)", borderRadius: 4 }}
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Workout cards (Assigned Workouts) moved up here */}
      <motion.div
        initial={disableHeavyAnimations ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: disableHeavyAnimations ? 0 : 0.2, duration: disableHeavyAnimations ? 0 : 0.3 }}
        style={{ minHeight: 420 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Assigned Workouts</div>
          <button
            onClick={() => { setEditingWorkout(null); setIsModalOpen(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#7CFC00", border: "none", borderRadius: 10, padding: isMobile ? "7px 12px" : "8px 14px", color: "#000", cursor: "pointer", fontSize: isMobile ? 12 : 13, fontWeight: 700, minHeight: isMobile ? 38 : 40 }}
          >
            <Plus size={isMobile ? 13 : 14} /> {isArabicLanguage(language) ? "إضافة تمرين كامل" : "Add Workout"}
          </button>
        </div>
        <LazyRenderSection
          minHeight={normalizedWorkouts.length === 0 ? 200 : 360}
          fallback={
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Array.from({ length: Math.min(normalizedWorkouts.length || 2, 3) }).map((_, index) => (
                <WorkoutCardSkeleton key={index} />
              ))}
            </div>
          }
        >
          {normalizedWorkouts.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: isMobile ? "40px 20px" : "60px 20px", textAlign: "center",
            }}>
              <div style={{
                width: isMobile ? 64 : 80, height: isMobile ? 64 : 80,
                borderRadius: "50%", background: "rgba(124,252,0,0.08)",
                border: "2px solid rgba(124,252,0,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <Dumbbell size={isMobile ? 28 : 36} color="#7CFC00" strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: "#FFFFFF", marginBottom: 6 }}>
                No Workouts Yet
              </div>
              <div style={{ fontSize: isMobile ? 13 : 14, color: "var(--color-text-secondary)", marginBottom: 20, maxWidth: 280, lineHeight: 1.5 }}>
                Design your own workout program - tap on + and start now!
              </div>
              <button
                onClick={() => { setEditingWorkout(null); setIsModalOpen(true); }}
                style={{
                  height: isMobile ? 48 : 44, borderRadius: 12, padding: "0 24px",
                  background: "linear-gradient(135deg, #7CFC00, #39FF14)", border: "none",
                  color: "#000", fontWeight: 700, fontSize: isMobile ? 14 : 15,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <Plus size={18} /> Create Workout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {normalizedWorkouts.map((w: any, i: number) => (
              <WorkoutCard
                key={w.id}
                workout={w}
                isPrivate={isPrivate}
                delay={i}
                language={language}
                onAddExercise={() => handleAddExercise(w)}
                onExerciseChange={handleExerciseChange}
                onEdit={() => { setEditingWorkout(w); setIsModalOpen(true); }}
                onQueueUndo={pushUndo}
                updateWorkoutMutation={updateWorkoutMutation}
                onDelete={() =>
                  showConfirmToast({
                    message: `Delete "${w.title}"?`,
                    confirmLabel: "Delete",
                    onConfirm: () =>
                      deleteWorkoutMutation.mutate(
                        { id: w.id },
                        { onSuccess: () => toast.success("Workout deleted.") }
                      ),
                  })
                }
              />
            ))}
            </div>
          )}
        </LazyRenderSection>
      </motion.div>

      {/* Current Tasks Section */}
      <motion.div
        initial={disableHeavyAnimations ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: disableHeavyAnimations ? 0 : 0.3, duration: disableHeavyAnimations ? 0 : 0.3 }}
        style={{
          background: "#16161A",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: isMobile ? 16 : 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 14 : 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
            <Target size={isMobile ? 18 : 20} color="#7CFC00" />
            <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, color: "#FFFFFF" }}>Current Tasks</span>
            <span style={{ fontSize: isMobile ? 12 : 14, color: "var(--color-text-secondary)" }}>
              {localTasks.filter((t: LocalTask) => t.completed).length}/{localTasks.length}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {localTasks.some((t: LocalTask) => t.completed) && (
              <button
                onClick={handleResetLocalTasks}
                style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-text-secondary)", fontSize: isMobile ? 11 : 12, fontWeight: 600, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", borderRadius: 8, padding: isMobile ? "6px 10px" : "6px 12px" }}
              >
                <RotateCcw size={isMobile ? 12 : 14} /> Reset
              </button>
            )}
            <button
              onClick={() => setIsTasksModalOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 4, color: "#7CFC00", fontSize: isMobile ? 11 : 12, fontWeight: 600, background: "rgba(124,252,0,0.08)", border: "1px solid rgba(124,252,0,0.15)", cursor: "pointer", borderRadius: 8, padding: isMobile ? "6px 10px" : "6px 12px" }}
            >
              <Edit3 size={isMobile ? 12 : 14} /> Edit
            </button>
          </div>
        </div>

        {/* Task Filter — horizontal scroll on mobile */}
        <div className={cn("flex gap-2", isMobile && "overflow-x-auto no-scrollbar pb-1")} style={{ marginBottom: isMobile ? 12 : 16 }}>
          {["all", "pending", "completed"].map((filter) => (
            <button
              key={filter}
              style={{
                padding: isMobile ? "7px 14px" : "6px 12px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.05)",
                color: "var(--color-text-secondary)",
                fontSize: isMobile ? 13 : 12,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
                whiteSpace: "nowrap",
                minHeight: 36,
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Tasks List — compact on mobile */}
        {localTasks.map((task: LocalTask, i: number) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 + 0.3 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 10 : 12,
              padding: isMobile ? "10px 0" : "12px 0",
              borderBottom: i < localTasks.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none"
            }}
          >
            <button
              onClick={() => {
                setLocalTasks((prev: LocalTask[]) => prev.map((t: LocalTask) => t.id === task.id ? { ...t, completed: !t.completed } : t));
              }}
              style={{
                width: isMobile ? 24 : 20,
                height: isMobile ? 24 : 20,
                borderRadius: 6,
                border: `2px solid ${task.completed ? "#7CFC00" : "rgba(255,255,255,0.2)"}`,
                background: task.completed ? "#7CFC00" : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                minWidth: isMobile ? 24 : 20,
              }}
            >
              {task.completed && <CheckCircle2 size={isMobile ? 14 : 12} color="#000" />}
            </button>
            <span style={{
              flex: 1,
              fontSize: isMobile ? 13 : 14,
              color: task.completed ? "var(--color-text-secondary)" : "#FFFFFF",
              textDecoration: task.completed ? "line-through" : "none",
              lineHeight: 1.3,
            }}>
              {task.title}
            </span>
            <div style={{
              width: isMobile ? 10 : 8,
              height: isMobile ? 10 : 8,
              borderRadius: "50%",
              background: task.priority === "high" ? "#EF4444" : task.priority === "medium" ? "#F59E0B" : "#7CFC00",
              flexShrink: 0,
            }} />
          </motion.div>
        ))}

        <button
          onClick={() => setIsTasksModalOpen(true)}
          style={{
            width: "100%",
            marginTop: isMobile ? 12 : 16,
            height: isMobile ? 44 : 40,
            borderRadius: 10,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--color-text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: isMobile ? 13 : 14
          }}
        >
          <Edit3 size={isMobile ? 14 : 16} /> Manage Tasks
        </button>
      </motion.div>

      {/* Removed old workout cards duplicate block from here */}


      {/* Workout Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            onClick={() => setIsModalOpen(false)}>
            <motion.div
              ref={workoutModalRef}
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#1A1A1F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px 20px 0 0", padding: isMobile ? 20 : 28, width: "100%", maxWidth: 480, maxHeight: isMobile ? "92vh" : "85vh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={workoutModalTitleId}
              aria-describedby={workoutModalDescriptionId}
              tabIndex={-1}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />
              <h2 id={workoutModalTitleId} style={{ color: "#FFF", marginBottom: 8, fontSize: 18, fontWeight: 700 }}>
                {editingWorkout
                  ? (isArabicLanguage(language) ? "تعديل التدريب" : "Edit Workout")
                  : (isArabicLanguage(language) ? "إضافة تدريب" : "Add Workout")}
              </h2>
              <p id={workoutModalDescriptionId} className="sr-only">
                {isArabicLanguage(language)
                  ? "نافذة تعديل التدريب. اضغط Escape للإغلاق."
                  : "Workout editor dialog. Press Escape to close the dialog."}
              </p>
              <form onSubmit={(e) => {
                e.preventDefault();
                setWorkoutFormError(null);
                const formData = new FormData(e.currentTarget);
                const title = String(formData.get("title") || "").trim();
                const caloriesRaw = String(formData.get("calories") || "").trim();
                const calories = parseInt(caloriesRaw, 10);
                if (title.length < 3) {
                  setWorkoutFormError("Workout title should be at least 3 characters.");
                  return;
                }
                if (Number.isNaN(calories) || calories <= 0) {
                  setWorkoutFormError("Calories should be a number greater than 0.");
                  return;
                }
                const data = {
                  title,
                  duration: "—",
                  calories,
                  status: "todo", difficulty: "Medium",
                  muscles: ["Unknown"],
                  sets: [getDefaultExercise(language, 1)],
                };
                if (editingWorkout) {
                  updateWorkoutMutation.mutate(
                    { id: editingWorkout.id, data },
                    {
                      onSuccess: () => {
                        toast.success(isArabicLanguage(language) ? "تم تحديث التدريب." : "Workout updated.");
                        setIsModalOpen(false);
                      },
                      onError: (error) => setWorkoutFormError(getErrorMessage(error, isArabicLanguage(language) ? "تعذر تحديث التدريب الآن." : "Couldn't update that workout right now.")),
                    }
                  );
                } else {
                  createWorkoutMutation.mutate(
                    { member_id: memberId, ...data, coach_assigned: false },
                    {
                      onSuccess: () => {
                        toast.success(isArabicLanguage(language) ? "تم إنشاء التدريب." : "Workout created.");
                        setIsModalOpen(false);
                      },
                      onError: (error) => setWorkoutFormError(getErrorMessage(error, isArabicLanguage(language) ? "تعذر إنشاء التدريب الآن." : "Couldn't create that workout right now.")),
                    }
                  );
                }
              }}>
                {workoutFormError && (
                  <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#FCA5A5", fontSize: 13 }}>
                    {workoutFormError}
                  </div>
                )}
                {[
                  { name: "title", label: isArabicLanguage(language) ? "عنوان التدريب" : "Workout Title", type: "text", def: editingWorkout?.title || "" },
                  { name: "calories", label: isArabicLanguage(language) ? "السعرات (kcal)" : "Calories (kcal)", type: "number", def: editingWorkout?.calories || 300 },
                ].map(f => (
                  <div key={f.name} style={{ marginBottom: isMobile ? 14 : 16 }}>
                    <label style={{ display: "block", color: SECONDARY_TEXT_COLOR, fontSize: isMobile ? 14 : 13, marginBottom: isMobile ? 6 : 8, fontWeight: 500 }}>{f.label}</label>
                    <input aria-label={f.label} name={f.name} type={f.type} defaultValue={f.def} required style={{ width: "100%", padding: isMobile ? "14px 16px" : "13px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: 16, fontFamily: "Inter, sans-serif", minHeight: isMobile ? 52 : 48 }} />
                  </div>
                ))}
                <div style={{ display: "flex", gap: isMobile ? 8 : 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: isMobile ? 16 : 14, background: "rgba(255,255,255,0.05)", color: "#FFF", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 16, minHeight: isMobile ? 56 : 52 }}>
                    {isArabicLanguage(language) ? "إلغاء" : "Cancel"}
                  </button>
                  <button type="submit" disabled={createWorkoutMutation.isPending || updateWorkoutMutation.isPending} style={{ flex: 1, padding: isMobile ? 16 : 14, background: "#7CFC00", color: "#000", fontWeight: 700, border: "none", borderRadius: 12, cursor: "pointer", fontSize: 16, minHeight: isMobile ? 56 : 52 }}>
                    {isArabicLanguage(language) ? "حفظ" : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Weekly Plan Editor Modal */}
      <AnimatePresence>
        {isWeeklyPlanModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}
            onClick={() => setIsWeeklyPlanModalOpen(false)}>
            <motion.div
              ref={weeklyPlanModalRef}
              initial={isMobile ? { opacity: 0, y: 80 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, ...(isMobile ? { y: 0 } : { scale: 1 }) }}
              exit={isMobile ? { opacity: 0, y: 80 } : { opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#1A1A1F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: isMobile ? "20px 20px 0 0" : "20px", padding: isMobile ? 20 : 24, width: "100%", maxWidth: isMobile ? "100%" : 400, maxHeight: isMobile ? "92vh" : "90vh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={weeklyPlanTitleId}
              aria-describedby={weeklyPlanDescriptionId}
              tabIndex={-1}
            >
              {isMobile && <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 16px" }} />}
              <h3 id={weeklyPlanTitleId} style={{ color: "#FFF", marginBottom: isMobile ? 12 : 8, fontSize: isMobile ? 17 : 18, fontWeight: 700 }}>Edit Weekly Plan</h3>
              <p id={weeklyPlanDescriptionId} className="sr-only">Weekly workout plan editor. Press Escape to close the dialog.</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newPlan = localWeekPlan.map((day) => ({
                  ...day,
                  label: formData.get(`label-${day.day}`) as string,
                  done: formData.get(`done-${day.day}`) === "on",
                }));
                newPlan.forEach(d => {
                  if (d.label?.toLowerCase().includes("rest")) d.color = "#5A5A5A";
                  else if (d.label?.toLowerCase().includes("leg")) d.color = "#7CFC00";
                  else if (d.label?.toLowerCase().includes("pull") || d.label?.toLowerCase().includes("upper")) d.color = "#8B5CF6";
                  else d.color = "#F59E0B";
                });
                setLocalWeekPlan(newPlan);
                setIsWeeklyPlanModalOpen(false);
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 10 : 12, marginBottom: isMobile ? 20 : 24 }}>
                  {localWeekPlan.map(day => (
                    <div key={day.day} style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 12, background: "rgba(255,255,255,0.03)", padding: isMobile ? "12px" : "10px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ width: isMobile ? 44 : 40, fontSize: isMobile ? 14 : 13, fontWeight: 700, color: day.color }}>{day.day}</div>
                      <input name={`label-${day.day}`} defaultValue={day.label} style={{ flex: 1, padding: isMobile ? "12px 14px" : "8px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: 16, minHeight: isMobile ? 48 : 36 }} />
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: SECONDARY_TEXT_COLOR, fontSize: isMobile ? 13 : 12 }}>
                        Done
                        <input type="checkbox" name={`done-${day.day}`} defaultChecked={day.done} style={{ width: isMobile ? 22 : 16, height: isMobile ? 22 : 16, accentColor: "#7CFC00" }} />
                      </label>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: isMobile ? 8 : 8 }}>
                  <button type="button" onClick={() => setIsWeeklyPlanModalOpen(false)} style={{ flex: 1, padding: isMobile ? 16 : 12, background: "rgba(255,255,255,0.05)", color: "#FFF", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 16, minHeight: isMobile ? 52 : 44 }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: isMobile ? 16 : 12, background: "#7CFC00", color: "#000", fontWeight: 700, border: "none", borderRadius: 12, cursor: "pointer", fontSize: 16, minHeight: isMobile ? 52 : 44 }}>Save Plan</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tasks Editor Modal */}
      <AnimatePresence>
        {isTasksModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}
            onClick={() => setIsTasksModalOpen(false)}>
            <motion.div
              ref={tasksModalRef}
              initial={isMobile ? { opacity: 0, y: 80 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, ...(isMobile ? { y: 0 } : { scale: 1 }) }}
              exit={isMobile ? { opacity: 0, y: 80 } : { opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#1A1A1F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: isMobile ? "20px 20px 0 0" : "20px", padding: isMobile ? 20 : 24, width: "100%", maxWidth: isMobile ? "100%" : 450, maxHeight: isMobile ? "92vh" : "90vh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={tasksModalTitleId}
              aria-describedby={tasksModalDescriptionId}
              tabIndex={-1}
            >
              {isMobile && <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 16px" }} />}
              <h3 id={tasksModalTitleId} style={{ color: "#FFF", marginBottom: isMobile ? 12 : 8, fontSize: isMobile ? 17 : 18, fontWeight: 700 }}>Edit Tasks</h3>
              <p id={tasksModalDescriptionId} className="sr-only">Task management dialog. Press Escape to close the dialog.</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updatedTasks = localTasks.map((t: LocalTask) => ({
                  ...t,
                  title: formData.get(`task-${t.id}-title`) as string,
                  priority: formData.get(`task-${t.id}-pri`) as string,
                }));
                setLocalTasks(updatedTasks);
                setIsTasksModalOpen(false);
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 10 : 12, marginBottom: isMobile ? 20 : 24 }}>
                  {localTasks.map((task: LocalTask) => (
                    <div key={task.id} style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 8, background: "rgba(255,255,255,0.03)", padding: isMobile ? "12px" : "10px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <button type="button" onClick={() => setLocalTasks((prev: LocalTask[]) => prev.filter((p: LocalTask) => p.id !== task.id))} style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", minWidth: isMobile ? 36 : 28, minHeight: isMobile ? 44 : 32, justifyContent: "center" }}>
                        <Trash2 size={isMobile ? 18 : 16} />
                      </button>
                      <input name={`task-${task.id}-title`} defaultValue={task.title} style={{ flex: 1, padding: isMobile ? "12px 14px" : "8px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: 16, minHeight: isMobile ? 48 : 36 }} />
                      <select name={`task-${task.id}-pri`} defaultValue={task.priority} style={{ padding: isMobile ? "12px" : "8px", borderRadius: "8px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: isMobile ? 14 : 12, minHeight: isMobile ? 48 : 36 }}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  ))}
                </div>
                
                <button type="button" onClick={() => {
                  setLocalTasks((prev: LocalTask[]) => [...prev, { id: Date.now(), title: "New Task", completed: false, priority: "medium" }]);
                }} style={{ width: "100%", padding: isMobile ? "14px" : "12px", background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 12, color: SECONDARY_TEXT_COLOR, fontSize: isMobile ? 14 : 13, marginBottom: isMobile ? 20 : 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: isMobile ? 48 : 40 }}>
                  <Plus size={isMobile ? 18 : 16} /> Add Task
                </button>

                <div style={{ display: "flex", gap: isMobile ? 8 : 8 }}>
                  <button type="button" onClick={() => setIsTasksModalOpen(false)} style={{ flex: 1, padding: isMobile ? 16 : 12, background: "rgba(255,255,255,0.05)", color: "#FFF", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 16, minHeight: isMobile ? 52 : 44 }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: isMobile ? 16 : 12, background: "#7CFC00", color: "#000", fontWeight: 700, border: "none", borderRadius: 12, cursor: "pointer", fontSize: 16, minHeight: isMobile ? 52 : 44 }}>Save Tasks</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}