"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle, AlertCircle, HelpCircle, Flame, Zap, Wheat, Droplets,
  CheckCheck, Edit3, MessageSquare, Clock, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import type { CalorieLog } from "@/lib/api-hooks";

/* ─── Meal Emoji Map ──────────────────────────────────────────────────── */
const MEAL_EMOJI: Record<string, string> = {
  breakfast: "🥞",
  lunch: "🥗",
  dinner: "🍗",
  snack: "⚡",
  pre_workout: "🍌",
  post_workout: "🥤",
};

/* ─── Confidence helpers ─────────────────────────────────────────────── */
function getConfidenceColor(score: number) {
  if (score >= 90) return "#39FF14";
  if (score >= 70) return "#FFD700";
  return "#FF4444";
}

function ConfidenceBadge({ score }: { score: number }) {
  const color = getConfidenceColor(score);
  const Icon = score >= 90 ? CheckCircle : score >= 70 ? HelpCircle : AlertCircle;
  const label = score >= 90 ? "Verified" : score >= 70 ? "Estimated" : "Uncertain";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ background: `${color}18`, color }}
    >
      <Icon className="w-3 h-3" />
      {label} {score}%
    </span>
  );
}

/* ─── Macro Bar ──────────────────────────────────────────────────────── */
function MacroBar({
  label, value, max, color,
}: {
  label: string; value: number; max: number; color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold w-3" style={{ color }}>{label[0]}</span>
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: "rgba(255,255,255,0.08)" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ background: color }}
        />
      </div>
      <span className="text-[10px] font-bold text-white w-8 text-right">{value}g</span>
    </div>
  );
}

/* ─── CalorieMarkerCard Props ─────────────────────────────────────────── */
interface CalorieMarkerCardProps {
  log: CalorieLog;
  /** "coach" shows verify/edit/comment buttons. "client" shows suggestion + verified badge. */
  mode: "coach" | "client";
  /** Coach name for comments */
  coachName?: string;
  onVerify?: (id: number, note?: string) => void;
  onEdit?: (log: CalorieLog) => void;
  isVerifying?: boolean;
  /** Show as compact (for feed / roster) */
  compact?: boolean;
}

export function CalorieMarkerCard({
  log,
  mode,
  coachName,
  onVerify,
  onEdit,
  isVerifying,
  compact = false,
}: CalorieMarkerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [commentMode, setCommentMode] = useState(false);
  const [commentText, setCommentText] = useState("");

  const r = log.result;
  const score = r.confidence_score ?? (r.confidence === "high" ? 92 : r.confidence === "medium" ? 77 : 55);
  const accentColor = getConfidenceColor(score);
  const mealType = r.meal_type ?? log.category;
  const emoji = MEAL_EMOJI[mealType] ?? "🍽️";
  const title = r.display_title ?? log.meal?.slice(0, 25) ?? "Logged Meal";
  const totals = r.totals;
  const verified = log.verified_status;
  const timeStr = new Date(log.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleVerify = () => {
    if (commentMode) {
      onVerify?.(log.id, commentText || undefined);
      setCommentMode(false);
      setCommentText("");
    } else {
      onVerify?.(log.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: "rgba(22,22,26,0.95)",
        border: `1px solid rgba(255,255,255,0.07)`,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 16,
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 p-4">
        <span style={{ fontSize: compact ? 20 : 24 }}>{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white truncate" style={{ fontSize: compact ? 13 : 15 }}>
              {title}
            </span>
            {verified === "verified" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(57,255,20,0.12)", color: "#39FF14" }}>
                <CheckCheck className="w-3 h-3" /> Coach Verified
              </span>
            )}
            {verified === "edited" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(255,215,0,0.12)", color: "#FFD700" }}>
                <Edit3 className="w-3 h-3" /> Coach Edited
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock className="w-3 h-3" style={{ color: "#5A5A5A" }} />
            <span className="text-[11px]" style={{ color: "#5A5A5A" }}>{timeStr}</span>
            {log.member_name && mode === "coach" && (
              <span className="text-[11px]" style={{ color: "#8B8B8B" }}>· {log.member_name}</span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-black text-white" style={{ fontSize: compact ? 16 : 20 }}>{totals.calories}</div>
          <div className="text-[10px]" style={{ color: "#5A5A5A" }}>kcal</div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="ml-1 text-gray-500 hover:text-white transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Macro Bars ── */}
      <div className="px-4 pb-3 flex flex-col gap-1.5">
        <MacroBar label="Protein" value={totals.protein} max={200} color="#8B5CF6" />
        <MacroBar label="Carbs" value={totals.carbs} max={300} color="#F59E0B" />
        <MacroBar label="Fat" value={totals.fat} max={100} color="#10B981" />
      </div>

      {/* ── Confidence + Bottom row ── */}
      <div className="flex items-center justify-between px-4 pb-3">
        <ConfidenceBadge score={score} />
        {mode === "client" && r.client_suggestion && verified !== "verified" && (
          <span className="text-[11px] italic" style={{ color: "#8B8B8B" }}>
            💡 {r.client_suggestion}
          </span>
        )}
      </div>

      {/* ── Expanded: food items + portion analysis ── */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 pb-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {r.portion_analysis && (
            <p className="text-[11px] mt-3 mb-2" style={{ color: "#8B8B8B" }}>
              📏 {r.portion_analysis}
            </p>
          )}
          {r.items && r.items.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-2">
              {r.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div>
                    <span className="text-xs font-semibold text-white">{item.name}</span>
                    <span className="text-[10px] ml-2" style={{ color: "#5A5A5A" }}>{item.grams}g</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold" style={{ color: "#7CFC00" }}>{item.calories} kcal</span>
                    <span className="text-[10px]" style={{ color: "#8B5CF6" }}>P{item.protein}</span>
                    <span className="text-[10px]" style={{ color: "#F59E0B" }}>C{item.carbs}</span>
                    <span className="text-[10px]" style={{ color: "#10B981" }}>F{item.fat}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {r.notes && (
            <p className="text-[11px] mt-3 italic" style={{ color: "#5A5A5A" }}>💡 {r.notes}</p>
          )}
          {log.coach_note && (
            <p className="text-xs mt-2 px-3 py-2 rounded-xl" style={{ background: "rgba(57,255,20,0.06)", color: "#7CFC00", border: "1px solid rgba(57,255,20,0.15)" }}>
              🎯 Coach: {log.coach_note}
            </p>
          )}
        </motion.div>
      )}

      {/* ── Coach Action Buttons ── */}
      {mode === "coach" && verified === "pending" && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {commentMode ? (
            <div className="p-3 flex flex-col gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a coach note (optional)..."
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "Inter, sans-serif" }}
              />
              <div className="flex gap-2">
                <button onClick={handleVerify} disabled={isVerifying}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{ background: "rgba(57,255,20,0.15)", color: "#39FF14", border: "1px solid rgba(57,255,20,0.25)" }}>
                  {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                  Verify + Send Note
                </button>
                <button onClick={() => setCommentMode(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#8B8B8B" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex">
              <button onClick={handleVerify} disabled={isVerifying}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all hover:bg-white/5"
                style={{ color: "#39FF14", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                Verify
              </button>
              <button onClick={() => onEdit?.(log)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all hover:bg-white/5"
                style={{ color: "#F59E0B", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => setCommentMode(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all hover:bg-white/5"
                style={{ color: "#8B5CF6" }}>
                <MessageSquare className="w-3.5 h-3.5" /> Comment
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
