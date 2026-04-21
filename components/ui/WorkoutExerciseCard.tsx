"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { Check, MoreHorizontal, Clock, Timer, Plus, RefreshCw, ChevronDown } from "lucide-react";
import { SECONDARY_TEXT_COLOR, TOUCH_TARGET_SIZE } from "@/lib/accessibility";

/* ─── Types ─────────────────────────────────────────────── */
export interface ExerciseSet {
  id: number;
  previous: string; // e.g. "5 x 50kg"
  reps: number;
  kg: number;
  completed: boolean;
  skipped?: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  iconUrl?: string;
  iconEmoji?: string;
  durationMinutes: number;
  type: string; // e.g. "Unilateral"
  notes?: string;
  sets: ExerciseSet[];
}

interface WorkoutExerciseCardProps {
  exercise: WorkoutExercise;
  language?: string;
  onChange?: (updated: WorkoutExercise) => void;
  onMenuAction?: (action: string, exerciseId: string) => void;
  onSetAction?: (payload: {
    action: "complete" | "skip" | "toggle";
    exerciseId: string;
    exerciseName: string;
    setId: number;
    previous: ExerciseSet;
    next: ExerciseSet;
  }) => void;
}

function isArabicLanguage(language?: string) {
  return (language || "").toLowerCase().startsWith("ar");
}

/* ─── Set Row ───────────────────────────────────────────── */
function SetRow({
  set,
  exerciseId,
  exerciseName,
  onUpdate,
  onAction,
}: {
  set: ExerciseSet;
  exerciseId: string;
  exerciseName: string;
  onUpdate: (updated: ExerciseSet) => void;
  onAction?: WorkoutExerciseCardProps["onSetAction"];
}) {
  const [editingReps, setEditingReps] = useState(false);
  const [editingKg, setEditingKg] = useState(false);
  const [dragX, setDragX] = useState(0);

  const commitUpdate = (next: ExerciseSet, action: "complete" | "skip" | "toggle") => {
    onUpdate(next);
    onAction?.({
      action,
      exerciseId,
      exerciseName,
      setId: set.id,
      previous: set,
      next,
    });
  };

  const toggle = () => commitUpdate({ ...set, completed: !set.completed, skipped: false }, "toggle");

  const bindDrag = useDrag(
    ({ movement: [mx], last }) => {
      if (!last) {
        setDragX(Math.max(-88, Math.min(88, mx)));
        return;
      }

      if (mx >= 72) {
        commitUpdate({ ...set, completed: true, skipped: false }, "complete");
      } else if (mx <= -72) {
        commitUpdate({ ...set, completed: false, skipped: true }, "skip");
      }

      setDragX(0);
    },
    {
      axis: "x",
      filterTaps: true,
      pointer: { touch: true },
    }
  );

  const rowBg = set.skipped
    ? "rgba(245,158,11,0.08)"
    : set.completed
    ? "rgba(124,252,0,0.04)"
    : "rgba(255,255,255,0.02)";
  const rowBorder = set.skipped
    ? "1px solid rgba(245,158,11,0.2)"
    : set.completed
    ? "1px solid rgba(124,252,0,0.12)"
    : "1px solid rgba(255,255,255,0.05)";

  return (
    <div className="flex items-center gap-2 px-3 rounded-xl transition-all"
      style={{
        height: 52,
        background: rowBg,
        border: rowBorder,
        marginBottom: 6,
        transform: `translateX(${dragX}px)`,
        touchAction: "pan-y",
      }}
      {...bindDrag()}
    >
      {/* SET NUMBER */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{
          background: set.skipped
            ? "rgba(245,158,11,0.15)"
            : set.completed
            ? "rgba(124,252,0,0.15)"
            : "rgba(255,255,255,0.06)",
          color: set.skipped ? "#F59E0B" : set.completed ? "#7CFC00" : SECONDARY_TEXT_COLOR,
        }}
      >
        {set.id}
      </div>

      {/* PREVIOUS */}
      <div className="flex-1 min-w-0">
        <span className="text-xs" style={{ color: "#5A5A5A" }}>
          {set.previous}
        </span>
      </div>

      {/* REPS */}
      <div className="w-14 text-center">
        {editingReps ? (
          <input
            autoFocus
            type="number"
            defaultValue={set.reps}
            onBlur={(e) => {
              onUpdate({ ...set, reps: Number(e.target.value) });
              setEditingReps(false);
            }}
            className="w-full text-center bg-transparent border-b text-sm font-bold text-white outline-none"
            style={{ borderColor: "#7CFC00", minHeight: TOUCH_TARGET_SIZE }}
          />
        ) : (
          <button
            onClick={() => setEditingReps(true)}
            className="text-sm font-black text-white hover:text-primary transition-colors w-full"
            style={{ color: set.completed ? "#7CFC00" : set.skipped ? "#F59E0B" : "#ffffff", minHeight: TOUCH_TARGET_SIZE }}
            aria-label={`Edit repetitions for set ${set.id}`}
          >
            {set.reps}
          </button>
        )}
      </div>

      {/* KG */}
      <div className="w-16 text-center">
        {editingKg ? (
          <input
            autoFocus
            type="number"
            defaultValue={set.kg}
            onBlur={(e) => {
              onUpdate({ ...set, kg: Number(e.target.value) });
              setEditingKg(false);
            }}
            className="w-full text-center bg-transparent border-b text-sm font-bold text-white outline-none"
            style={{ borderColor: "#7CFC00", minHeight: TOUCH_TARGET_SIZE }}
          />
        ) : (
          <button
            onClick={() => setEditingKg(true)}
            className="text-sm font-black text-white hover:text-primary transition-colors w-full"
            style={{ color: set.completed ? "#7CFC00" : set.skipped ? "#F59E0B" : "#ffffff", minHeight: TOUCH_TARGET_SIZE }}
            aria-label={`Edit weight for set ${set.id}`}
          >
            {set.kg}
          </button>
        )}
      </div>

      {/* COMPLETE TOGGLE */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={toggle}
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: set.completed
            ? "rgba(124,252,0,0.9)"
            : set.skipped
            ? "rgba(245,158,11,0.22)"
            : "rgba(255,255,255,0.06)",
          border: set.completed
            ? "none"
            : set.skipped
            ? "1px solid rgba(245,158,11,0.3)"
            : "1px solid rgba(255,255,255,0.12)",
          boxShadow: set.completed
            ? "0 0 14px rgba(124,252,0,0.45)"
            : "none",
          minWidth: TOUCH_TARGET_SIZE,
          minHeight: TOUCH_TARGET_SIZE,
        }}
        aria-pressed={set.completed}
        aria-label={`Set ${set.id} ${set.completed ? "completed" : "not completed"}. Activate to ${set.completed ? "mark incomplete" : "mark complete"}.`}
      >
        <Check
          className="w-4 h-4"
          style={{ color: set.completed ? "#000" : set.skipped ? "#FCD34D" : "#5A5A5A" }}
          strokeWidth={3}
        />
      </motion.button>
    </div>
  );
}

/* ─── Main Card ─────────────────────────────────────────── */
export function WorkoutExerciseCard({
  exercise: initialExercise,
  language = "en",
  onChange,
  onMenuAction,
  onSetAction,
}: WorkoutExerciseCardProps) {
  const isArabic = isArabicLanguage(language);
  const [exercise, setExercise] = useState<WorkoutExercise>(initialExercise);
  const [notes, setNotes] = useState(initialExercise.notes ?? "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSet = (updated: ExerciseSet) => {
    const newSets = exercise.sets.map((s) =>
      s.id === updated.id ? updated : s
    );
    const next = { ...exercise, sets: newSets };
    setExercise(next);
    onChange?.(next);
  };

  const addSet = () => {
    const last = exercise.sets[exercise.sets.length - 1];
    const newSet: ExerciseSet = {
      id: exercise.sets.length + 1,
      previous: last ? `${last.reps} x ${last.kg}kg` : "—",
      reps: last?.reps ?? 5,
      kg: last?.kg ?? 0,
      completed: false,
    };
    const next = { ...exercise, sets: [...exercise.sets, newSet] };
    setExercise(next);
    onChange?.(next);
  };

  const removeSet = () => {
    if (exercise.sets.length <= 1) return;
    const nextSets = exercise.sets
      .slice(0, -1)
      .map((set, index) => ({ ...set, id: index + 1 }));
    const next = { ...exercise, sets: nextSets };
    setExercise(next);
    onChange?.(next);
  };

  const completedCount = exercise.sets.filter((s) => s.completed).length;
  const totalCount = exercise.sets.length;

  useEffect(() => {
    return () => {
      if (longPressRef.current) {
        clearTimeout(longPressRef.current);
      }
    };
  }, []);

  const startLongPress = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    longPressRef.current = setTimeout(() => {
      setMenuOpen(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(20);
      }
    }, 450);
  };

  const clearLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(18,18,22,0.95)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        backdropFilter: "blur(12px)",
      }}
      role="group"
      aria-label={`${exercise.name} exercise`}
      onTouchStart={startLongPress}
      onTouchEnd={clearLongPress}
      onTouchCancel={clearLongPress}
      onMouseDown={startLongPress}
      onMouseUp={clearLongPress}
      onMouseLeave={clearLongPress}
    >
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {/* Exercise icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {exercise.iconUrl ? (
            <img
              src={exercise.iconUrl}
              alt={exercise.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl">{exercise.iconEmoji ?? "🏋️"}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-base leading-tight truncate">
            {exercise.name}
          </h3>
          {/* Progress micro-bar */}
          {totalCount > 0 && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className="h-1 rounded-full overflow-hidden flex-1"
                style={{ background: "rgba(255,255,255,0.08)", maxWidth: 80 }}
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(completedCount / totalCount) * 100}%`,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{ background: "#7CFC00" }}
                />
              </div>
              <span className="text-[10px]" style={{ color: "#5A5A5A" }}>
                {completedCount}/{totalCount}
              </span>
            </div>
          )}
        </div>

        {/* 3-dot menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ minWidth: TOUCH_TARGET_SIZE, minHeight: TOUCH_TARGET_SIZE }}
            aria-label={`Open actions for ${exercise.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="w-4 h-4" style={{ color: SECONDARY_TEXT_COLOR }} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  className="absolute right-0 top-9 z-20 rounded-xl py-1 min-w-[140px]"
                  style={{
                    background: "#1A1A22",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  }}
                >
                  {[
                    { label: "Edit exercise", icon: "✏️", action: "edit" },
                    { label: "Skip exercise", icon: "⏭️", action: "skip" },
                    { label: "Add note", icon: "📝", action: "note" },
                    { label: "Remove", icon: "🗑️", action: "remove" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setMenuOpen(false);
                        if (item.action === "note") {
                          setEditingNotes(true);
                          return;
                        }
                        onMenuAction?.(item.action, exercise.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors text-left"
                      style={{ minHeight: TOUCH_TARGET_SIZE }}
                      role="menuitem"
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── METADATA ROW ── */}
      <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: "rgba(124,252,0,0.1)",
            color: "#7CFC00",
            border: "1px solid rgba(124,252,0,0.2)",
          }}
        >
          <Clock className="w-3 h-3" />
          {exercise.durationMinutes}m
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: SECONDARY_TEXT_COLOR,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          ⇌ {exercise.type}
        </div>

        {/* Notes */}
        <div className="w-full mt-1">
          {editingNotes ? (
            <input
              autoFocus
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                setExercise({ ...exercise, notes });
                setEditingNotes(false);
              }}
              placeholder={isArabic ? "أضف ملاحظات هنا..." : "Add notes here..."}
              className="w-full text-xs bg-transparent outline-none text-white placeholder-[#3A3A3A]"
              style={{ borderBottom: "1px solid rgba(124,252,0,0.4)", minHeight: TOUCH_TARGET_SIZE }}
            />
          ) : (
            <button
              onClick={() => setEditingNotes(true)}
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-white"
              style={{ color: notes ? SECONDARY_TEXT_COLOR : "#3A3A3A", minHeight: TOUCH_TARGET_SIZE }}
              aria-label={notes ? `Edit notes for ${exercise.name}` : `Add notes for ${exercise.name}`}
            >
              <span>⇌</span>
              {notes || (isArabic ? "أضف ملاحظات هنا..." : "Add notes here...")}
            </button>
          )}
        </div>
      </div>

      {/* ── COLUMN HEADERS ── */}
      <div
        className="grid gap-2 px-4 py-2 text-[10px] uppercase tracking-widest font-bold"
        style={{
          gridTemplateColumns: "28px 1fr 56px 64px 36px",
          color: "#5A5A5A",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <span>Set</span>
        <span>Previous</span>
        <span className="text-center">Reps</span>
        <span className="text-center">KG</span>
        <span className="text-center">✓</span>
      </div>

      {/* ── SETS ── */}
      <div className="px-3 pt-2 pb-1">
        <AnimatePresence initial={false}>
          {exercise.sets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              exerciseId={exercise.id}
              exerciseName={exercise.name}
              onUpdate={updateSet}
              onAction={onSetAction}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ── FOOTER ── */}
      <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
        <button
          onClick={addSet}
          className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:bg-white/10 active:scale-[0.98]"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: SECONDARY_TEXT_COLOR,
            minHeight: TOUCH_TARGET_SIZE,
          }}
          aria-label={`Add a set to ${exercise.name}`}
        >
          <Plus className="w-4 h-4" />
          {isArabic ? "إضافة مجموعة" : "Add Set"}
        </button>
        <button
          onClick={removeSet}
          disabled={exercise.sets.length <= 1}
          className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.18)",
            color: "#FCA5A5",
            minHeight: TOUCH_TARGET_SIZE,
          }}
          aria-label={`Remove a set from ${exercise.name}`}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>-</span>
          {isArabic ? "Ø­Ø°Ù Ù…Ø¬Ù…ÙˆØ¹Ø©" : "Remove Set"}
        </button>
        <button
          className="flex items-center justify-center gap-2 text-xs font-medium transition-colors hover:text-white"
          style={{ color: "#5A5A5A" }}
          aria-label={`Load set history for ${exercise.name}`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {isArabic ? "تحميل من السجل" : "Load from History"}
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Default example data ──────────────────────────────── */
export const EXAMPLE_EXERCISE: WorkoutExercise = {
  id: "barbell-bench-press",
  name: "Barbell Bench Press",
  iconEmoji: "🏋️",
  durationMinutes: 3,
  type: "Unilateral",
  notes: "",
  sets: [
    { id: 1, previous: "5 x 50kg", reps: 5, kg: 55, completed: true },
    { id: 2, previous: "5 x 70kg", reps: 5, kg: 75, completed: true },
    { id: 3, previous: "5 x 85kg", reps: 7, kg: 85, completed: true },
    { id: 4, previous: "6 x 90kg", reps: 7, kg: 90, completed: true },
  ],
};
