import { NextResponse } from "next/server";
import { authorizeAndGetUser } from "@/services/AuthService";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { errorResponse } from "@/utils/apiResponse";

export const POST = async (req: Request) => {
  try {
    const user = await authorizeAndGetUser(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const { name, category, brand, gender, tags } = body;

    if (!name) {
      return errorResponse("Product name is required", 400);
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set");

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const details = [
      name && `Product: ${name}`,
      brand && `Brand: ${brand}`,
      category && `Category: ${category}`,
      gender?.length && `Target audience: ${gender.join(", ")}`,
      tags?.length && `Tags/Keywords: ${tags.join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `You are a professional e-commerce copywriter for a Sri Lankan fashion/lifestyle brand called NeverBe.

Write a compelling, SEO-friendly product description in Markdown format based on these details:
${details}

Requirements:
- 2-3 short paragraphs (no headings)
- Use **bold** for key features or selling points
- Include a bullet list (using -) of 3-5 key features/benefits at the end
- Keep it concise, engaging, and conversion-optimized
- Tone: modern, premium, slightly aspirational
- Do NOT include the product name as a heading at the top
- Output ONLY the markdown description, nothing else`;

    const result = await model.generateContent(prompt);
    const description = result.response.text().trim();

    return NextResponse.json({
      success: true,
      data: { description },
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
};
