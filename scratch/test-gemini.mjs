import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Hello, generate 1 sentence career rationale.",
    });
    console.log("Response:", res.text);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
