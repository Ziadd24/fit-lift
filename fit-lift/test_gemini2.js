const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
require('dotenv').config({ path: '.env.local' });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const req = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
  const data = await req.json();
  console.log(data.models.map(m => m.name).join("\n"));
}

test();
