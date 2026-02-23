import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getPopularItems } from "@/services/DashboardService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req, "view_dashboard");
    if (!response) return errorResponse("Unauthorized", 401);

    // Get query params
    const url = new URL(req.url);
    const sizeParam = url.searchParams.get("size");
    const monthParam = url.searchParams.get("month");
    const yearParam = url.searchParams.get("year");

    const size = sizeParam ? parseInt(sizeParam, 10) : 10;
    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth();
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    const items = await getPopularItems(size, month, year);

    return NextResponse.json(items);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
