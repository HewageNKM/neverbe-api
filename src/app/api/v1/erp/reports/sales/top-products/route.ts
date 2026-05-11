import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getTopSellingProducts } from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "view_reports");

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";
    const threshold = Number.parseInt(
      url.searchParams.get("threshold") || "10",
    );
    const status = url.searchParams.get("status") || "Paid";

    const data = await getTopSellingProducts(from, to, threshold, status);
    return NextResponse.json(data);
  } catch (error: any) {
    return handleAuthError(error);
  }
}
