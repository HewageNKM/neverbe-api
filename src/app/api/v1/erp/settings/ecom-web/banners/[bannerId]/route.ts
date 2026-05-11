import { requirePermission, handleAuthError } from "@/services/AuthService";
import { deleteBanner } from "@/services/WebsiteService";
import { NextResponse } from "next/server";

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ bannerId: string }> }
) => {
  try {
    await requirePermission(req, "update_website");
    
    const { bannerId } = await params;
    const writeResult = await deleteBanner(bannerId);
    return NextResponse.json(writeResult);
  } catch (error: any) {
    return handleAuthError(error);
  }
};
