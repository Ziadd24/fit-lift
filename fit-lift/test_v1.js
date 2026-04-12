const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testV1() {
  try {
     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });
     const result = await model.generateContent("hi");
     console.log("✅ Success with v1 and gemini-1.5-flash");
  } catch (err) {
     console.error("❌ Error with v1:", err.message);
  }
}

testV1();
