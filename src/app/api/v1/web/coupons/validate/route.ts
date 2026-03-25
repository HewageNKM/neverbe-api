import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/services/WebPromotionService";

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json(
        { valid: false, message: "Missing data field" },
        { status: 400 }
      );
    }

    const body = JSON.parse(dataString);
    const { code, cartTotal, cartItems, userId } = body;

    if (!code) {
      return NextResponse.json(
        { valid: false, message: "Coupon code required" },
        { status: 400 }
      );
    }

    const result = await validateCoupon(
      code,
      userId || null,
      cartTotal || 0,
      cartItems || []
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Coupon validation error", error);
    return NextResponse.json(
      { valid: false, message: "Validation failed" },
      { status: 500 }
    );
  }
};
