import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getSalesByPaymentMethod } from "@/services/ReportService";
import { errorResponse } from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeRequest(req, "view_reports");
    if (!auth) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;

    const data = await getSalesByPaymentMethod(from, to);
    return NextResponse.json(data);
  } catch (error: any) {
    return errorResponse(error);
  }
}
