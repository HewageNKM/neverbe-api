import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getPopularProducts } from "@/services/ProductService";

export const GET = async (req: NextRequest) => {
  try {
    await requirePermission(req, "view_master_data");

    const size = Number.parseInt(req.nextUrl.searchParams.get("size") || "0");
    const startDate = req.nextUrl.searchParams.get("startDate") || "";
    const endDate = req.nextUrl.searchParams.get("endDate") || "";

    const product = await getPopularProducts(startDate, endDate, size);

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    return handleAuthError(error);
  }
};
