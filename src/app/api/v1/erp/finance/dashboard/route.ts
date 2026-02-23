import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getFinanceDashboardData } from "@/services/FinanceDashboardService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_finance");
    if (!response) return errorResponse("Unauthorized", 401);

    const data = await getFinanceDashboardData();
    return NextResponse.json(data);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
