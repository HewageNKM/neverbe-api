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

export const getModel = (modelName: string = "gemini-1.5-pro") => {
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

/**
 * Predict monthly sales and generate strategic hub data
 */
export const predictMonthlySales = async (historicalData: any, targetMonth?: string, targetYear?: number) => {
  const model = getModel();
  const isHistorical = historicalData.isHistoricalRequest;
  const instruction = isHistorical 
    ? `This is a HISTORICAL AUDIT. Analyze how the business performed in ${targetStr}. The "projections.predictions" should cover the FULL month of ${targetStr} (30/31 days) to show the daily simulation vs reality for that entire period.`
    : `This is a LIVE FORECAST. Ensure the "projections.predictions" include both past 7 days (actuals) and future 14 days (forecasts) relative to the current timestamp.`;

  const prompt = `
    Analyze the following historical sales and business data for an ERP system.
    Generate a JSON response that fits the following structure for a "Neural Strategic Hub" ${targetStr}:
    {
      "generatedAt": "ISO Date String",
      "briefing": "A concise executive summary of the business status (2 sentences)",
      "healthScore": 0-100,
      "projections": {
        "predictions": [
          { "date": "YYYY-MM-DD", "netSales": number, "isForecast": boolean }
        ],
        "metrics": { "dataPoints": number }
      },
      "reality": {
        "snapshot": { "totalNetSales": number },
        "comparison": { "percentageChange": { "revenue": number, "profit": number } },
        "orderStats": { "pending": number, "processing": number, "completed": number },
        "neuralRisks": []
      },
      "interventions": [
        { "type": "REVENUE|FINANCE|INVENTORY|PROMOTION", "priority": "CRITICAL|HIGH|NORMAL", "title": "string", "desc": "string", "productId": "string", "sku": "string" }
      ],
      "monthlyTarget": {
        "monthName": "Month Name",
        "year": number,
        "actual": number,
        "forecast": number,
        "progressPercent": number,
        "daysElapsed": number,
        "daysRemaining": number
      }
    }

    Context: Use 2 years of historical data provided below to find seasonal trends and cycles.
    Target Period: ${targetStr}
    Historical Data (Summary): ${JSON.stringify(historicalData)}

    Important: Return ONLY valid JSON. ${instruction}
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  // Clean potential markdown code blocks
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("Failed to parse AI response as JSON");
};
