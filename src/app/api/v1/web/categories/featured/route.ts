import { NextRequest, NextResponse } from "next/server";
import { getFeaturedCategories } from "@/services/CategoryService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: NextRequest) => {
  try {
    const categories = await getFeaturedCategories();
    return NextResponse.json(categories);
  } catch (e) {
    return errorResponse(e);
  }
};
