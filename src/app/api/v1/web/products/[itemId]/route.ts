import { getProductById } from "@/services/WebProductService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) => {
  try {
    const params = await context.params;
    const product = await getProductById(params.itemId);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error(
      `[Web Product API] Error fetching product ${context}:`,
      error.message,
    );
    return NextResponse.json(
      { error: error.message || "Failed to fetch product" },
      { status: error.message.includes("not found") ? 404 : 500 },
    );
  }
};
