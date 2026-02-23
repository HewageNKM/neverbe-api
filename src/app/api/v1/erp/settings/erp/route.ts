import { authorizeRequest } from "@/services/AuthService";
import { getERPSettings, updateERPSettings } from "@/services/SettingService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: NextRequest) => {
  try {
    // Verify the ID token and permission
    const response = await authorizeRequest(req, "view_settings");
    if (!response) return errorResponse("Unauthorized", 401);

    const res = await getERPSettings();
    return NextResponse.json(res);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const PUT = async (req: NextRequest) => {
  try {
    // Verify the ID token and permission
    const response = await authorizeRequest(req, "update_settings");
    if (!response) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const res = await updateERPSettings(body);
    return NextResponse.json(res);
  } catch (error: any) {
    return errorResponse(error);
  }
};
