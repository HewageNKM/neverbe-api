import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getProductVariantsForDropdown } from "@/services/VariantService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) => {
  try {
    await requirePermission(req, "view_master_data");

    const { productId } = await params;
    const res = await getProductVariantsForDropdown(productId);
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("GET Variants Dropdown Error:", error);
    return handleAuthError(error);
  }
};
