import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getMonthlySummary } from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "view_reports");

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";
    const status = url.searchParams.get("status") || "Paid";

    const data = await getMonthlySummary(from, to, status);
    return NextResponse.json(data);
  } catch (error: any) {
    return handleAuthError(error);
  }
}
