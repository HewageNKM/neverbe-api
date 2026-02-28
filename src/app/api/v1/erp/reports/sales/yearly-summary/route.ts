import { authorizeRequest } from "@/services/AuthService";
import { getYearlySummary } from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const authorized = await authorizeRequest(req, "view_reports");
    if (!authorized) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";
    const status = url.searchParams.get("status") || "Paid";

    const data = await getYearlySummary(from, to, status);
    return NextResponse.json(data);
  } catch (error: any) {
    return errorResponse(error);
  }
}
