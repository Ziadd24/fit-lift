import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Apple, Camera, Loader2, Sparkles, Send, CheckCircle, AlertCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { useListCalorieLogs, useSaveCalorieLog } from "@/lib/api-hooks";
import { useNutritionRealtime } from "@/lib/use-nutrition-realtime";
import { CalorieMarkerCard } from "@/components/ui/CalorieMarkerCard";
import { SECONDARY_TEXT_COLOR, TOUCH_TARGET_SIZE } from "@/lib/accessibility";
import { LazyRenderSection, SkeletonBlock, useDashboardMotion } from "@/lib/performance";
import { getErrorMessage } from "@/lib/feedback";
import { toast } from "react-hot-toast";

const QUICK_FOODS = [
  { label: "Chicken 200g", text: "200g grilled chicken breast" },
  { label: "Eggs ×3", text: "3 boiled eggs" },
  { label: "Protein Shake", text: "1 scoop whey protein shake with milk" },
  { label: "Rice 1 cup", text: "1 cup cooked white rice" },
  { label: "Oats 80g", text: "80g oats with milk and banana" },
  { label: "Banana", text: "1 medium banana" },
];

const DEMO_LOGS = [
  {
    id: "demo-breakfast",
    meal: "Greek yogurt bowl with berries and honey",
    category: "breakfast",
    created_at: new Date().setHours(8, 0, 0, 0),
    result: {
      display_title: "Greek yogurt bowl",
      totals: { calories: 420, protein: 28, carbs: 42, fat: 12 },
    },
  },
  {
    id: "demo-lunch",
    meal: "Chicken rice bowl with vegetables",
    category: "lunch",
    created_at: new Date().setHours(13, 0, 0, 0),
    result: {
      display_title: "Chicken rice bowl",
      totals: { calories: 610, protein: 44, carbs: 58, fat: 18 },
    },
  },
  {
    id: "demo-dinner",
    meal: "Salmon, potatoes, and salad",
    category: "dinner",
    created_at: new Date().setHours(19, 0, 0, 0),
    result: {
      display_title: "Salmon plate",
      totals: { calories: 540, protein: 39, carbs: 36, fat: 22 },
    },
  },
];

const FAVORITE_FOODS = ["Chicken 200g", "Protein Shake", "Rice 1 cup", "Banana"];
const PORTION_MULTIPLIERS = [0.5, 1, 1.5, 2];

function getFriendlyNutritionError(error: unknown) {
  const fallback = "Failed to analyze meal.";
  const message = typeof error === "string"
    ? error
    : error instanceof Error
      ? error.message
      : fallback;
  const normalized = message.toLowerCase();

  if (
    normalized.includes("503") ||
    normalized.includes("service unavailable") ||
    normalized.includes("high demand") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("temporarily busy") ||
    normalized.includes("ai error")
  ) {
    return "AI meal analysis is temporarily busy right now. Please try again in a minute.";
  }

  return message || fallback;
}

function NutritionSummarySkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
        <SkeletonBlock width={120} height={42} />
        <div style={{ marginTop: 16 }}>
          <SkeletonBlock width="100%" height={10} radius={999} />
          <SkeletonBlock width="100%" height={10} radius={999} style={{ marginTop: 12 }} />
          <SkeletonBlock width="100%" height={10} radius={999} style={{ marginTop: 12 }} />
        </div>
      </div>
      <div style={{ background: "rgba(124,252,0,0.05)", border: "1px solid rgba(124,252,0,0.2)", borderRadius: 16, padding: 20 }}>
        <SkeletonBlock width={140} height={18} />
        <SkeletonBlock width="100%" height={110} style={{ marginTop: 16 }} />
        <SkeletonBlock width="100%" height={52} style={{ marginTop: 12 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBlock key={index} width="100%" height={112} style={{ background: "#16161A" }} />
        ))}
      </div>
    </div>
  );
}

// Horizontal macro bar
function MacroBar({ label, value, max, color, unit = "g" }: { label: string; value: number; max: number; color: string; unit?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: SECONDARY_TEXT_COLOR }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}{unit}</span>
      </div>
      <div className="macro-bar-track">
        <motion.div
          className="macro-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

// Meal Section Component
function MealSection({
  title,
  icon,
  meals,
  color,
  expanded,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  meals: any[];
  color: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sectionId = `meal-section-${title.toLowerCase()}`;

  if (meals.length === 0) return null;

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.result?.totals?.calories || 0), 0);

  return (
    <div className="bg-[#16161A] border border-white/5 rounded-xl p-4 mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-3"
        aria-expanded={expanded}
        aria-controls={sectionId}
        aria-label={`${title} meals, ${meals.length} entries, ${totalCalories} calories`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
            {icon}
          </div>
          <div>
            <h3 className="text-white font-medium text-left">{title}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm">{meals.length} meals • {totalCalories} kcal</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} color="var(--color-text-secondary)" /> : <ChevronDown size={20} color="var(--color-text-secondary)" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3"
          >
            {meals.map((meal, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-white text-sm font-medium">{meal.meal}</p>
                  <span className="text-[#7CFC00] text-sm font-bold">
                    {meal.result?.totals?.calories || 0} kcal
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-[var(--color-text-secondary)]">
                  <span>P: {meal.result?.totals?.protein || 0}g</span>
                  <span>C: {meal.result?.totals?.carbs || 0}g</span>
                  <span>F: {meal.result?.totals?.fat || 0}g</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NutritionTab({ isPrivate, memberId, demoMode = false }: { isPrivate: boolean; memberId?: number; demoMode?: boolean }) {
  const [meal, setMeal] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState<any | null>(null);
  const [quickFoodTab, setQuickFoodTab] = useState<"recent" | "favorites">("recent");
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [showAllMeals, setShowAllMeals] = useState(false);
  const [expandedMealSection, setExpandedMealSection] = useState("breakfast");
  const { data: logs, isLoading: logsLoading } = useListCalorieLogs(memberId);
  const resolvedLogs = logs && logs.length > 0 ? logs : demoMode ? DEMO_LOGS : [];
  const { mutate: saveCalorieLog } = useSaveCalorieLog();
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logExpanded, setLogExpanded] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const { disableHeavyAnimations } = useDashboardMotion();

  useNutritionRealtime({ memberId });

  // Totals from today's logs
  const totals = resolvedLogs.reduce(
    (acc: any, entry: any) => ({
      calories: acc.calories + (entry.result?.totals?.calories || 0),
      protein: acc.protein + (entry.result?.totals?.protein || 0),
      carbs: acc.carbs + (entry.result?.totals?.carbs || 0),
      fat: acc.fat + (entry.result?.totals?.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const GOALS = { calories: 2200, protein: 180, carbs: 220, fat: 70 };
  const remaining = Math.max(0, GOALS.calories - totals.calories);
  const recentQuickFoods = useMemo(() => {
    const recentMeals = resolvedLogs
      .slice()
      .sort((a: any, b: any) => (b.created_at || 0) - (a.created_at || 0))
      .map((entry: any) => ({ label: entry.result?.display_title ?? entry.meal, text: entry.meal }))
      .filter((entry: { label: string; text: string }, index: number, array: { label: string; text: string }[]) =>
        array.findIndex((candidate) => candidate.text === entry.text) === index
      );

    return [...recentMeals, ...QUICK_FOODS]
      .filter((entry, index, array) => array.findIndex((candidate) => candidate.label === entry.label) === index)
      .slice(0, 6);
  }, [resolvedLogs]);
  const favoriteQuickFoods = useMemo(
    () => QUICK_FOODS.filter((entry) => FAVORITE_FOODS.includes(entry.label)),
    []
  );

  const getMealCategory = (ts: number) => {
    const h = new Date(ts).getHours();
    if (h < 11) return "breakfast";
    if (h < 15) return "lunch";
    if (h < 20) return "dinner";
    return "snack";
  };

  const mealsByCategory = useMemo(() => resolvedLogs.reduce((acc: any, entry: any) => {
    const category = entry.category || getMealCategory(entry.created_at || Date.now());
    if (!acc[category]) acc[category] = [];
    acc[category].push(entry);
    return acc;
  }, { breakfast: [], lunch: [], dinner: [], snack: [] }), [resolvedLogs]);
  const currentMealCategory = useMemo(() => getMealCategory(Date.now()), []);
  const quickFoodsToRender = quickFoodTab === "favorites" ? favoriteQuickFoods : recentQuickFoods;
  const adjustedJustLoggedTotals = justLogged
    ? {
        calories: Math.round((justLogged.result?.totals?.calories || 0) * portionMultiplier),
        protein: Math.round((justLogged.result?.totals?.protein || 0) * portionMultiplier),
        carbs: Math.round((justLogged.result?.totals?.carbs || 0) * portionMultiplier),
        fat: Math.round((justLogged.result?.totals?.fat || 0) * portionMultiplier),
      }
    : null;

  useEffect(() => {
    setPortionMultiplier(1);
  }, [justLogged?.id, justLogged?.created_at]);

  useEffect(() => {
    if (!showAllMeals) {
      setExpandedMealSection(currentMealCategory);
    }
  }, [currentMealCategory, showAllMeals]);

  const analyze = async () => {
    const trimmed = meal.trim();
    if (!trimmed && !image) return;
    setIsAnalyzing(true);
    setError(null);
    setJustLogged(null);
    setLiveAnnouncement("Analyzing meal entry.");

    try {
      const res = await fetch("/api/calories/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal: trimmed, image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(getFriendlyNutritionError(data.error || "Analysis failed"));

      saveCalorieLog(
        { member_id: memberId, meal: trimmed || "Photo Upload", result: data, category: getMealCategory(Date.now()) },
        {
          onSuccess: (saved) => {
            setJustLogged(saved);
            setMeal("");
            setImage(null);
            setShowAllMeals(false);
            setExpandedMealSection(saved.category || getMealCategory(Date.now()));
            setLiveAnnouncement(`${saved.result?.display_title ?? "Meal"} logged successfully.`);
            toast.success(`${saved.result?.display_title ?? "Meal"} logged.`);
          },
          onError: (error) => {
            const message = getErrorMessage(error, "Couldn't save that meal.");
            setError(message);
            setLiveAnnouncement(message);
          },
        }
      );
    } catch (err: any) {
      const message = getFriendlyNutritionError(err);
      setError(message);
      setLiveAnnouncement(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (logsLoading) {
    return <NutritionSummarySkeleton />;
  }

  return (
    <div className={disableHeavyAnimations ? "reduced-motion" : undefined} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{liveAnnouncement}</div>
      {demoMode && (!logs || logs.length === 0) && (
        <div
          style={{
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.24)",
            borderRadius: 14,
            padding: "12px 14px",
            color: "#E9D5FF",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Demo preview: sample meals are shown so first-time clients can see what a complete nutrition day looks like.
        </div>
      )}

      {/* ── Calorie + Macro Summary ── */}
      <div style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 38, fontWeight: 800, color: "#7CFC00", lineHeight: 1 }}>
            {remaining}
          </span>
          <span style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>kcal remaining</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#5A5A5A" }}>
            {totals.calories} / {GOALS.calories}
          </span>
        </div>
        <MacroBar label="Protein" value={totals.protein} max={GOALS.protein} color="#7CFC00" />
        <MacroBar label="Carbs"   value={totals.carbs}   max={GOALS.carbs}   color="#F59E0B" />
        <MacroBar label="Fat"     value={totals.fat}     max={GOALS.fat}     color="#8B5CF6" />
      </div>

      {/* ── Log a Meal ── */}
      <div style={{ background: "rgba(124,252,0,0.05)", border: "1px solid rgba(124,252,0,0.2)", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Sparkles size={17} color="#7CFC00" />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>Log a Meal</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 14 }}>
          Describe what you ate or tap a suggestion below — AI calculates macros instantly.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { key: "recent", label: "Recent" },
              { key: "favorites", label: "Favorites" },
            ].map((tab) => {
              const isActive = quickFoodTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setQuickFoodTab(tab.key as "recent" | "favorites")}
                  style={{
                    minHeight: 40,
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: isActive ? "1px solid rgba(124,252,0,0.2)" : "1px solid rgba(255,255,255,0.08)",
                    background: isActive ? "rgba(124,252,0,0.12)" : "rgba(255,255,255,0.04)",
                    color: isActive ? "#D9FFBF" : "var(--color-text-secondary)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  aria-pressed={isActive}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Scan food photo with AI"
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: "rgba(124,252,0,0.12)",
              border: "1px solid rgba(124,252,0,0.24)",
              color: "#7CFC00",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 56,
              minHeight: 56,
            }}
          >
            <Camera size={22} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 8,
            marginBottom: 8,
          }}
        >
          {quickFoodsToRender.map((food) => (
            <button
              key={food.label}
              className="food-chip"
              onClick={() => setMeal(food.text)}
              aria-label={`Use quick food ${food.label}`}
              style={{
                minHeight: 48,
                width: "100%",
                whiteSpace: "normal",
                lineHeight: 1.25,
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              {food.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#EF4444", fontSize: 13, marginBottom: 12, background: "rgba(239,68,68,0.08)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Input area */}
        <div style={{ position: "relative" }}>
          {image && (
            <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, width: 44, height: 44, borderRadius: 10, overflow: "hidden", border: "2px solid #7CFC00" }}>
              <img src={image} alt="Upload" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                onClick={() => setImage(null)}
                aria-label="Remove selected meal photo"
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}
              >
                <X size={13} color="white" />
              </button>
            </div>
          )}
          <textarea
            value={meal}
            onChange={e => setMeal(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) analyze(); }}
            placeholder="e.g. 200g grilled chicken with 1 cup brown rice..."
            aria-label="Describe your meal for AI analysis"
            style={{
              width: "100%", height: 110,
              background: "#16161A",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: 14,
              paddingLeft: image ? 68 : 14,
              color: "#FFFFFF", fontSize: 15,
              resize: "none", outline: "none",
              fontFamily: "'Inter', sans-serif",
              boxSizing: "border-box",
            }}
          />
          <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", gap: 6 }}>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: "none" }} capture="environment" />
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload a meal photo for AI analysis"
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: "rgba(124,252,0,0.12)",
                border: "1px solid rgba(124,252,0,0.24)",
                color: "#7CFC00",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 56,
                minHeight: 56,
              }}
            >
              <Camera size={22} />
            </button>
          </div>
        </div>

        {/* Full-width Analyze button */}
        <button
          onClick={analyze}
          disabled={isAnalyzing || (!meal.trim() && !image)}
          aria-label={isAnalyzing ? "Analyzing meal entry" : "Analyze and log meal"}
          style={{
            width: "100%", height: 52, borderRadius: 14, marginTop: 12,
            background: isAnalyzing || (!meal.trim() && !image) ? "rgba(124,252,0,0.3)" : "#7CFC00",
            border: "none", color: "#000", fontWeight: 800,
            fontSize: 15, cursor: isAnalyzing || (!meal.trim() && !image) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {isAnalyzing
            ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</>
            : <><Sparkles size={17} /> Analyze & Log</>
          }
        </button>
      </div>

      {/* ── Result Card ── */}
      <AnimatePresence>
        {justLogged && (
          <motion.div
            initial={disableHeavyAnimations ? false : { opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: disableHeavyAnimations ? 0 : 0.2 }}
            style={{ background: "rgba(57,255,20,0.06)", border: "1px solid rgba(57,255,20,0.2)", borderRadius: 16, padding: 18, minHeight: 172 }}
            role="status"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>
                  ✅ {justLogged.result?.display_title ?? "Meal"} logged!
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#7CFC00" }}>
                  {adjustedJustLoggedTotals?.calories ?? justLogged.result?.totals?.calories} <span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-text-secondary)" }}>kcal</span>
                </div>
              </div>
              <button onClick={() => setJustLogged(null)} style={{ background: "none", border: "none", color: "#5A5A5A", cursor: "pointer", padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {PORTION_MULTIPLIERS.map((multiplier) => {
                const isActive = portionMultiplier === multiplier;
                return (
                  <button
                    key={multiplier}
                    type="button"
                    onClick={() => setPortionMultiplier(multiplier)}
                    style={{
                      minHeight: 36,
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: isActive ? "1px solid rgba(124,252,0,0.22)" : "1px solid rgba(255,255,255,0.08)",
                      background: isActive ? "rgba(124,252,0,0.12)" : "rgba(255,255,255,0.04)",
                      color: isActive ? "#D9FFBF" : "var(--color-text-secondary)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    aria-pressed={isActive}
                    aria-label={`Adjust portion to ${multiplier} times`}
                  >
                    x{multiplier}
                  </button>
                );
              })}
            </div>
            <MacroBar label="Protein" value={adjustedJustLoggedTotals?.protein || 0} max={100} color="#7CFC00" />
            <MacroBar label="Carbs"   value={adjustedJustLoggedTotals?.carbs || 0}   max={150} color="#F59E0B" />
            <MacroBar label="Fat"     value={adjustedJustLoggedTotals?.fat || 0}      max={60}  color="#8B5CF6" />
            {justLogged.result?.client_suggestion && (
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 10, fontStyle: "italic" }}>
                💡 {justLogged.result.client_suggestion}
              </div>
            )}
            <div style={{ fontSize: 12, color: "#39FF14", marginTop: 8 }}>🔄 Synced to coach dashboard</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Meal Breakdown Sections ── */}
      <LazyRenderSection
        minHeight={420}
        fallback={
          <div className="space-y-4">
            <SkeletonBlock width={130} height={24} />
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} width="100%" height={112} style={{ background: "#16161A" }} />
            ))}
          </div>
        }
      >
      <div className="space-y-4">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 className="text-white text-lg font-bold mb-0">Today's Meals</h2>
          <button
            type="button"
            onClick={() => setShowAllMeals((value) => !value)}
            style={{
              minHeight: 40,
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.08)",
              background: showAllMeals ? "rgba(124,252,0,0.12)" : "rgba(255,255,255,0.04)",
              color: showAllMeals ? "#D9FFBF" : "var(--color-text-secondary)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
            aria-pressed={showAllMeals}
          >
            {showAllMeals ? "Show Current Meal" : "See All Meals"}
          </button>
        </div>
        <MealSection
          title="Breakfast"
          icon={<Apple size={16} color="#F59E0B" />}
          meals={mealsByCategory.breakfast}
          color="#F59E0B"
          expanded={showAllMeals || expandedMealSection === "breakfast"}
          onToggle={() => setExpandedMealSection((current) => current === "breakfast" && !showAllMeals ? "" : "breakfast")}
        />
        <MealSection
          title="Lunch"
          icon={<Apple size={16} color="#7CFC00" />}
          meals={mealsByCategory.lunch}
          color="#7CFC00"
          expanded={showAllMeals || expandedMealSection === "lunch"}
          onToggle={() => setExpandedMealSection((current) => current === "lunch" && !showAllMeals ? "" : "lunch")}
        />
        <MealSection
          title="Dinner"
          icon={<Apple size={16} color="#8B5CF6" />}
          meals={mealsByCategory.dinner}
          color="#8B5CF6"
          expanded={showAllMeals || expandedMealSection === "dinner"}
          onToggle={() => setExpandedMealSection((current) => current === "dinner" && !showAllMeals ? "" : "dinner")}
        />
        <MealSection
          title="Snacks"
          icon={<Apple size={16} color="#10B981" />}
          meals={mealsByCategory.snack}
          color="#10B981"
          expanded={showAllMeals || expandedMealSection === "snack"}
          onToggle={() => setExpandedMealSection((current) => current === "snack" && !showAllMeals ? "" : "snack")}
        />

        {resolvedLogs.length === 0 && (
          <div className="bg-[#16161A] border border-white/5 rounded-xl p-8 text-center">
            <Apple size={32} color="var(--color-text-secondary)" className="mx-auto mb-3" />
            <p className="text-[var(--color-text-secondary)] text-sm">
              Your nutrition log is empty for now. Start with one meal above and the dashboard will build your daily picture automatically.
            </p>
          </div>
        )}
      </div>
      </LazyRenderSection>
    </div>
  );
}
