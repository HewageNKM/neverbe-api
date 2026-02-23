import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import {
  getAdjustments,
  createAdjustment,
} from "@/services/InventoryAdjustmentService";
import { AdjustmentType } from "@/model/InventoryAdjustment";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_adjustments");
    if (!response) {
      return errorResponse("Unauthorized", 401);
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type") as AdjustmentType | null;

    const data = await getAdjustments(type || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Adjustments API] Error:", error);
    return errorResponse(error);
  }
};

export const POST = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "create_adjustments");
    if (!response) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const adjustment = await createAdjustment(body);
    return NextResponse.json(adjustment, { status: 201 });
  } catch (error: any) {
    console.error("[Adjustments API] Error:", error);
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
