import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getAdjustmentById } from "@/services/InventoryAdjustmentService";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "view_adjustments");

    const { id } = await params;
    const adjustment = await getAdjustmentById(id);

    return NextResponse.json(adjustment);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
