import { NextRequest, NextResponse } from "next/server";
import { fetchLiveStock } from "@/services/ReportService";
import { requirePermission, handleAuthError } from "@/services/AuthService";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "view_reports");

    const url = new URL(req.url);
    const stockId = url.searchParams.get("stockId") || "";

    const data = await fetchLiveStock(stockId);
    return NextResponse.json(data);
  } catch (err: any) {
    return handleAuthError(err);
  }
}
