import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIInstance: GoogleGenerativeAI | null = null;

export const getGenAI = () => {
  if (!genAIInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set.");
    genAIInstance = new GoogleGenerativeAI(key);
  }
  return genAIInstance;
};

export const getModel = (modelName: string = "gemini-2.5-flash-lite") => {
  return getGenAI().getGenerativeModel({
    model: modelName,
  });
};

/**
 * Generate product description from title and features
 */
export const generateDescription = async (title: string, features: string[]) => {
  const model = getModel();
  const prompt = `Create a professional product description for "${title}" with these features: ${features.join(", ")}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

