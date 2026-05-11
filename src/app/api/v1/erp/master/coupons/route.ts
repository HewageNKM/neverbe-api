import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getCoupons, createCoupon } from "@/services/PromotionService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    await requirePermission(req, "view_coupons");

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "20");
    const search = searchParams.get("search") || undefined;
    const filterStatus = searchParams.get("status") || undefined;

    const result = await getCoupons(page, size, filterStatus, search);
    return NextResponse.json(result);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    await requirePermission(req, "create_coupons");

    const formData = await req.formData();
    const rawData = formData.get("data") as string;
    
    if (!rawData) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const data = JSON.parse(rawData);

    if (!data.code || !data.discountType) {
      return NextResponse.json({ success: false, message: "Code and Discount Type required" }, { status: 400 });
    }

    const coupon = await createCoupon(data);
    return NextResponse.json(coupon, { status: 201 });
  } catch (error: any) {
    return handleAuthError(error);
  }
};
