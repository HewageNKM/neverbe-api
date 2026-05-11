import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError } from "@/services/AuthService";
import { getExchangesByOrderId } from "@/services/ExchangeService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    await requirePermission(request, "view_orders");

    const exchanges = await getExchangesByOrderId(orderId);
    return NextResponse.json(exchanges);
  } catch (error: any) {
    return handleAuthError(error);
  }
}
