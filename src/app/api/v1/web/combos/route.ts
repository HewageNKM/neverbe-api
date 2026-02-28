import { NextRequest, NextResponse } from "next/server";
import { getActiveCombos } from "@/services/WebPromotionService";

export const GET = async (req: NextRequest) => {
  try {
    const combos = await getActiveCombos();
    return NextResponse.json(combos);
  } catch (error: any) {
    console.error("Combos fetch error", error);
    return NextResponse.json([], { status: 500 });
  }
};
