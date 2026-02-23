import { NextRequest, NextResponse } from "next/server";
import {
  getStockInventory,
  getProductInventoryByStock,
} from "@/services/POSService";
import { verifyPosAuth, handleAuthError } from "@/services/AuthService";
import { errorResponse } from "@/utils/apiResponse";

// GET - Fetch inventory for specific product/variant/size or all inventory for product
export async function GET(request: NextRequest) {
  try {
    await verifyPosAuth("view_pos_inventory");

    const { searchParams } = new URL(request.url);
    const stockId = searchParams.get("stockId");
    const productId = searchParams.get("productId");
    const variantId = searchParams.get("variantId");
    const size = searchParams.get("size");

    if (!stockId || !productId) {
      return errorResponse("stockId and productId are required", 400);
    }

    // If variantId and size provided, get specific inventory item
    if (variantId && size) {
      const inventory = await getStockInventory(
        stockId,
        productId,
        variantId,
        size
      );
      return NextResponse.json(inventory);
    }

    // Otherwise, get all inventory for product at stock location
    const inventory = await getProductInventoryByStock(stockId, productId);
    return NextResponse.json(inventory);
  } catch (error: any) {
    return handleAuthError(error);
  }
}
