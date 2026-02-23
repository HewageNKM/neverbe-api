import { NextRequest, NextResponse } from "next/server";
import { createPOSOrder } from "@/services/POSService";
import { verifyPosAuth, handleAuthError } from "@/services/AuthService";

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyPosAuth("create_pos_orders");
    const body = await request.json();
    const order = await createPOSOrder(body, decodedToken.uid);
    return NextResponse.json({ order });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
