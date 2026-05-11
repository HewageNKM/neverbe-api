import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getLowStockAlerts } from "@/services/DashboardService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_dashboard");

    const url = new URL(req.url);
    const threshold = parseInt(url.searchParams.get("threshold") || "5");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const data = await getLowStockAlerts(threshold, limit);
    return NextResponse.json(data);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
