import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Apple, Camera, Loader2, Sparkles, Send, CheckCircle, AlertCircle, X } from "lucide-react";
import { useListCalorieLogs, useSaveCalorieLog } from "@/lib/api-hooks";
import { useNutritionRealtime } from "@/lib/use-nutrition-realtime";
import { CalorieMarkerCard } from "@/components/ui/CalorieMarkerCard";

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

  // Subscribe to realtime updates — client sees coach verifications instantly
  useNutritionRealtime({ memberId });

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
        {
          meal: trimmed || "Photo Upload",
          result: data,
          category: getMealCategory(Date.now()),
        },
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
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Apple size={24} color="#7CFC00" />
        <span style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>Nutrition & Diet</span>
      </div>

      {/* Log a Meal Card */}
      <div style={{ background: "rgba(124,252,0,0.05)", border: "1px solid rgba(124,252,0,0.2)", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Sparkles size={18} color="#7CFC00" />
          <span style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF" }}>Log a Meal</span>
        </div>
        <p style={{ fontSize: 13, color: "#8B8B8B", marginBottom: 16 }}>
          Describe what you ate or upload a photo — AI calculates the macros and syncs with your coach instantly.
        </p>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#EF4444", fontSize: 13, marginBottom: 12, background: "rgba(239,68,68,0.08)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div style={{ position: "relative" }}>
          {image && (
            <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, width: 48, height: 48, borderRadius: 10, overflow: "hidden", border: "2px solid #7CFC00" }}>
              <img src={image} alt="Upload" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                onClick={() => setImage(null)}
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", opacity: 0, transition: "opacity 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
              >
                <X size={14} color="white" />
              </button>
            </div>
          )}
          <textarea
            value={meal}
            onChange={(e) => setMeal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) analyze(); }}
            placeholder="e.g. 200g grilled chicken with 1 cup brown rice and salad..."
            style={{
              width: "100%", height: 100,
              background: "#16161A",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: 16,
              paddingLeft: image ? 72 : 16,
              color: "#FFFFFF", fontSize: 14,
              resize: "none", outline: "none",
              fontFamily: "'Inter', sans-serif",
              boxSizing: "border-box",
            }}
          />
          <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", gap: 8 }}>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: "none" }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "none", color: "#8B8B8B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Camera size={16} />
            </button>
            <button
              onClick={analyze}
              disabled={isLoading || (!meal.trim() && !image)}
              style={{ height: 36, padding: "0 16px", borderRadius: 18, background: "#7CFC00", border: "none", color: "#000", fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Log Meal</>}
            </button>
          </div>
        </div>
      </div>

      {/* AI Confirmation Card */}
      <AnimatePresence>
        {justLogged && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ background: "rgba(57,255,20,0.06)", border: "1px solid rgba(57,255,20,0.2)", borderRadius: 16, padding: 16, display: "flex", alignItems: "flex-start", gap: 12 }}
          >
            <CheckCircle size={20} color="#39FF14" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "#FFFFFF", marginBottom: 4 }}>
                ✅ {justLogged.result?.display_title ?? "Meal"} logged!
              </div>
              <div style={{ fontSize: 13, color: "#8B8B8B" }}>
                {justLogged.result?.totals?.calories} kcal · {justLogged.result?.totals?.protein}g P · {justLogged.result?.totals?.carbs}g C · {justLogged.result?.totals?.fat}g F
              </div>
              <div style={{ fontSize: 12, color: "#39FF14", marginTop: 4 }}>
                🔄 Synced to your coach dashboard instantly
              </div>
              {justLogged.result?.client_suggestion && (
                <div style={{ fontSize: 12, color: "#8B8B8B", marginTop: 6, fontStyle: "italic" }}>
                  💡 {justLogged.result.client_suggestion}
                </div>
              )}
            </div>
            <button onClick={() => setJustLogged(null)} style={{ background: "none", border: "none", color: "#5A5A5A", cursor: "pointer" }}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's Food Log */}
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF", marginBottom: 16 }}>Today's Food Log</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {log.map((entry) => (
            <CalorieMarkerCard
              key={entry.id}
              log={entry}
              mode="client"
            />
          ))}
          {log.length === 0 && (
            <div style={{ color: "#8B8B8B", textAlign: "center", padding: 40, border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12 }}>
              No meals logged today. Log your first meal above! 🍽️
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
