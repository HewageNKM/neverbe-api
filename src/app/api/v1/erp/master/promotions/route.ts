import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getPromotions, createPromotion } from "@/services/PromotionService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    await requirePermission(req, "view_promotions");

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "20");
    const filterStatus = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;

    const result = await getPromotions(page, size, filterStatus, search, type);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/v2/promotions Error:", error);
    return handleAuthError(error);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    await requirePermission(req, "create_promotions");

    const formData = await req.formData();
    const file = formData.get("banner") as File | null;
    const rawData = formData.get("data") as string;

    if (!rawData) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const data = JSON.parse(rawData);

    // Basic validation
    if (!data.name || !data.type) {
      return NextResponse.json({ success: false, message: "Name and Type are required" }, { status: 400 });
    }

    const promotion = await createPromotion(data, file);
    return NextResponse.json(promotion, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/v2/promotions Error:", error);
    return handleAuthError(error);
  }
};
