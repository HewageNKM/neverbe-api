import { authorizeRequest } from "@/services/AuthService";
import { getDailySaleReport } from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: NextRequest) => {
  try {
    const authRes = await authorizeRequest(req, "view_reports");
    if (!authRes) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";

    const res = await getDailySaleReport(from, to);
    return NextResponse.json(res);
  } catch (error: any) {
    return errorResponse(error);
  }
};
