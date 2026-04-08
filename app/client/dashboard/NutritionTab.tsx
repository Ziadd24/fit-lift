import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Apple, Camera, Loader2, Sparkles, Send, CheckCircle, AlertCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { useListCalorieLogs, useSaveCalorieLog } from "@/lib/api-hooks";
import { useNutritionRealtime } from "@/lib/use-nutrition-realtime";
import { CalorieMarkerCard } from "@/components/ui/CalorieMarkerCard";

const QUICK_FOODS = [
  { label: "Chicken 200g", text: "200g grilled chicken breast" },
  { label: "Eggs ×3", text: "3 boiled eggs" },
  { label: "Protein Shake", text: "1 scoop whey protein shake with milk" },
  { label: "Rice 1 cup", text: "1 cup cooked white rice" },
  { label: "Oats 80g", text: "80g oats with milk and banana" },
  { label: "Banana", text: "1 medium banana" },
];

// Horizontal macro bar
function MacroBar({ label, value, max, color, unit = "g" }: { label: string; value: number; max: number; color: string; unit?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: "#8B8B8B" }}>{label}</span>
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

export default function NutritionTab({ isPrivate, memberId }: { isPrivate: boolean; memberId?: number }) {
  const [meal, setMeal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState<any | null>(null);
  const { data: logs } = useListCalorieLogs(memberId);
  const log = logs || [];
  const { mutate: saveCalorieLog } = useSaveCalorieLog();
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logExpanded, setLogExpanded] = useState(false);

  useNutritionRealtime({ memberId });

  // Totals from today's logs
  const totals = log.reduce(
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

  const getMealCategory = (ts: number) => {
    const h = new Date(ts).getHours();
    if (h < 11) return "breakfast";
    if (h < 15) return "lunch";
    if (h < 20) return "dinner";
    return "snack";
  };

  const analyze = async () => {
    const trimmed = meal.trim();
    if (!trimmed && !image) return;
    setIsLoading(true);
    setError(null);
    setJustLogged(null);

    try {
      const res = await fetch("/api/calories/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal: trimmed, image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      saveCalorieLog(
        { meal: trimmed || "Photo Upload", result: data, category: getMealCategory(Date.now()) },
        {
          onSuccess: (saved) => {
            setJustLogged(saved);
            setMeal("");
            setImage(null);
          },
        }
      );
    } catch (err: any) {
      setError(err.message || "Failed to analyze meal.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Calorie + Macro Summary ── */}
      <div style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 38, fontWeight: 800, color: "#7CFC00", lineHeight: 1 }}>
            {remaining}
          </span>
          <span style={{ fontSize: 14, color: "#8B8B8B" }}>kcal remaining</span>
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
        <p style={{ fontSize: 13, color: "#8B8B8B", marginBottom: 14 }}>
          Describe what you ate or tap a suggestion below — AI calculates macros instantly.
        </p>

        {/* Quick food chips */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 4 }}
             className="no-scrollbar">
          {QUICK_FOODS.map(f => (
            <button
              key={f.label}
              className="food-chip"
              onClick={() => setMeal(f.text)}
            >
              {f.label}
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
              style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", color: "#8B8B8B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Camera size={16} />
            </button>
          </div>
        </div>

        {/* Full-width Analyze button */}
        <button
          onClick={analyze}
          disabled={isLoading || (!meal.trim() && !image)}
          style={{
            width: "100%", height: 52, borderRadius: 14, marginTop: 12,
            background: isLoading || (!meal.trim() && !image) ? "rgba(124,252,0,0.3)" : "#7CFC00",
            border: "none", color: "#000", fontWeight: 800,
            fontSize: 15, cursor: isLoading || (!meal.trim() && !image) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {isLoading
            ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</>
            : <><Sparkles size={17} /> Analyze & Log</>
          }
        </button>
      </div>

      {/* ── Result Card ── */}
      <AnimatePresence>
        {justLogged && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ background: "rgba(57,255,20,0.06)", border: "1px solid rgba(57,255,20,0.2)", borderRadius: 16, padding: 18 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>
                  ✅ {justLogged.result?.display_title ?? "Meal"} logged!
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#7CFC00" }}>
                  {justLogged.result?.totals?.calories} <span style={{ fontSize: 13, fontWeight: 400, color: "#8B8B8B" }}>kcal</span>
                </div>
              </div>
              <button onClick={() => setJustLogged(null)} style={{ background: "none", border: "none", color: "#5A5A5A", cursor: "pointer", padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <MacroBar label="Protein" value={justLogged.result?.totals?.protein || 0} max={100} color="#7CFC00" />
            <MacroBar label="Carbs"   value={justLogged.result?.totals?.carbs || 0}   max={150} color="#F59E0B" />
            <MacroBar label="Fat"     value={justLogged.result?.totals?.fat || 0}      max={60}  color="#8B5CF6" />
            {justLogged.result?.client_suggestion && (
              <div style={{ fontSize: 12, color: "#8B8B8B", marginTop: 10, fontStyle: "italic" }}>
                💡 {justLogged.result.client_suggestion}
              </div>
            )}
            <div style={{ fontSize: 12, color: "#39FF14", marginTop: 8 }}>🔄 Synced to coach dashboard</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Today's Food Log (collapsible) ── */}
      <div style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
        <button
          className="collapsible-trigger"
          onClick={() => setLogExpanded(!logExpanded)}
          style={{ padding: "16px 20px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Apple size={18} color="#7CFC00" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>Today's Food Log</span>
            {log.length > 0 && (
              <span style={{ fontSize: 11, background: "rgba(124,252,0,0.15)", color: "#7CFC00", borderRadius: 20, padding: "2px 10px", fontWeight: 700 }}>
                {log.length}
              </span>
            )}
          </div>
          {logExpanded ? <ChevronUp size={18} color="#8B8B8B" /> : <ChevronDown size={18} color="#8B8B8B" />}
        </button>

        <AnimatePresence>
          {logExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {log.length === 0 ? (
                  <div style={{ color: "#8B8B8B", textAlign: "center", padding: "30px 0", fontSize: 14 }}>
                    No meals logged yet. Use the form above! 🍽️
                  </div>
                ) : (
                  log.map((entry: any) => (
                    <CalorieMarkerCard key={entry.id} log={entry} mode="client" />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
