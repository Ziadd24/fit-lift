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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let mealText = meal ? meal.trim() : "this image of a meal";

    const prompt = `You are a professional nutritionist AI. Analyze ${mealText} and return ONLY a valid JSON object with no markdown, no code fences, no explanation.

Return this exact JSON structure:
{
  "items": [
    { "name": "food item name", "amount": "estimated amount", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
  ],
  "totals": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0
  },
  "confidence": "high" | "medium" | "low",
  "notes": "brief note about the estimate"
}

Rules:
- All numbers must be integers
- protein, carbs, fat are in grams
- Estimate realistic portion sizes if not specified
- If the food is ambiguous, use the most common preparation
- Support all world cuisines including Arabic/Egyptian foods
- confidence is "high" for common foods, "medium" for dishes you're estimating, "low" for very vague descriptions
- If analyzing an image, identify the visible foods and estimate their amounts.`;

    let result;
    if (image) {
      // Split "data:image/jpeg;base64,....." if present
      const base64Data = image.split(",")[1] || image;
      const mimeMatch = image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      };

      result = await model.generateContent([prompt, imagePart]);
    } else {
      result = await model.generateContent(prompt);
    }
    
    const text = result.response.text().trim();

    // Strip any accidental markdown fences
    const cleaned = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned);

    // Validate structure
    if (!parsed.totals || typeof parsed.totals.calories !== "number") {
      throw new Error("Invalid response structure from Gemini");
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("[calories/analyze] Error:", err.message);
    return NextResponse.json(
      { error: "Failed to analyze meal. Please try again." },
      { status: 500 }
    );
  }
}
