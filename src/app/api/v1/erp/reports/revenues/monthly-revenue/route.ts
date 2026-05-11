import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getMonthlyRevenueReport } from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "view_reports");

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";

    const res = await getMonthlyRevenueReport(from, to);

    return NextResponse.json(res);
  } catch (error: any) {
    return handleAuthError(error);
  }
}
