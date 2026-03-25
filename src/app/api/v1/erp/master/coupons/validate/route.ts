import { validateCoupon } from "@/services/PromotionService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export const POST = async (req: NextRequest) => {
  try {
    // This endpoint might be public (for checkout) or protected.
    // Usually public but maybe with a session token.
    // For now, let's keep it open or check for a user limit later.

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return errorResponse("Missing data field", 400);
    }

    const data = JSON.parse(dataString);
    const { code, userId, cartTotal, cartItems } = data;

    if (!code) {
      return errorResponse("Coupon code is required", 400);
    }

    const result = await validateCoupon(code, userId, cartTotal, cartItems);

    if (!result.valid) {
      return errorResponse(result.message || "Invalid coupon", 400);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return errorResponse(error);
  }
};
