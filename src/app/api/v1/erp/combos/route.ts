import { authorizeRequest } from "@/services/AuthService";
import { getCombos, createCombo } from "@/services/ComboService";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req, "view_combos");
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "20");

    const result = await getCombos(page, size);
    return NextResponse.json(result);
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const user = await authorizeRequest(req, "create_combos");
    if (!user) return errorResponse("Unauthorized", 401);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    const rawItems = formData.get("items");
    const items = rawItems ? JSON.parse(rawItems as string) : [];

    const name = formData.get("name") as string;

    if (!name || items.length === 0) {
      return errorResponse("Name and at least one item required", 400);
    }

    const payload: UnparsedComboData = {
      name: name,
      description: formData.get("description") as string,
      items: items,
      originalPrice: Number(formData.get("originalPrice")),
      comboPrice: Number(formData.get("comboPrice")),
      savings: Number(formData.get("savings")),
      type: formData.get("type") as any,
      status: formData.get("status") as any,
      buyQuantity: formData.get("buyQuantity")
        ? Number(formData.get("buyQuantity"))
        : undefined,
      getQuantity: formData.get("getQuantity")
        ? Number(formData.get("getQuantity"))
        : undefined,
      getDiscount: formData.get("getDiscount")
        ? Number(formData.get("getDiscount"))
        : undefined,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
    };

    // Remove undefined keys
    Object.keys(payload).forEach(
      (key) =>
        payload[key as keyof UnparsedComboData] === undefined &&
        delete payload[key as keyof UnparsedComboData]
    );

    const combo = await createCombo(payload as any, file || undefined);
    return NextResponse.json(combo, { status: 201 });
  } catch (error: any) {
    return errorResponse(error);
  }
};

interface UnparsedComboData {
  name: string;
  description: string;
  items: any[];
  originalPrice: number;
  comboPrice: number;
  savings: number;
  type: string;
  status: string;
  buyQuantity?: number;
  getQuantity?: number;
  getDiscount?: number;
  startDate?: string;
  endDate?: string;
}
