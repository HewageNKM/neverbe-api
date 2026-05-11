import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  getNavigationConfig,
  saveNavigationConfig,
} from "@/services/WebsiteService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_website");
    const config = await getNavigationConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const POST = async (req: Request) => {
  try {
    await requirePermission(req, "update_website");
    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const body = JSON.parse(dataString);
    await saveNavigationConfig(body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
