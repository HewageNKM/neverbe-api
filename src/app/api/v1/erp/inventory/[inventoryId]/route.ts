import { requirePermission, handleAuthError } from "@/services/AuthService";
import { updateInventoryQuantity } from "@/services/InventoryService";
import { NextRequest, NextResponse } from "next/server";

// PUT Handler: Update quantity for a specific inventory item
export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ inventoryId: string }> }
) => {
  try {
    const { inventoryId } = await params;
    await requirePermission(req, "update_inventory");

    if (!inventoryId) {
      return NextResponse.json({ success: false, message: "Inventory ID is required" }, { status: 400 });
    }

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const data = JSON.parse(dataString);

    // Validate quantity
    if (
      data.quantity === undefined ||
      typeof data.quantity !== "number" ||
      data.quantity < 0 ||
      !Number.isInteger(data.quantity)
    ) {
      return NextResponse.json({ 
        success: false, 
        message: "Quantity is required and must be a non-negative integer" 
      }, { status: 400 });
    }

    const updatedItem = await updateInventoryQuantity(
      inventoryId,
      data.quantity
    );

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error: any) {
    console.error(`PUT /api/v2/inventory Error:`, error);
    return handleAuthError(error);
  }
};

// Optional: DELETE Handler if you want hard deletion
// export const DELETE = async (req: NextRequest, { params }: { params: { inventoryId: string } }) => { ... }
