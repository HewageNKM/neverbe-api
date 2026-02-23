import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import {
  getNavigationConfig,
  saveNavigationConfig,
} from "@/services/WebsiteService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_website");
    if (!response) {
      return errorResponse("Unauthorized", 401);
    }
    const config = await getNavigationConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    console.error("[Navigation API] Error:", error);
    return errorResponse(error);
  }
};

export const POST = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_website");
    if (!response) {
      return errorResponse("Unauthorized", 401);
    }
    const body = await req.json();
    await saveNavigationConfig(body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Navigation API] Error:", error);
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
