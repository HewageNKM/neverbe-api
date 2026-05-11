import { requirePermission, handleAuthError } from "@/services/AuthService";
import { updateStock, deleteStock } from "@/services/StockService"; // Use StockService
import { NextRequest, NextResponse } from "next/server";

// PUT Handler: Update a specific stock location
export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) => {
  try {
    const { stockId } = await params;
    await requirePermission(req, "view_master_data");

    if (!stockId) return NextResponse.json({ success: false, message: "Stock ID is required" }, { status: 400 });

    const formData = await req.formData();
    const rawData = formData.get("data") as string;

    if (!rawData) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const data = JSON.parse(rawData);
    const updateData: any = {};

    // Validate and build update object
    if (data.name !== undefined) {
      if (typeof data.name !== "string" || data.name.trim() === "") {
        return NextResponse.json({ success: false, message: "Name cannot be empty" }, { status: 400 });
      }
      updateData.name = data.name.trim();
    }
    if (data.address !== undefined) {
      // Allow clearing address
      updateData.address =
        typeof data.address === "string" ? data.address.trim() : "";
    }
    if (data.status !== undefined) {
      if (typeof data.status !== "boolean") {
        return NextResponse.json({ success: false, message: "Status must be true or false" }, { status: 400 });
      }
      updateData.status = data.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, message: "No valid fields provided for update" }, { status: 400 });
    }

    await updateStock(stockId, updateData);

    return NextResponse.json(
      { message: "Stock location updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return handleAuthError(error);
  }
};

// DELETE Handler: Soft-delete a specific stock location
export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) => {
  try {
    const { stockId } = await params;
    await requirePermission(req, "view_master_data");

    if (!stockId) return NextResponse.json({ success: false, message: "Stock ID is required" }, { status: 400 });

    await deleteStock(stockId);

    return NextResponse.json(
      { message: "Stock location deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return handleAuthError(error);
  }
};
