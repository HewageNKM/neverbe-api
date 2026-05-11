import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  getExpenseCategories,
  createExpenseCategory,
  getExpenseCategoriesDropdown,
} from "@/services/ExpenseCategoryService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_expense_categories");

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
    return handleAuthError(error);
  }
};

export const POST = async (req: Request) => {
  try {
    await requirePermission(req, "manage_expense_categories");

    const formData = await req.formData();
    const data = formData.get("data");

    if (!data) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const body = JSON.parse(data as string);
    const category = await createExpenseCategory(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
