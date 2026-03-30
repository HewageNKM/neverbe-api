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

/**
 * Process contextual chat for the ERP Intelligent Assistant
 */
export const processContextualChat = async (contextData: any, messages: any[]) => {
  const model = getGenAI().getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "You are an ERP Intelligent Assistant. Help the user with their business questions using the provided context."
  });

  const prompt = `
    Business Context: ${JSON.stringify(contextData)}
    Conversation: ${JSON.stringify(messages)}
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

/**
 * Generate product description from title and features
 */
export const generateDescription = async (title: string, features: string[]) => {
  const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Create a professional product description for "${title}" with these features: ${features.join(", ")}`;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
};
