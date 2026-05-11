import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getRefundsAndReturns } from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    await requirePermission(req, "view_reports");

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;

    const data = await getRefundsAndReturns(from, to);

    return NextResponse.json(data);
  } catch (error: any) {
    return handleAuthError(error);
  }
};
