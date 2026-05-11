import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import {
  getShippingRules,
  createShippingRule,
} from "@/services/ShippingRuleService";
import { ShippingRule } from "@/model/ShippingRule";

export const GET = async (req: NextRequest) => {
  try {
    await requirePermission(req, "view_shipping");

    const rules = await getShippingRules();
    return NextResponse.json(rules);
  } catch (error) {
    return handleAuthError(error);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    await requirePermission(req, "update_shipping");
    const formData = await req.formData();
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json({ success: false, message: "Missing data field" }, { status: 400 });
    }

    const body = JSON.parse(dataString);
    const { name, minWeight, maxWeight, rate, isActive } = body;

    if (
      !name ||
      minWeight === undefined ||
      maxWeight === undefined ||
      rate === undefined
    ) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const newRule: Partial<ShippingRule> = {
      name,
      minWeight: Number(minWeight),
      maxWeight: Number(maxWeight),
      rate: Number(rate),
      isActive: isActive ?? true,
    };

    const id = await createShippingRule(newRule);

    return NextResponse.json(
      { id, message: "Shipping rule created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
};
