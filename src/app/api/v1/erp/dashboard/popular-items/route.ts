import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getPopularItems } from "@/services/DashboardService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_dashboard");

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
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
