import { authorizeRequest } from "@/services/AuthService";
import { getRefundsAndReturns } from "@/services/ReportService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: NextRequest) => {
  try {
    const auth = await authorizeRequest(req);
    if (!auth) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;

    const data = await getRefundsAndReturns(from, to);

    return NextResponse.json(data);
  } catch (error: any) {
    return errorResponse(error);
  }
};
