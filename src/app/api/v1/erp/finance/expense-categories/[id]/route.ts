import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  getExpenseCategoryById,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "@/services/ExpenseCategoryService";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "view_expense_categories");

    const { id } = await params;
    const category = await getExpenseCategoryById(id);

    if (!category) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "manage_expense_categories");

    const { id } = await params;
    const formData = await req.formData();
    const data = formData.get("data");

    if (!data) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const body = JSON.parse(data as string);
    const category = await updateExpenseCategory(id, body);
    return NextResponse.json(category);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "manage_expense_categories");

    const { id } = await params;
    await deleteExpenseCategory(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
