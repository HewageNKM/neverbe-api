import { getBatchProductStock } from "@/services/WebProductService";
import { NextRequest, NextResponse } from "next/server";

/**
 * Batch stock API - fetches stock for multiple sizes in one request
 * Much faster than making individual requests for each size
 */
export const GET = async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    const variantId = url.searchParams.get("variantId");
    const sizes = url.searchParams.get("sizes"); // comma-separated

    if (!productId || !variantId || !sizes) {
      return NextResponse.json(
        { message: "Missing parameters (productId, variantId, sizes)" },
        { status: 400 }
      );
    }

    const sizeList = sizes.split(",").filter(Boolean);
    const stockMap = await getBatchProductStock(productId, variantId, sizeList);

    return NextResponse.json(
      { productId, variantId, stock: stockMap },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[Batch Stock API] Error:", e.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
