import { getProductStock } from "@/services/WebProductService";
import { NextRequest, NextResponse } from "next/server";


export const GET = async (req: NextRequest) => {
  try {
    console.log("[Stock API] Incoming request");

    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    const variantId = url.searchParams.get("variantId");
    const size = url.searchParams.get("size");

    console.log("[Stock API] Query params:", { productId, variantId, size });

    if (!productId || !variantId || !size) {
      console.warn("[Stock API] Missing required parameters");
      return NextResponse.json(
        { message: "Missing parameters" },
        { status: 400 }
      );
    }

    // --- Step 1: Fetch stock quantity ---
    const qty = await getProductStock(productId, variantId, size);
    console.log(`[Stock API] Stock quantity for ${productId}, variant ${variantId}, size ${size}:`, qty);

    return NextResponse.json({ productId, variantId, size, quantity: qty }, { status: 200 });
  } catch (e: any) {
    console.error("[Stock API] Failed to fetch stock:", e.message, e.stack);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
