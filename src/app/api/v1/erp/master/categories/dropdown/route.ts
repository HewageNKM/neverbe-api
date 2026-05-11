import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getCategoriesForDropdown } from "@/services/CategoryService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    await requirePermission(req, "view_master_data");

    const res = await getCategoriesForDropdown();
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("Get Categories Dropdown Error:", err);
    return handleAuthError(err);
  }
};
