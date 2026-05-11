import { requirePermission, handleAuthError } from "@/services/AuthService";
import { updateCoupon, deleteCoupon } from "@/services/PromotionService";
import { NextRequest, NextResponse } from "next/server";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export const GET = async (req: NextRequest, { params }: Props) => {
  try {
    await requirePermission(req, "view_coupons");
    return NextResponse.json({ success: false, message: "Not implemented fetching by ID yet, use list" }, { status: 501 });
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const PUT = async (req: NextRequest, { params }: Props) => {
  try {
    await requirePermission(req, "update_coupons");

    const { id } = await params;
    const formData = await req.formData();
    const rawData = formData.get("data") as string;

    if (!rawData) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const data = JSON.parse(rawData);
    const updated = await updateCoupon(id, data);
    return NextResponse.json(updated);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const DELETE = async (req: NextRequest, { params }: Props) => {
  try {
    await requirePermission(req, "delete_coupons");

    const { id } = await params;
    const result = await deleteCoupon(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return handleAuthError(error);
  }
};
