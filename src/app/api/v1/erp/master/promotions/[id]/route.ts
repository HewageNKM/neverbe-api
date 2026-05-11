import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  getPromotionById,
  updatePromotion,
  deletePromotion,
} from "@/services/PromotionService";
import { NextRequest, NextResponse } from "next/server";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export const GET = async (req: NextRequest, { params }: Props) => {
  try {
    await requirePermission(req, "view_promotions");

    const { id } = await params;
    const promotion = await getPromotionById(id);
    if (!promotion) {
      return NextResponse.json({ success: false, message: "Promotion not found" }, { status: 404 });
    }
    return NextResponse.json(promotion);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const PUT = async (req: NextRequest, { params }: Props) => {
  try {
    await requirePermission(req, "update_promotions");

    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get("banner") as File | null;
    const rawData = formData.get("data") as string;

    if (!rawData) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const data = JSON.parse(rawData);

    const updated = await updatePromotion(id, data, file);
    return NextResponse.json(updated);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const DELETE = async (req: NextRequest, { params }: Props) => {
  try {
    await requirePermission(req, "delete_promotions");

    const { id } = await params;
    const result = await deletePromotion(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return handleAuthError(error);
  }
};
