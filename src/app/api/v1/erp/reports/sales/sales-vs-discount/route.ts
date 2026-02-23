import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getSalesVsDiscount } from "@/services/ReportService";
import { errorResponse } from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const authorized = await authorizeRequest(req, "view_reports");
    if (!authorized) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";
    const groupBy =
      (url.searchParams.get("groupBy") as "day" | "month") || "day";

    const data = await getSalesVsDiscount(from, to, groupBy);
    return NextResponse.json(data);
  } catch (error: any) {
    return errorResponse(error);
  }
}
