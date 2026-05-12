import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { updateEmailTemplate } from "@/services/SettingsService";

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "update_settings");

    const { id } = await params;
    const body = await req.json();
    const result = await updateEmailTemplate(id, body);
    return NextResponse.json(result);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
