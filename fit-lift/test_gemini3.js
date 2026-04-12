const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
require('dotenv').config({ path: '.env.local' });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const prompt = 'Estimate calories for 2 boiled eggs. Return json';
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
  } catch (err) {
    console.error("Test Error Name:", err.name);
    console.error("Test Error Message:", err.message);
    if(err.status) console.error("Test Error Status:", err.status);
    if(err.errorDetails) console.error("Test Error Details:", err.errorDetails);
    
    // JSON stringify the error if possible
    try {
        console.log(JSON.stringify(err, null, 2));
    } catch(e) {}
  }
}

test();
