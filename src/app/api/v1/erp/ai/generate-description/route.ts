import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getGenAI } from "@/services/AIService";

export const POST = async (req: Request) => {
  try {
    await requirePermission(req, "view_dashboard");

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const body = JSON.parse(dataString);
    const { name, category, brand, gender, tags } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Product name is required" }, { status: 400 });
    }

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
    return handleAuthError(error);
  }
};
