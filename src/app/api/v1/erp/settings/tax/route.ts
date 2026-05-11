import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getTaxSettings, updateTaxSettings } from "@/services/TaxService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_tax_settings");

    const settings = await getTaxSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const PUT = async (req: Request) => {
  try {
    await requirePermission(req, "update_tax_settings");

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const body = JSON.parse(dataString);
    const settings = await updateTaxSettings(body);
    return NextResponse.json(settings);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
