import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { getExchangesByOrderId } from "@/services/ExchangeService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const authorized = await authorizeRequest(request, "view_orders");
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const exchanges = await getExchangesByOrderId(orderId);
    return NextResponse.json(exchanges);
  } catch (error: any) {
    console.error("Error fetching exchanges:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch exchanges" },
      { status: 500 },
    );
  }
}
