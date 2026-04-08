import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { memberName, logs, dailyTotals, goals } = await req.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Format logs for AI context
    const mealList = logs.map((l: any) => 
      `- ${l.meal}: ${l.result.totals.calories} kcal (${l.result.totals.protein}g P, ${l.result.totals.carbs}g C, ${l.result.totals.fat}g F)`
    ).join("\n");

    const prompt = `You are an elite, highly analytical AI fitness nutrition coach performing a 'Nutritional Threat Assessment' for a client.

Client Name: ${memberName || "Client"}
Current Daily Totals: ${dailyTotals.calories} kcal (${dailyTotals.protein}g P, ${dailyTotals.carbs}g C, ${dailyTotals.fat}g F)
Daily Target Goals: ${goals.calories} kcal (${goals.protein}g P, ${goals.carbs}g C, ${goals.fat}g F)

Logs Today:
${mealList || "No meals logged today."}

Analyze the client's progress against their goals. Identify any 'threats' to their progress (e.g., undereating protein, overshooting calories, poor macro distribution). Be highly concise.

Return ONLY a valid JSON object matching this exact structure (no markdown, no markdown fences):
{
  "threat_level": "High Risk" | "Moderate Risk" | "On Track" | "Excellent",
  "threat_level_color": "#EF4444" | "#F59E0B" | "#10B981" | "#39FF14",
  "summary": "1-2 short sentences summarizing their current adherence to the targets.",
  "key_observations": [
    "A short bullet point about protein, calories, etc."
  ],
  "coach_recommendation": "1 actionable sentence for the coach to tell the client."
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("[calories/assessment] Error:", err.message);
    return NextResponse.json(
      { error: "Failed to generate assessment. Please try again." },
      { status: 500 }
    );
  }
}
