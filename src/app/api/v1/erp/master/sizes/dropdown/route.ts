import { authorizeRequest } from "@/services/AuthService";
import { getSizeDropdown } from "@/services/SizeService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req, "view_master_data");
    if (!user) return errorResponse("Unauthorized", 401);

    const res = await getSizeDropdown();
    return NextResponse.json(res);
  } catch (err: any) {
    return errorResponse(err);
  }
};
