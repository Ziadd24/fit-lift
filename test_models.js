const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    // Correct way in newer SDK to list models usually requires the admin SDK or manual REST
    // But let's try gemini-1.5-flash again with better error handling. 
    // Wait, let's try "gemini-1.5-flash-latest" or "gemini-pro-latest"
    const names = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-2.0-flash-exp", "gemini-1.0-pro"];
    
    for (const name of names) {
      try {
        const model = genAI.getGenerativeModel({ model: name });
        const result = await model.generateContent("hi");
        console.log(`✅ Success with ${name}`);
        break;
      } catch (err) {
        console.error(`❌ Error with ${name}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error("Critical error:", err.message);
  }
}

listModels();
