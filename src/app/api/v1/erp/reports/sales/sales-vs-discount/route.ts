import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getSalesVsDiscount } from "@/services/ReportService";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "view_reports");

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";
    const groupBy =
      (url.searchParams.get("groupBy") as "day" | "month") || "day";

    const data = await getSalesVsDiscount(from, to, groupBy);
    return NextResponse.json(data);
  } catch (error: any) {
    return handleAuthError(error);
  }
}
