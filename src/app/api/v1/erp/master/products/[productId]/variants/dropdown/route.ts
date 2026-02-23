import { authorizeRequest } from "@/services/AuthService";
import { getProductVariantsForDropdown } from "@/services/VariantService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) => {
  try {
    const user = await authorizeRequest(req, "view_master_data");
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }
    const { productId } = await params;
    const res = await getProductVariantsForDropdown(productId);
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("GET Variants Dropdown Error:", error);
    return errorResponse(error);
  }
};
