const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listAllModels() {
  try {
    // Note: The @google/generative-ai library doesn't always 
    // expose listModels() in the browser SDK directly. 
    // Let's use simple node-fetch or similar logic with the API key.
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await res.json();
    console.log("Status:", res.status);
    if (!res.ok) {
       console.log("Error body:", data);
       return;
    }
    console.log("Available models:");
    data.models.forEach(m => console.log(`  - ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
  } catch (err) {
    console.error("List error:", err.message);
  }
}

listAllModels();
