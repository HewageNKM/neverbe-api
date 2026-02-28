import { NextRequest, NextResponse } from "next/server";
import { getActivePromotions } from "@/services/WebPromotionService";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const promotions = await getActivePromotions();
    return NextResponse.json(promotions);
  } catch (error: any) {
    console.error("Promotions fetch error", error);
    return NextResponse.json([], { status: 500 });
  }
};
