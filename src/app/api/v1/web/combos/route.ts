import { NextRequest, NextResponse } from "next/server";
import {
  getPaginatedCombos,
  getActiveCombos,
} from "@/services/WebPromotionService";

export const GET = async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = searchParams.get("page");
    const size = searchParams.get("size");

    if (page && size) {
      const pageNum = parseInt(page);
      const sizeNum = parseInt(size);
      const paginatedData = await getPaginatedCombos(pageNum, sizeNum);
      return NextResponse.json({
        dataList: paginatedData.combos,
        total: paginatedData.total,
        totalPages: paginatedData.totalPages,
      });
    } else {
      const combos = await getActiveCombos();
      return NextResponse.json(combos);
    }
  } catch (error: any) {
    console.error("Combos fetch error", error);
    return NextResponse.json([], { status: 500 });
  }
};
