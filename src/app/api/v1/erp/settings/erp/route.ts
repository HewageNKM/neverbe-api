import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getERPSettings, updateERPSettings } from "@/services/SettingService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    await requirePermission(req, "view_settings");

    const res = await getERPSettings();
    return NextResponse.json(res);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const PUT = async (req: NextRequest) => {
  try {
    await requirePermission(req, "update_settings");

    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const body = JSON.parse(dataString);
    const res = await updateERPSettings(body);
    return NextResponse.json(res);
  } catch (error: any) {
    return handleAuthError(error);
  }
};
