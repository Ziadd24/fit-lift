"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, MoreHorizontal, Clock, Timer, Plus, RefreshCw, ChevronDown } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
export interface ExerciseSet {
  id: number;
  previous: string; // e.g. "5 x 50kg"
  reps: number;
  kg: number;
  completed: boolean;
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
  onChange?: (updated: WorkoutExercise) => void;
  onMenuAction?: (action: string, exerciseId: string) => void;
}

/* ─── Set Row ───────────────────────────────────────────── */
function SetRow({
  set,
  onUpdate,
}: {
  set: ExerciseSet;
  onUpdate: (updated: ExerciseSet) => void;
}) {
  const [editingReps, setEditingReps] = useState(false);
  const [editingKg, setEditingKg] = useState(false);

  const toggle = () => onUpdate({ ...set, completed: !set.completed });

  const rowBg = set.completed
    ? "rgba(124,252,0,0.04)"
    : "rgba(255,255,255,0.02)";
  const rowBorder = set.completed
    ? "1px solid rgba(124,252,0,0.12)"
    : "1px solid rgba(255,255,255,0.05)";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 rounded-xl transition-all"
      style={{
        height: 52,
        background: rowBg,
        border: rowBorder,
        marginBottom: 6,
      }}
    >
      {/* SET NUMBER */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{
          background: set.completed
            ? "rgba(124,252,0,0.15)"
            : "rgba(255,255,255,0.06)",
          color: set.completed ? "#7CFC00" : "#8B8B8B",
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
            style={{ borderColor: "#7CFC00" }}
          />
        ) : (
          <button
            onClick={() => setEditingReps(true)}
            className="text-sm font-black text-white hover:text-primary transition-colors w-full"
            style={{ color: set.completed ? "#7CFC00" : "#ffffff" }}
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
            style={{ borderColor: "#7CFC00" }}
          />
        ) : (
          <button
            onClick={() => setEditingKg(true)}
            className="text-sm font-black text-white hover:text-primary transition-colors w-full"
            style={{ color: set.completed ? "#7CFC00" : "#ffffff" }}
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
            : "rgba(255,255,255,0.06)",
          border: set.completed
            ? "none"
            : "1px solid rgba(255,255,255,0.12)",
          boxShadow: set.completed
            ? "0 0 14px rgba(124,252,0,0.45)"
            : "none",
        }}
      >
        <Check
          className="w-4 h-4"
          style={{ color: set.completed ? "#000" : "#5A5A5A" }}
          strokeWidth={3}
        />
      </motion.button>
    </motion.div>
  );
}

/* ─── Main Card ─────────────────────────────────────────── */
export function WorkoutExerciseCard({
  exercise: initialExercise,
  onChange,
  onMenuAction,
}: WorkoutExerciseCardProps) {
  const [exercise, setExercise] = useState<WorkoutExercise>(initialExercise);
  const [notes, setNotes] = useState(initialExercise.notes ?? "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const completedCount = exercise.sets.filter((s) => s.completed).length;
  const totalCount = exercise.sets.length;

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
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          >
            <MoreHorizontal className="w-4 h-4" style={{ color: "#8B8B8B" }} />
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
                    { label: "Swap exercise", icon: "🔄", action: "swap" },
                    { label: "Remove", icon: "🗑️", action: "remove" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setMenuOpen(false);
                        onMenuAction?.(item.action, exercise.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors text-left"
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
            color: "#8B8B8B",
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
              placeholder="Add notes here..."
              className="w-full text-xs bg-transparent outline-none text-white placeholder-[#3A3A3A]"
              style={{ borderBottom: "1px solid rgba(124,252,0,0.4)" }}
            />
          ) : (
            <button
              onClick={() => setEditingNotes(true)}
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-white"
              style={{ color: notes ? "#8B8B8B" : "#3A3A3A" }}
            >
              <span>⇌</span>
              {notes || "Add notes here..."}
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
            <SetRow key={set.id} set={set} onUpdate={updateSet} />
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
            color: "#8B8B8B",
          }}
        >
          <Plus className="w-4 h-4" />
          Add Set
        </button>
        <button
          className="flex items-center justify-center gap-2 text-xs font-medium transition-colors hover:text-white"
          style={{ color: "#5A5A5A" }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Load from History
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
