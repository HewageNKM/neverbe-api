import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import {
  getShippingRules,
  createShippingRule,
} from "@/services/ShippingRuleService";
import { ShippingRule } from "@/model/ShippingRule";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: NextRequest) => {
  try {
    const authorized = await authorizeRequest(req, "view_shipping");
    if (!authorized) return errorResponse("Unauthorized", 401);

    const rules = await getShippingRules();
    return NextResponse.json(rules);
  } catch (error) {
    return errorResponse(error);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const authorized = await authorizeRequest(req, "update_shipping");
    if (!authorized) return errorResponse("Unauthorized", 401);
    const body = await req.json();
    const { name, minWeight, maxWeight, rate, isActive } = body;

    if (
      !name ||
      minWeight === undefined ||
      maxWeight === undefined ||
      rate === undefined
    ) {
      return errorResponse("Missing required fields", 400);
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
    return errorResponse(error);
  }
};
