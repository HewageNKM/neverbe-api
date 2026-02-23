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
    const body = await req.json();

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
