import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getRevenueByCategory } from "@/services/DashboardService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_dashboard");

    const raw = await getRevenueByCategory();
    const totalRevenue = raw.reduce((sum, c) => sum + c.value, 0);

    const data = raw.map((item) => ({
      category: item.name,
      revenue: item.value,
      orders: 0,
      percentage: totalRevenue > 0 ? Math.round((item.value / totalRevenue) * 100) : 0,
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
