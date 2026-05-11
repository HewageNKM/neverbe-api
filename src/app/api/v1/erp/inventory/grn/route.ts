import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getGRNs, createGRN } from "@/services/GRNService";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_grn");

    const url = new URL(req.url);
    const purchaseOrderId = url.searchParams.get("purchaseOrderId");
    const status = url.searchParams.get("status");

    const data = await getGRNs(
      purchaseOrderId || undefined,
      (status as any) || undefined,
    );
    return NextResponse.json(data);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const POST = async (req: Request) => {
  try {
    await requirePermission(req, "create_grn");

    const formData = await req.formData();
    const data = formData.get("data");

    if (!data) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const body = JSON.parse(data as string);
    const grn = await createGRN(body);
    return NextResponse.json(grn, { status: 201 });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
