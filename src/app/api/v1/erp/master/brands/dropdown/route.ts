import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getBrandDropdown } from "@/services/BrandService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    await requirePermission(req, "view_master_data");

    const res = await getBrandDropdown();
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("Get Brands Dropdown Error:", err);
    return handleAuthError(err);
  }
};
