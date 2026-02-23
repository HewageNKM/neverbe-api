import { authorizeRequest } from "@/services/AuthService";
import { getCashFlowReport } from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const authorized = await authorizeRequest(req, "view_reports");
    if (!authorized) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";

    const res = await getCashFlowReport(from, to);
    return NextResponse.json(res);
  } catch (error: any) {
    return errorResponse(error);
  }
}
