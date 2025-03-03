import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Loads the Google Gemini API key from an environment variable.
 * For local dev, place your key in .env as VITE_GOOGLE_AI_API_KEY=xxxx
 *
 * CAUTION: Using the key in client-side code exposes it to users who inspect network calls.
 * For production or secure contexts, consider calling Gemini from a protected server endpoint.
 */

const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;

// Basic check for safety
if (!apiKey) {
  console.warn("Warning: VITE_GOOGLE_AI_API_KEY is not set. Gemini calls will fail.");
}

/**
 * Create a single shared GoogleGenerativeAI instance for the entire app.
 * If you need to specify advanced options (e.g. timeouts), do it here.
 */
export const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Retrieve reference to the specific Gemini 2.0 Flash model.
 * This is an example usage; you can call .getGenerativeModel with the exact name.
 */
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  // You can override generationConfig here or in your service calls
  // e.g. { temperature: 0.4, topK: 32, maxOutputTokens: 2048 }
});