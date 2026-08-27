import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No GEMINI_API_KEY found in process.env");
    return;
  }

  console.log("Testing Google Gemini API with environment key...");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelsToTest = ["gemini-3.6-flash", "gemini-3.5-flash"];

    for (const model of modelsToTest) {
      try {
        console.log(`Sending test request to model: ${model}...`);
        const res = await ai.models.generateContent({
          model,
          contents: "Generate 1 sentence career encouragement for a vocational student.",
        });
        if (res && res.text) {
          console.log(`✅ SUCCESS with ${model}:`);
          console.log(res.text.trim());
          return;
        }
      } catch (err) {
        console.error(`Failed ${model}:`, err.message);
      }
    }
  } catch (err) {
    console.error("Gemini SDK Error:", err.message);
  }
}

testGemini();
