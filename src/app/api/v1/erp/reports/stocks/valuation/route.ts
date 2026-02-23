import { authorizeRequest } from "@/services/AuthService";
import { fetchStockValuationByStock } from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const user = await authorizeRequest(req, "view_reports");
    if (!user) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const stockId = url.searchParams.get("stockId") || "";

    const data = await fetchStockValuationByStock(stockId);

    return NextResponse.json(data);
  } catch (err: any) {
    return errorResponse(err);
  }
}
