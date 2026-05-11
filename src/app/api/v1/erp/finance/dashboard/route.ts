import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getFinanceDashboardData } from "@/services/FinanceDashboardService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_finance");

    const data = await getFinanceDashboardData();
    return NextResponse.json(data);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
