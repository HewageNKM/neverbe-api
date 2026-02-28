import { authorizeRequest } from "@/services/AuthService";
import { getBrandDropdown } from "@/services/BrandService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req, "view_master_data");
    if (!user) return errorResponse("Unauthorized", 401);

    const res = await getBrandDropdown();
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("Get Brands Dropdown Error:", err);
    return errorResponse(err);
  }
};
