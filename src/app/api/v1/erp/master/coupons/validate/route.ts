import { requirePermission, handleAuthError } from "@/services/AuthService";
import { validateCoupon } from "@/services/PromotionService";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    await requirePermission(req, "view_coupons");

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const data = JSON.parse(dataString);
    const { code, userId, cartTotal, cartItems } = data;

    if (!code) {
      return NextResponse.json({ success: false, message: "Coupon code is required" }, { status: 400 });
    }

    const result = await validateCoupon(code, userId, cartTotal, cartItems);

    if (!result.valid) {
      return NextResponse.json({ success: false, message: result.message || "Invalid coupon" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return handleAuthError(error);
  }
};
