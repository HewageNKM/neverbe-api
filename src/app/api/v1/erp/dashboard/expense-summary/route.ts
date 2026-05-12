import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getExpenseSummary } from "@/services/DashboardService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_dashboard");

    const categories = await getExpenseSummary();
    const monthExpenses = categories.reduce((sum, c) => sum + c.amount, 0);
    const topCategory = categories.length > 0 ? categories[0] : null;

    return NextResponse.json({
      todayExpenses: 0, // Daily granularity not tracked in expense summary
      monthExpenses,
      topCategory: topCategory?.category || "N/A",
      topCategoryAmount: topCategory?.amount || 0,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
