import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getSizeDropdown } from "@/services/SizeService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    await requirePermission(req, "view_master_data");

    const res = await getSizeDropdown();
    return NextResponse.json(res);
  } catch (err: any) {
    return handleAuthError(err);
  }
};
