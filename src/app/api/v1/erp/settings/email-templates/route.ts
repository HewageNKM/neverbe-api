import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getEmailTemplates } from "@/services/SettingsService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_settings");

    const result = await getEmailTemplates();
    return NextResponse.json(result);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
