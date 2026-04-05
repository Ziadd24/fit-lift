const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  const GEMINI_API_KEY = "AIzaSyAJQNb4PeGJyyrrtOV4piXrL8fdNss9ysA";
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const req = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
  const data = await req.json();
  console.log(data.models.map(m => m.name).join("\n"));
}

test();
