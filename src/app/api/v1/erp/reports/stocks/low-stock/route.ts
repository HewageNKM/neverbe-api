import { requirePermission, handleAuthError } from "@/services/AuthService";
import { fetchLowStock } from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "view_reports");

    const url = new URL(req.url);
    const threshold = parseInt(url.searchParams.get("threshold") || "10", 10);
    const stockId = url.searchParams.get("stockId") || "";

    const data = await fetchLowStock(threshold, stockId);

    return NextResponse.json(data);
  } catch (err: any) {
    return handleAuthError(err);
  }
}
