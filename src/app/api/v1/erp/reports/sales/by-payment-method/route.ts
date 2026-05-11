import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getSalesByPaymentMethod } from "@/services/ReportService";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "view_reports");

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;

    const data = await getSalesByPaymentMethod(from, to);
    return NextResponse.json(data);
  } catch (error: any) {
    return handleAuthError(error);
  }
}
