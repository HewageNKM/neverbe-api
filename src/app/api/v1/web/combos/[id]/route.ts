import { NextRequest, NextResponse } from "next/server";
import { getComboById } from "@/services/WebPromotionService";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const params = await context.params;
    const combo = await getComboById(params.id);

    if (!combo) {
      return NextResponse.json({ error: "Combo not found" }, { status: 404 });
    }

    return NextResponse.json(combo);
  } catch (error: any) {
    console.error("Combo fetch error", error);
    return NextResponse.json(
      { error: "Failed to fetch combo" },
      { status: 500 }
    );
  }
};
