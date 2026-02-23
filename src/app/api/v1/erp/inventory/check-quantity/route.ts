import { authorizeRequest } from "@/services/AuthService";
import { getInventoryQuantity } from "@/services/InventoryService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req, "view_inventory");
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || "";
    const variantId = searchParams.get("variantId") || "";
    const size = searchParams.get("size") || "";
    const stockId = searchParams.get("stockId") || "";

    const res = await getInventoryQuantity(productId, variantId, size, stockId);
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("[check-quantity API] Error:", error);
    return errorResponse(error);
  }
};
