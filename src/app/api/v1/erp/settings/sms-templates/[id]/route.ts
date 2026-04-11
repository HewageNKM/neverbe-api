import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { updateSMSTemplate } from "@/services/TemplateService";
import { errorResponse } from "@/utils/apiResponse";

export const PUT = async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  try {
    const response = await authorizeRequest(req, "update_settings");
    if (!response) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const result = await updateSMSTemplate(params.id, body);
    return NextResponse.json(result);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
