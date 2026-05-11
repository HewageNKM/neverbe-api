import { NextRequest, NextResponse } from "next/server";
import { getFeaturedCategories } from "@/services/CategoryService";
import { handleAuthError } from "@/services/AuthService";

export const GET = async (req: NextRequest) => {
  try {
    const categories = await getFeaturedCategories();
    return NextResponse.json(categories);
  } catch (e) {
    return handleAuthError(e);
  }
};
