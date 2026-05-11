import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getGRNById, updateGRNStatus } from "@/services/GRNService";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "view_grn");

    const { id } = await params;
    const grn = await getGRNById(id);

    if (!grn) {
      return NextResponse.json({ success: false, message: "GRN not found" }, { status: 404 });
    }

    return NextResponse.json(grn);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.status) {
      await requirePermission(req, "approve_grn");

      const grn = await updateGRNStatus(id, body.status);
      return NextResponse.json(grn);
    }

    return NextResponse.json({ success: false, message: "Invalid update" }, { status: 400 });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
