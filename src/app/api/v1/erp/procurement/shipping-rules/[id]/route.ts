import { NextRequest, NextResponse } from "next/server";
import {
  updateShippingRule,
  deleteShippingRule,
} from "@/services/ShippingRuleService";
import { errorResponse } from "@/utils/apiResponse";

export const PUT = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return errorResponse("Missing data field", 400);
    }

    const body = JSON.parse(dataString);

    await updateShippingRule(id, body);

    return NextResponse.json({ message: "Shipping rule updated successfully" });
  } catch (error) {
    return errorResponse(error);
  }
};

export const DELETE = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
    await deleteShippingRule(id);
    return NextResponse.json({ message: "Shipping rule deleted successfully" });
  } catch (error) {
    return errorResponse(error);
  }
};
