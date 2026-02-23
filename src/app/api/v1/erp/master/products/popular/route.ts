import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getPopularProducts } from "@/services/ProductService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req, "view_master_data");
    if (!user) return errorResponse("Unauthorized", 401);

    const size = Number.parseInt(req.nextUrl.searchParams.get("size") || "0");
    const startDate = req.nextUrl.searchParams.get("startDate") || "";
    const endDate = req.nextUrl.searchParams.get("endDate") || "";

    const product = await getPopularProducts(startDate, endDate, size);

    // If service returns null but no error, we might want 404.
    if (!product) {
      return errorResponse("Product not found", 404);
    }

    return NextResponse.json(product);
  } catch (error: any) {
    return errorResponse(error);
  }
};
