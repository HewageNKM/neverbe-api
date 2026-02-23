import { authorizeRequest } from "@/services/AuthService";
import { fetchLowStock } from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const user = await authorizeRequest(req, "view_reports");
    if (!user) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const threshold = parseInt(url.searchParams.get("threshold") || "10", 10);
    const stockId = url.searchParams.get("stockId") || "";

    const data = await fetchLowStock(threshold, stockId);

    return NextResponse.json(data);
  } catch (err: any) {
    return errorResponse(err);
  }
}
