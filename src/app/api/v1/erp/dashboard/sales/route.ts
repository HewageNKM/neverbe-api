import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getYearlySalesPerformance } from "@/services/DashboardService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req, "view_dashboard");
    if (!response) return errorResponse("Unauthorized", 401);

    // Get optional year from query params
    const url = new URL(req.url);
    const yearParam = url.searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : undefined;

    const salesData = await getYearlySalesPerformance(year);

    return NextResponse.json(salesData);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
