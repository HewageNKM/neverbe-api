import { NextRequest, NextResponse } from "next/server";
import { fetchLiveStock } from "@/services/ReportService";
import { authorizeRequest } from "@/services/AuthService";
import { errorResponse } from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const authorized = await authorizeRequest(req, "view_reports");
    if (!authorized) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const stockId = url.searchParams.get("stockId") || "";

    const data = await fetchLiveStock(stockId);
    return NextResponse.json(data);
  } catch (err: any) {
    return errorResponse(err);
  }
}
