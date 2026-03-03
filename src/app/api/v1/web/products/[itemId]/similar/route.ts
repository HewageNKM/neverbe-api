import { getSimilarItems } from "@/services/WebProductService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) => {
  try {
    const params = await context.params;
    const items = await getSimilarItems(params.itemId);

    return NextResponse.json({ dataList: items });
  } catch (error: any) {
    console.error(
      `[Web Similar Products API] Error fetching similar products for ${context}:`,
      error.message,
    );
    return NextResponse.json(
      { error: error.message || "Failed to fetch similar products" },
      { status: 500 },
    );
  }
};
