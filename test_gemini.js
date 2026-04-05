const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  const GEMINI_API_KEY = "AIzaSyAJQNb4PeGJyyrrtOV4piXrL8fdNss9ysA";
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash" });

  try {
    const prompt = 'Test';
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
  } catch (err) {
    console.error("Test Error:", err);
  }
}

test();
