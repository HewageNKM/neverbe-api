import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getSMSTemplates } from "@/services/TemplateService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_settings");
    if (!response) return errorResponse("Unauthorized", 401);

    const result = await getSMSTemplates();
    return NextResponse.json(result);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
