import { NextResponse } from "next/server";
import { getPaymentMethods } from "@/services/POSService";
import { handleAuthError, verifyPosAuth } from "@/services/AuthService";

// GET - Fetch payment methods for POS
export async function GET() {
  try {
    await verifyPosAuth("access_pos");

    const methods = await getPaymentMethods();
    return NextResponse.json(methods);
  } catch (error: any) {
    return handleAuthError(error);
  }
}
