import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getRevenueByCategory } from "@/services/DashboardService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_dashboard");

    const data = await getRevenueByCategory();
    return NextResponse.json(data);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
