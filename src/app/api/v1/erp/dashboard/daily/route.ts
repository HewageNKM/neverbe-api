import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getDailySnapshot } from "@/services/DashboardService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req, "view_dashboard");
    if (!response) return errorResponse("Unauthorized", 401);

    const overview = await getDailySnapshot();
    return NextResponse.json(overview);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
