import { handleAuthError, verifyPosAuth } from "@/services/AuthService";
import { getOrderByOrderId } from "@/services/POSService";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch/Search POS orders
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await verifyPosAuth("view_pos_orders");
    const orderId = (await params).orderId;

    const order = await getOrderByOrderId(orderId);
    return NextResponse.json(order);
  } catch (error: any) {
    return handleAuthError(error);
  }
}
