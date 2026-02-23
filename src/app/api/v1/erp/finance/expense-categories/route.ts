import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import {
  getExpenseCategories,
  createExpenseCategory,
  getExpenseCategoriesDropdown,
} from "@/services/ExpenseCategoryService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_expense_categories");
    if (!response) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const type = url.searchParams.get("type") as "expense" | "income" | null;
    const dropdown = url.searchParams.get("dropdown") === "true";

    if (dropdown) {
      const data = await getExpenseCategoriesDropdown(type || undefined);
      return NextResponse.json(data);
    }

    const data = await getExpenseCategories(type || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const POST = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "manage_expense_categories");
    if (!response) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const category = await createExpenseCategory(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
