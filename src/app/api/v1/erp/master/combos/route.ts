import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getCombos, createCombo } from "@/services/ComboService";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    await requirePermission(req, "view_combos");

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "20");

    const result = await getCombos(page, size);
    return NextResponse.json(result);
  } catch (error: any) {
    return handleAuthError(error);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    await requirePermission(req, "create_combos");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawData = formData.get("data") as string;

    if (!rawData) {
      return NextResponse.json({ success: false, message: "Data is required" }, { status: 400 });
    }

    const comboData = JSON.parse(rawData);

    // Basic Validation
    if (!comboData.name || !comboData.items || comboData.items.length === 0) {
      return NextResponse.json({ success: false, message: "Name and at least one item required" }, { status: 400 });
    }

    const combo = await createCombo(comboData, file || undefined);
    return NextResponse.json(combo, { status: 201 });
  } catch (error: any) {
    return handleAuthError(error);
  }
};
