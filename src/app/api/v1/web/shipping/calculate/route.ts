import { NextRequest, NextResponse } from "next/server";
import { calculateShippingCost } from "@/services/ShippingService";
import { handleAuthError } from "@/services/AuthService";

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ cost: 0 });
    }

    const data = JSON.parse(dataString);
    const { items } = data || {};

    const cost = await calculateShippingCost(items || []);

    return NextResponse.json({ cost });
  } catch (error) {
    return handleAuthError(error);
  }
};
