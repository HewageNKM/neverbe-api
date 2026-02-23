import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getTaxSettings, updateTaxSettings } from "@/services/TaxService";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "view_tax_settings");
    if (!response) return errorResponse("Unauthorized", 401);

    const settings = await getTaxSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const PUT = async (req: Request) => {
  try {
    const response = await authorizeRequest(req, "update_tax_settings");
    if (!response) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const settings = await updateTaxSettings(body);
    return NextResponse.json(settings);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const dynamic = "force-dynamic";
