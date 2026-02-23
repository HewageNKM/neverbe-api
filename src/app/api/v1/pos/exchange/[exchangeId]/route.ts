import { NextRequest, NextResponse } from "next/server";
import {
  getExchangeById,
  getExchangesByOrderId,
} from "@/services/ExchangeService";
import { verifyPosAuth, handleAuthError } from "@/services/AuthService";
import { errorResponse } from "@/utils/apiResponse";

/**
 * GET - Get exchange record by ID or by order ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ exchangeId: string }> }
) {
  try {
    await verifyPosAuth("view_pos_exchanges");

    const exchangeId = (await params).exchangeId;
    const { searchParams } = new URL(request.url);
    const byOrderId = searchParams.get("byOrderId") === "true";

    // If byOrderId flag, treat exchangeId as orderId and return all exchanges
    if (byOrderId) {
      const exchanges = await getExchangesByOrderId(exchangeId);
      return NextResponse.json(exchanges);
    }

    // Otherwise, get single exchange by ID
    const exchange = await getExchangeById(exchangeId);

    if (!exchange) {
      return errorResponse(`Exchange ${exchangeId} not found`, 404);
    }

    return NextResponse.json(exchange);
  } catch (error: any) {
    return handleAuthError(error);
  }
}
