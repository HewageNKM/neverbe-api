import { authorizeRequest } from "@/services/AuthService";
import { getStockForDropdown } from "@/services/StockService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req, "view_master_data");
    if (!user) return errorResponse("Unauthorized", 401);

    const res = await getStockForDropdown();
    return NextResponse.json(res);
  } catch (err: any) {
    return errorResponse(err);
  }
};
