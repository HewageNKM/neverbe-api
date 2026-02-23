import { authorizeRequest } from "@/services/AuthService";
import { updateInventoryQuantity } from "@/services/InventoryService"; // Use specific update function
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

// PUT Handler: Update quantity for a specific inventory item
export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ inventoryId: string }> }
) => {
  try {
    const { inventoryId } = await params;
    const user = await authorizeRequest(req, "view_inventory");
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (!inventoryId) {
      return errorResponse("Inventory ID is required", 400);
    }

    const data = await req.json();

    // Validate quantity
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

    const updatedItem = await updateInventoryQuantity(
      inventoryId,
      data.quantity
    );

    return NextResponse.json(updatedItem, { status: 200 }); // Return updated item
  } catch (error: any) {
    console.error(`PUT /api/v2/inventory Error:`, error);
    return errorResponse(error);
  }
};

// Optional: DELETE Handler if you want hard deletion
// export const DELETE = async (req: NextRequest, { params }: { params: { inventoryId: string } }) => { ... }
