import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getMonthlyComparison } from "@/services/DashboardService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_dashboard");
    if (!response) return errorResponse("Unauthorized", 401);

    const data = await getMonthlyComparison();
    return NextResponse.json(data);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
