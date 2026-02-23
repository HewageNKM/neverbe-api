import { NextRequest, NextResponse } from "next/server";
import { authorizeAndGetUser } from "@/services/AuthService";
import { updateAdjustmentStatus } from "@/services/InventoryAdjustmentService";
import { errorResponse } from "@/utils/apiResponse";
import { AdjustmentStatus } from "@/model/InventoryAdjustment";

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const user = await authorizeAndGetUser(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return errorResponse("Status is required", 400);
    }

    // Validate status
    const validStatuses: AdjustmentStatus[] = [
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "REJECTED",
    ];
    if (!validStatuses.includes(status)) {
      return errorResponse("Invalid status", 400);
    }

    await updateAdjustmentStatus(id, status as AdjustmentStatus, user.userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Adjustment Status API] Error:", error);
    return errorResponse(error);
  }
};
