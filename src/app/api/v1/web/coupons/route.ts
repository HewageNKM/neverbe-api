import { NextRequest, NextResponse } from "next/server";
import { getActiveCoupons } from "@/services/WebPromotionService";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const coupons = await getActiveCoupons();
    return NextResponse.json(coupons);
  } catch (error: any) {
    console.error("Coupons fetch error", error);
    return NextResponse.json([], { status: 500 });
  }
};
