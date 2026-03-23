import { NextRequest, NextResponse } from "next/server";
import { getDomexTracking } from "@/services/TrackingService";
import { getOrder } from "@/services/OrderService";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) => {
  try {
    const orderId = (await context.params).orderId;
    if (!orderId) {
      return NextResponse.json({ message: "Order ID is required" }, { status: 400 });
    }

    // 1. Fetch order to get tracking number
    const order = await getOrder(orderId);
    if (!order.trackingNumber) {
      return NextResponse.json({ 
        message: "No tracking number available for this order",
        data: [] 
      }, { status: 200 });
    }

    // 2. Scrape live tracking data
    // Future expansion: Support multiple couriers based on order.courier
    const trackingHistory = await getDomexTracking(order.trackingNumber);

    return NextResponse.json({ 
      data: {
        trackingNumber: order.trackingNumber,
        courier: order.courier || "Domex",
        history: trackingHistory
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("[Tracking API] Error:", error.message);
    return NextResponse.json({ 
      data: {
        trackingNumber: null, 
        history: [],
        error: "Live tracking fetch failed"
      }
    }, { status: 200 });
  }
};
