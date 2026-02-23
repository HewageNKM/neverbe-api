import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getRecentOrders } from "@/services/DashboardService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req, "view_dashboard");
    if (!response) return errorResponse("Unauthorized", 401);

    // Get optional limit from query params
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 6;

    const orders = await getRecentOrders(limit);

    return NextResponse.json(orders);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
