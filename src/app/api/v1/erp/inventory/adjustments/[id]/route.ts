import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getAdjustmentById } from "@/services/InventoryAdjustmentService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const response = await authorizeRequest(req, "view_adjustments");
    if (!response) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const adjustment = await getAdjustmentById(id);

    return NextResponse.json(adjustment);
  } catch (error: any) {
    console.error("[Adjustment API] Error:", error);
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
