import { NextRequest, NextResponse } from "next/server";
import { verifyPosAuth, handleAuthError } from "@/services/AuthService";
import { getExpenseCategoriesDropdown } from "@/services/ExpenseCategoryService";

/**
 * GET - Fetch expense categories for POS
 */
export async function GET(request: NextRequest) {
  try {
    await verifyPosAuth("access_pos");

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") as "expense" | "income") || "expense";

    const categories = await getExpenseCategoriesDropdown(type);

    return NextResponse.json(categories);
  } catch (error: any) {
    return handleAuthError(error);
  }
}
