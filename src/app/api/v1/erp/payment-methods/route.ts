import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import {
  getPaymentMethods,
  createPaymentMethod,
} from "@/services/PaymentMethodService";
import { errorResponse } from "@/utils/apiResponse";

// GET: List all payment methods
export async function GET(req: Request) {
  try {
    const authorized = await authorizeRequest(req, "view_payment_methods");
    if (!authorized) return errorResponse("Unauthorized", 401);

    const methods = await getPaymentMethods();
    return NextResponse.json(methods);
  } catch (error: any) {
    return errorResponse(error);
  }
}

// POST: Create a new payment method
export async function POST(req: Request) {
  try {
    const authorized = await authorizeRequest(req, "manage_payment_methods");
    if (!authorized) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const { name, fee, status, available, description, paymentId } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newMethod = await createPaymentMethod({
      name,
      fee: Number(fee) || 0,
      status: status === true,
      available: Array.isArray(available) ? available : ["Store"],
      description: description || "",
      paymentId: paymentId || `pm-${Math.floor(Math.random() * 1000)}`,
    });

    return NextResponse.json({ success: true, method: newMethod });
  } catch (error: any) {
    return errorResponse(error);
  }
}
