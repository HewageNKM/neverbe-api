import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getTaxReport } from "@/services/ReportService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_reports");
    if (!response) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (!from || !to) {
      return errorResponse("Missing required parameters: from, to", 400);
    }

    const data = await getTaxReport(from, to);
    return NextResponse.json(data);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
