import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Apple, Camera, Loader2, Sparkles, Send } from "lucide-react";
import { useListCalorieLogs, useSaveCalorieLog } from "@/lib/api-hooks";

export default function NutritionTab({ isPrivate }: { isPrivate: boolean }) {
  const [meal, setMeal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: logs } = useListCalorieLogs();
  const log = logs || [];
  const { mutate: saveCalorieLog } = useSaveCalorieLog();
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    try {
      const res = await fetch("/api/calories/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal: trimmed, image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      
      saveCalorieLog({
        meal: trimmed,
        result: data,
        category: getMealCategory(Date.now()),
      }, {
        onSuccess: () => {
          setMeal("");
          setImage(null);
        }
      });
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
    <div style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Apple size={24} color="#7CFC00" />
        <span style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>Nutrition & Diet</span>
      </div>

      <div style={{ background: "rgba(124,252,0,0.05)", border: "1px solid rgba(124,252,0,0.2)", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Sparkles size={18} color="#7CFC00" />
          <span style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF" }}>Log a Meal</span>
        </div>
        <p style={{ fontSize: 13, color: "#8B8B8B", marginBottom: 16 }}>Describe what you ate or upload a photo, and our AI will calculate the macros automatically.</p>
        
        {error && <div style={{ color: "#EF4444", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        
        <div style={{ position: "relative" }}>
          <textarea
            value={meal}
            onChange={(e) => setMeal(e.target.value)}
            placeholder="e.g. 200g grilled chicken beast with 1 cup brown rice..."
            style={{ width: "100%", height: 100, background: "#16161A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, color: "#FFFFFF", fontSize: 14, resize: "none", outline: "none", fontFamily: "'Inter', sans-serif" }}
          />
          {image && (
            <div style={{ position: "absolute", bottom: 16, left: 16, width: 40, height: 40, borderRadius: 8, overflow: "hidden", border: "2px solid #7CFC00" }}>
              <img src={image} alt="Upload" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", gap: 8 }}>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: "none" }} />
            <button onClick={() => fileInputRef.current?.click()} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "none", color: "#8B8B8B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Camera size={16} />
            </button>
            <button onClick={analyze} disabled={isLoading || (!meal.trim() && !image)} style={{ height: 36, padding: "0 16px", borderRadius: 18, background: "#7CFC00", border: "none", color: "#000", fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Log Meal</>}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF", marginBottom: 16 }}>Today's Food Log</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {log.map((entry) => (
            <div key={entry.id} style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, display: "flex", justifyItems: "center", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#7CFC00", textTransform: "capitalize", fontWeight: 600, marginBottom: 4 }}>{entry.category}</div>
                <div style={{ fontSize: 15, color: "#FFFFFF" }}>{entry.meal || "Photo Upload"}</div>
                <div style={{ fontSize: 12, color: "#8B8B8B", marginTop: 4 }}>
                  {entry.result.totals.protein}g P • {entry.result.totals.carbs}g C • {entry.result.totals.fat}g F
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF" }}>
                {entry.result.totals.calories} <span style={{ fontSize: 12, color: "#8B8B8B", fontWeight: 400 }}>kcal</span>
              </div>
            </div>
          ))}
          {log.length === 0 && (
            <div style={{ color: "#8B8B8B", textAlign: "center", padding: 40, border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12 }}>
              No meals logged today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
