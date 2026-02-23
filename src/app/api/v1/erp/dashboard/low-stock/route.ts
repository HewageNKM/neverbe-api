import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getLowStockAlerts } from "@/services/DashboardService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_dashboard");
    if (!response) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const threshold = parseInt(url.searchParams.get("threshold") || "5");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const data = await getLowStockAlerts(threshold, limit);
    return NextResponse.json(data);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
