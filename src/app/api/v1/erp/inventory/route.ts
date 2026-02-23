import { authorizeRequest } from "@/services/AuthService";
import {
  getInventory,
  addInventory,
  addBulkInventory,
} from "@/services/InventoryService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

// GET Handler: Fetch list of inventory items
export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req, "view_inventory");
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "10");

    // --- Read all filters ---
    const productId = searchParams.get("productId") || undefined;
    const variantId = searchParams.get("variantId") || undefined;
    const variantSize = searchParams.get("variantSize") || undefined;
    const stockId = searchParams.get("stockId") || undefined;

    const result = await getInventory(
      page,
      size,
      productId,
      variantId,
      variantSize,
      stockId
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return errorResponse(error);
  }
};

// POST Handler: Create inventory item(s) - supports single and bulk
export const POST = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req, "update_inventory");
    if (!user) return errorResponse("Unauthorized", 401);

    const data = await req.json();

    // Check if this is a bulk request
    if (data.bulk === true) {
      // Bulk validation
      if (!data.productId || !data.variantId || !data.stockId) {
        return errorResponse(
          "Product, Variant, and Stock Location are required for bulk entry",
          400
        );
      }
      if (
        !Array.isArray(data.sizeQuantities) ||
        data.sizeQuantities.length === 0
      ) {
        return errorResponse(
          "sizeQuantities array is required for bulk entry",
          400
        );
      }

      const result = await addBulkInventory(
        data.productId,
        data.variantId,
        data.stockId,
        data.sizeQuantities
      );

      return NextResponse.json(result, { status: 201 });
    }

    // Single item entry (existing logic)
    if (!data.productId || !data.variantId || !data.size || !data.stockId) {
      return errorResponse(
        "Product, Variant, Size, and Stock Location are required",
        400
      );
    }
    if (
      data.quantity === undefined ||
      typeof data.quantity !== "number" ||
      data.quantity < 0 ||
      !Number.isInteger(data.quantity)
    ) {
      return errorResponse(
        "Quantity is required and must be a non-negative integer",
        400
      );
    }

    const inventoryData = {
      productId: data.productId,
      variantId: data.variantId,
      size: data.size,
      stockId: data.stockId,
      quantity: data.quantity,
    };

    const newInventoryItem = await addInventory(inventoryData);
    return NextResponse.json(newInventoryItem, { status: 201 });
  } catch (error: any) {
    return errorResponse(error);
  }
};
