"use client";

import React, { useState, useEffect, useRef } from "react";
import { CoachLayout } from "@/components/layout/CoachLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Zap, Wheat, Droplets, Plus, Trash2, Clock,
  ChevronRight, Sparkles, Target, RotateCcw, CheckCircle,
  AlertCircle, Loader2, UtensilsCrossed, TrendingUp, Camera, X
} from "lucide-react";
import { useListCalorieLogs, useSaveCalorieLog, useDeleteCalorieLog, CalorieLog } from "@/lib/api-hooks";

/* ─── Types ─── */
interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodItem {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface AIResult {
  items: FoodItem[];
  totals: MacroTotals;
  confidence: "high" | "medium" | "low";
  notes: string;
}



/* ─── Helpers ─── */
function getMealCategory(ts: number): LogEntry["category"] {
  const h = new Date(ts).getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 20) return "dinner";
  return "snack";
}



/* ─── Animated Progress Ring ─── */
function MacroRing({
  label, value, goal, unit, color, icon: Icon,
}: {
  label: string; value: number; goal: number; unit: string;
  color: string; icon: React.ElementType;
}) {
  const pct = Math.min((value / goal) * 100, 100);
  const size = 110;
  const thickness = 8;
  const r = (size - thickness * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={thickness}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-4 h-4 mb-0.5" style={{ color }} />
          <span className="font-black text-white" style={{ fontSize: 15 }}>{value}</span>
          <span className="text-[9px]" style={{ color: "#5A5A5A" }}>{unit}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-white">{label}</p>
        <p className="text-[10px]" style={{ color: "#5A5A5A" }}>
          {value} / {goal}{unit}
        </p>
      </div>
    </div>
  );
}

/* ─── Confidence Badge ─── */
function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const cfg = {
    high:   { label: "High Accuracy", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
    medium: { label: "Estimated",     color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
    low:    { label: "Approximate",   color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  }[level];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ background: cfg.bg, color: cfg.color }}>
      {level === "high" ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
}

/* ─── Category Icon / Color ─── */
const categoryStyle = {
  breakfast: { label: "Breakfast ☀️",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  lunch:     { label: "Lunch 🌤️",      color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  dinner:    { label: "Dinner 🌙",     color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  snack:     { label: "Snack ⚡",      color: "#7CFC00", bg: "rgba(124,252,0,0.1)"  },
};

/* ─── Quick Example Meals ─── */
const EXAMPLES = [
  "Grilled chicken breast 200g with brown rice and salad",
  "2 scrambled eggs with whole wheat toast and orange juice",
  "Protein shake with banana and peanut butter",
  "Ful medames with olive oil and pita bread",
  "Large plate of pasta carbonara",
  "Koshari medium serving",
];

/* ════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════ */
export default function CaloriesPage() {
  const [meal, setMeal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: logs } = useListCalorieLogs();
  const log = logs || [];

  const { mutate: saveCalorieLog } = useSaveCalorieLog();
  const { mutate: deleteCalorieLog } = useDeleteCalorieLog();
  const [goals, setGoals] = useState({ calories: 2500, protein: 150, carbs: 300, fat: 80 });
  const [showGoals, setShowGoals] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totals: MacroTotals = log.reduce(
    (acc, e) => ({
      calories: acc.calories + e.result.totals.calories,
      protein:  acc.protein  + e.result.totals.protein,
      carbs:    acc.carbs    + e.result.totals.carbs,
      fat:      acc.fat      + e.result.totals.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const analyze = async () => {
    const trimmed = meal.trim();
    if (!trimmed && !image) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/calories/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal: trimmed, image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addToLog = () => {
    if (!result) return;
    saveCalorieLog({
      meal: meal.trim(),
      result,
      category: getMealCategory(Date.now()),
    }, {
      onSuccess: () => {
        setMeal("");
        setImage(null);
        setResult(null);
        textareaRef.current?.focus();
      }
    });
  };

  const deleteEntry = (id: string | number) => {
    deleteCalorieLog({ id: Number(id) });
  };

  const cardStyle = {
    background: "rgba(22,22,26,0.9)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  } as React.CSSProperties;

  return (
    <CoachLayout>
      <div style={{ fontFamily: "Inter, sans-serif" }}>

        {/* ── HEADER ── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7CFC00, #39FF14)", boxShadow: "0 0 20px rgba(124,252,0,0.4)" }}>
                <Flame className="w-5 h-5 text-black" />
              </div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">
                AI <span style={{ color: "#7CFC00" }}>Nutrition</span> Tracker
              </h1>
            </div>
            <p className="text-sm" style={{ color: "#8B8B8B", paddingLeft: 52 }}>
              Describe any meal — AI calculates calories &amp; macros instantly
            </p>
          </div>

          {/* Daily Budget Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl"
              style={{ background: "rgba(124,252,0,0.1)", border: "1px solid rgba(124,252,0,0.2)" }}>
              <Target className="w-4 h-4" style={{ color: "#7CFC00" }} />
              <span className="text-sm font-bold" style={{ color: "#7CFC00" }}>
                {totals.calories.toLocaleString()}
              </span>
              <span className="text-xs" style={{ color: "#5A5A5A" }}>/ {goals.calories.toLocaleString()} kcal</span>
            </div>
            <button onClick={() => setShowGoals(!showGoals)}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all"
              style={{ background: showGoals ? "rgba(124,252,0,0.15)" : "rgba(255,255,255,0.05)", color: showGoals ? "#7CFC00" : "#8B8B8B", border: "1px solid rgba(255,255,255,0.08)" }}>
              {showGoals ? "Hide Goals" : "Set Goals"}
            </button>
          </div>
        </div>

        {/* ── GOALS PANEL ── */}
        <AnimatePresence>
          {showGoals && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
              <div style={{ ...cardStyle, padding: 24 }}>
                <h3 className="font-bold text-white mb-5 text-sm uppercase tracking-widest">Daily Goals</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {([
                    { key: "calories", label: "Calories", unit: "kcal", min: 1200, max: 5000, step: 50, color: "#7CFC00" },
                    { key: "protein",  label: "Protein",  unit: "g",    min: 50,   max: 300,  step: 5,  color: "#8B5CF6" },
                    { key: "carbs",    label: "Carbs",    unit: "g",    min: 50,   max: 500,  step: 5,  color: "#F59E0B" },
                    { key: "fat",      label: "Fat",      unit: "g",    min: 20,   max: 200,  step: 5,  color: "#10B981" },
                  ] as const).map(({ key, label, unit, min, max, step, color }) => (
                    <div key={key}>
                      <div className="flex justify-between mb-2">
                        <label className="text-xs font-semibold text-white">{label}</label>
                        <span className="text-xs font-bold" style={{ color }}>{goals[key]}{unit}</span>
                      </div>
                      <input type="range" min={min} max={max} step={step}
                        value={goals[key]}
                        onChange={e => setGoals(g => ({ ...g, [key]: Number(e.target.value) }))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: color, background: `linear-gradient(to right, ${color} ${((goals[key]-min)/(max-min))*100}%, rgba(255,255,255,0.1) 0%)` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">

          {/* LEFT: AI Input (3 cols) */}
          <div className="xl:col-span-3 flex flex-col gap-5">

            {/* AI Input Card */}
            <div style={{ ...cardStyle, padding: 28 }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5" style={{ color: "#7CFC00" }} />
                <h2 className="font-bold text-white text-base">Describe Your Meal</h2>
              </div>

              {/* Textarea & Image */}
              <div className="relative mb-4">
                {image && (
                  <div className="absolute top-3 left-3 z-10 w-16 h-16 rounded-xl border-2 overflow-hidden group"
                       style={{ borderColor: "#7CFC00" }}>
                    <img src={image} alt="Upload preview" className="w-full h-full object-cover" />
                    <button onClick={() => setImage(null)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                )}
                
                <textarea
                  ref={textareaRef}
                  value={meal}
                  onChange={e => setMeal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) analyze(); }}
                  placeholder="e.g. Grilled salmon with quinoa and steamed broccoli... or snap a picture!"
                  rows={4}
                  className="w-full resize-none outline-none text-white placeholder-[#3A3A3A] rounded-2xl p-4 text-sm transition-all"
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    border: (meal.length > 0 || image) ? "1px solid rgba(124,252,0,0.3)" : "1px solid rgba(255,255,255,0.08)",
                    fontFamily: "Inter, sans-serif",
                    lineHeight: "1.6",
                    paddingLeft: image ? 90 : 16,
                  }}
                />
                
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  {(meal.length > 0 || image) && (
                    <button onClick={() => { setMeal(""); setImage(null); setResult(null); setError(null); }}
                      className="text-[#3A3A3A] hover:text-white transition-colors mr-2">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl transition-all hover:scale-105"
                    style={{ background: "rgba(124,252,0,0.1)", color: "#7CFC00" }}>
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Example chips */}
              <div className="flex flex-wrap gap-2 mb-5">
                {EXAMPLES.map(ex => (
                  <button key={ex} onClick={() => setMeal(ex)}
                    className="text-[11px] px-3 py-1.5 rounded-full transition-all hover:scale-105"
                    style={{ background: "rgba(124,252,0,0.08)", color: "#7CFC00", border: "1px solid rgba(124,252,0,0.15)", fontFamily: "Inter, sans-serif" }}>
                    {ex.split(" ").slice(0, 4).join(" ")}…
                  </button>
                ))}
              </div>

              {/* Analyze Button */}
              <button
                onClick={analyze}
                disabled={isLoading || (meal.trim().length < 3 && !image)}
                className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 font-black text-black transition-all text-sm uppercase tracking-wide"
                style={{
                  background: (meal.trim().length >= 3 || image) && !isLoading
                    ? "linear-gradient(135deg, #7CFC00, #39FF14)"
                    : "rgba(255,255,255,0.08)",
                  color: (meal.trim().length >= 3 || image) && !isLoading ? "#000" : "#3A3A3A",
                  boxShadow: (meal.trim().length >= 3 || image) && !isLoading ? "0 0 30px rgba(124,252,0,0.4)" : "none",
                  cursor: isLoading || (meal.trim().length < 3 && !image) ? "not-allowed" : "pointer",
                }}>
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing with AI…</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Analyze Meal (Ctrl+Enter)</>
                )}
              </button>
            </div>

            {/* AI Result Card */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 px-5 py-4 rounded-2xl"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              {result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  style={{ ...cardStyle, padding: 28, border: "1px solid rgba(124,252,0,0.2)", boxShadow: "0 0 40px rgba(124,252,0,0.08)" }}
                >
                  {/* Result Header */}
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" style={{ color: "#7CFC00" }} />
                      <h3 className="font-bold text-white text-base">Breakdown</h3>
                    </div>
                    <ConfidenceBadge level={result.confidence} />
                  </div>

                  {/* Macro Summary Row */}
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {[
                      { label: "Calories", value: result.totals.calories, unit: "kcal", color: "#7CFC00", bg: "rgba(124,252,0,0.1)" },
                      { label: "Protein",  value: result.totals.protein,  unit: "g",    color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
                      { label: "Carbs",    value: result.totals.carbs,    unit: "g",    color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
                      { label: "Fat",      value: result.totals.fat,      unit: "g",    color: "#10B981", bg: "rgba(16,185,129,0.1)" },
                    ].map(({ label, value, unit, color, bg }) => (
                      <div key={label} className="rounded-2xl p-3 text-center" style={{ background: bg }}>
                        <p className="font-black text-white text-xl">{value}</p>
                        <p className="text-[10px] font-semibold mt-0.5" style={{ color }}>{unit}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: "#5A5A5A" }}>{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Food Items List */}
                  <div className="space-y-2 mb-5">
                    {result.items.map((item, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                          <p className="text-[11px]" style={{ color: "#5A5A5A" }}>{item.amount}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-3">
                          <span className="text-xs font-bold" style={{ color: "#7CFC00" }}>{item.calories} kcal</span>
                          <div className="flex gap-1.5">
                            {[
                              { v: item.protein, c: "#8B5CF6", l: "P" },
                              { v: item.carbs,   c: "#F59E0B", l: "C" },
                              { v: item.fat,     c: "#10B981", l: "F" },
                            ].map(({ v, c, l }) => (
                              <span key={l} className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg"
                                style={{ background: `${c}18`, color: c }}>{v}g {l}</span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* AI Notes */}
                  {result.notes && (
                    <p className="text-xs italic mb-5 px-1" style={{ color: "#5A5A5A" }}>
                      💡 {result.notes}
                    </p>
                  )}

                  {/* Add to Log Button */}
                  <button onClick={addToLog}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-black text-black text-sm uppercase tracking-wide transition-all hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg, #7CFC00, #39FF14)", boxShadow: "0 0 24px rgba(124,252,0,0.35)" }}>
                    <Plus className="w-4 h-4" /> Add to Today&apos;s Log
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Macro Rings + Summary (2 cols) */}
          <div className="xl:col-span-2 flex flex-col gap-5">

            {/* Progress Rings */}
            <div style={{ ...cardStyle, padding: 28 }}>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4" style={{ color: "#7CFC00" }} />
                <h3 className="font-bold text-white text-sm uppercase tracking-widest">Today&apos;s Progress</h3>
              </div>
              <div className="grid grid-cols-2 gap-6 place-items-center">
                <MacroRing label="Calories" value={totals.calories} goal={goals.calories} unit="kcal" color="#7CFC00" icon={Flame} />
                <MacroRing label="Protein"  value={totals.protein}  goal={goals.protein}  unit="g"    color="#8B5CF6" icon={Zap} />
                <MacroRing label="Carbs"    value={totals.carbs}    goal={goals.carbs}    unit="g"    color="#F59E0B" icon={Wheat} />
                <MacroRing label="Fat"      value={totals.fat}      goal={goals.fat}      unit="g"    color="#10B981" icon={Droplets} />
              </div>

              {/* Calorie Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-[11px] mb-2">
                  <span style={{ color: "#8B8B8B" }}>Calorie Budget</span>
                  <span className="font-bold" style={{ color: totals.calories > goals.calories ? "#EF4444" : "#7CFC00" }}>
                    {Math.max(goals.calories - totals.calories, 0)} remaining
                  </span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 8, background: "rgba(255,255,255,0.06)" }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((totals.calories / goals.calories) * 100, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{
                      background: totals.calories > goals.calories
                        ? "linear-gradient(90deg, #EF4444, #DC2626)"
                        : "linear-gradient(90deg, #7CFC00, #39FF14)",
                      boxShadow: totals.calories > goals.calories
                        ? "0 0 10px rgba(239,68,68,0.5)"
                        : "0 0 10px rgba(124,252,0,0.5)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ ...cardStyle, padding: 24 }}>
              <h3 className="font-bold text-white text-sm uppercase tracking-widest mb-4">Macro Split</h3>
              {[
                { label: "Protein",   pct: totals.calories > 0 ? Math.round((totals.protein  * 4 / totals.calories) * 100) : 0, color: "#8B5CF6" },
                { label: "Carbs",     pct: totals.calories > 0 ? Math.round((totals.carbs    * 4 / totals.calories) * 100) : 0, color: "#F59E0B" },
                { label: "Fat",       pct: totals.calories > 0 ? Math.round((totals.fat      * 9 / totals.calories) * 100) : 0, color: "#10B981" },
              ].map(({ label, pct, color }) => (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="font-semibold text-white">{label}</span>
                    <span className="font-bold" style={{ color }}>{pct}%</span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: 5, background: "rgba(255,255,255,0.06)" }}>
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FOOD LOG ── */}
        <div style={{ ...cardStyle, overflow: "hidden" }}>
          <div className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="w-5 h-5" style={{ color: "#7CFC00" }} />
              <h2 className="font-bold text-white uppercase tracking-wide">Today&apos;s Food Log</h2>
              <span className="font-bold text-xs px-2.5 py-0.5 rounded-full text-black"
                style={{ background: "#7CFC00" }}>{log.length}</span>
            </div>
            {log.length > 0 && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "#8B8B8B" }}>
                <Flame className="w-4 h-4" style={{ color: "#7CFC00" }} />
                <span className="font-bold text-white">{totals.calories.toLocaleString()}</span> kcal total
              </div>
            )}
          </div>

          {log.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <UtensilsCrossed className="w-12 h-12 mb-4 opacity-20 text-white" />
              <p className="font-bold text-white mb-1">No meals logged yet</p>
              <p className="text-sm" style={{ color: "#5A5A5A" }}>
                Describe a meal above and click &quot;Add to Today&apos;s Log&quot;
              </p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {log.map((entry) => {
                  const cat = categoryStyle[entry.category as keyof typeof categoryStyle];
                  return (
                    <motion.div key={entry.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-2xl p-4 relative group"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>

                      {/* Category + Time */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: cat.bg, color: cat.color }}>
                          {cat.label}
                        </span>
                        <div className="flex items-center gap-1.5" style={{ color: "#5A5A5A" }}>
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px]">
                            {new Date(entry.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      {/* Meal description */}
                      <p className="text-sm font-semibold text-white mb-3 leading-relaxed line-clamp-2">
                        {entry.meal}
                      </p>

                      {/* Macro chips */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                          style={{ background: "rgba(124,252,0,0.12)", color: "#7CFC00" }}>
                          {entry.result.totals.calories} kcal
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                          style={{ background: "rgba(139,92,246,0.12)", color: "#8B5CF6" }}>
                          P {entry.result.totals.protein}g
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                          style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>
                          C {entry.result.totals.carbs}g
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                          style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}>
                          F {entry.result.totals.fat}g
                        </span>
                      </div>

                      <ConfidenceBadge level={entry.result.confidence} />

                      {/* Delete */}
                      <button onClick={() => deleteEntry(entry.id)}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                        style={{ background: "rgba(239,68,68,0.15)" }}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </CoachLayout>
  );
}
