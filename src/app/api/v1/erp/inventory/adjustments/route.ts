import { NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  getAdjustments,
  createAdjustment,
} from "@/services/InventoryAdjustmentService";
import { AdjustmentType } from "@/model/InventoryAdjustment";

export const GET = async (req: Request) => {
  try {
    await requirePermission(req, "view_adjustments");

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const type = url.searchParams.get("type") as AdjustmentType | null;
    const status = url.searchParams.get("status") as any | null; 
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = parseInt(url.searchParams.get("size") || "20", 10);

    const data = await getAdjustments(
      page,
      size,
      search,
      type || undefined,
      status || undefined,
    );
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Adjustments API] Error:", error);
    return handleAuthError(error);
  }
};

export const POST = async (req: Request) => {
  try {
    const decodedToken = await requirePermission(req, "update_inventory");

    const formData = await req.formData();
    const data = formData.get("data");

    if (!data) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const body = JSON.parse(data as string);
    const adjustment = await createAdjustment(body, decodedToken.uid);
    return NextResponse.json(adjustment, { status: 201 });
  } catch (error: any) {
    console.error("[Adjustments API] Error:", error);
    return handleAuthError(error);
  }
};

export const dynamic = "force-dynamic";
