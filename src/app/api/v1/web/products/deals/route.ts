import { getDealsProductsFiltered } from "@/services/WebProductService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const url = new URL(req.url);

    // Parse query parameters
    const page = Number(url.searchParams.get("page") || 1);
    const size = Number(url.searchParams.get("size") || 20);
    const tags = url.searchParams.getAll("tag");
    const inStockParam = url.searchParams.get("inStock");
    const sizesParam = url.searchParams.get("sizes");
    const genderParam = url.searchParams.get("gender");

    const inStock =
      inStockParam === "true"
        ? true
        : inStockParam === "false"
        ? false
        : undefined;

    const sizes = sizesParam ? sizesParam.split(",").filter(Boolean) : [];
    const gender = genderParam?.toLowerCase() || "";

    console.log("[Deals API] Query params:", {
      page,
      size,
      tags,
      inStock,
      sizes,
      gender,
    });

    // Delegate to service layer for filtering
    const result = await getDealsProductsFiltered({
      tags,
      inStock,
      sizes,
      gender,
      page,
      size,
    });

    console.log(
      `[Deals API] Returning ${result.dataList?.length || 0} products (total: ${
        result.total
      })`
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[Deals API] Error:", error.message, error.stack);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};
