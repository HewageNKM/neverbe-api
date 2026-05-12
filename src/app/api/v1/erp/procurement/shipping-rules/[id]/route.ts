import { NextRequest, NextResponse } from "next/server";
import {
  updateShippingRule,
  deleteShippingRule,
} from "@/services/SettingsService";
import { requirePermission, handleAuthError } from "@/services/AuthService";

export const PUT = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "update_shipping");

    const { id } = await context.params;
    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const body = JSON.parse(dataString);

    await updateShippingRule(id, body);

    return NextResponse.json({ message: "Shipping rule updated successfully" });
  } catch (error) {
    return handleAuthError(error);
  }
};

export const DELETE = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    await requirePermission(req, "update_shipping");

    const { id } = await context.params;
    await deleteShippingRule(id);
    return NextResponse.json({ message: "Shipping rule deleted successfully" });
  } catch (error) {
    return handleAuthError(error);
  }
};
