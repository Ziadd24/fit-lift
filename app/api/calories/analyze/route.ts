import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { meal, image } = await req.json();
    if (!meal && !image) {
      return NextResponse.json({ error: "Please describe a meal or provide an image." }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const mealText = meal ? meal.trim() : "this image of a meal";

    const prompt = `You are a professional nutritionist AI for a fitness coaching platform. Analyze ${mealText} and return ONLY a valid JSON object with no markdown, no code fences, no explanation.

Return this exact JSON structure:
{
  "display_title": "short meal name max 25 chars e.g. Chicken Salad",
  "meal_type": "breakfast",
  "items": [
    { "name": "food item name", "grams": 0, "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
  ],
  "totals": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0
  },
  "confidence_score": 85,
  "portion_analysis": "e.g. Estimated 200g chicken, 150g rice",
  "notes": "brief nutritionist note",
  "client_suggestion": "one short tip or null",
  "coach_alert": null
}

Rules:
- All numbers must be integers
- protein, carbs, fat are in grams. grams per food item is an integer estimate
- display_title max 25 characters
- meal_type must be one of: breakfast, lunch, dinner, snack, pre_workout, post_workout
- confidence_score is integer 0-100:
  * 90-100: Clear common food, standard portion
  * 70-89: Mixed dish, estimated portions  
  * 50-69: Complex restaurant meal, ambiguous
  * Below 50: Very vague like a big bowl of stuff
- portion_analysis: summarize estimated portions concisely
- client_suggestion: if protein < 20g suggest adding protein; if calories very high mention balance; otherwise null
- coach_alert: if confidence_score < 70 set to "Needs verification: [display_title]"; if totals.calories > 800 set to "Large meal logged: [calories] kcal"; otherwise null
- Support all world cuisines including Arabic and Egyptian foods like ful medames, koshari, shawarma, kofta, etc.
- If analyzing an image, identify all visible foods and estimate amounts`;

    let result;
    if (image) {
      const base64Data = image.split(",")[1] || image;
      const mimeMatch = image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      result = await model.generateContent([prompt, { inlineData: { data: base64Data, mimeType } }]);
    } else {
      result = await model.generateContent(prompt);
    }

    const text = result.response.text().trim();
    const cleaned = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned);

    // Validate structure
    if (!parsed.totals || typeof parsed.totals.calories !== "number") {
      throw new Error("Invalid response structure from Gemini");
    }

    // Ensure confidence_score is present
    if (typeof parsed.confidence_score !== "number") {
      const conf = parsed.confidence || "medium";
      parsed.confidence_score = conf === "high" ? 90 : conf === "medium" ? 75 : 55;
    }

    // Backwards compat: keep old string "confidence" field
    const score = parsed.confidence_score as number;
    parsed.confidence = score >= 90 ? "high" : score >= 70 ? "medium" : "low";

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("[calories/analyze] Error:", err.message);
    return NextResponse.json(
      { error: "Failed to analyze meal. Please try again." },
      { status: 500 }
    );
  }
}
